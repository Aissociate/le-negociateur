// Agent "Nurturing" : exécuté par cron toutes les 15 minutes.
// Envoie l'email suivant de la séquence (4 emails) aux leads arrivés à échéance.
// Idempotent et par lots (≤ 20 leads par tick) pour rester dans les limites Edge.

import { serviceClient } from '../_shared/db.ts';
import { json } from '../_shared/cors.ts';
import { sendEmail } from '../_shared/email.ts';
import { renderTemplate } from '../_shared/llm.ts';

const BATCH_SIZE = 20;

Deno.serve(async (_req) => {
  const db = serviceClient();
  const siteUrl = Deno.env.get('SITE_URL') ?? 'http://localhost:5173';

  const { data: sequences } = await db
    .from('email_sequences')
    .select('*')
    .eq('active', true)
    .order('step');
  if (!sequences?.length) return json({ sent: 0, reason: 'aucune séquence active' });
  const maxStep = Math.max(...sequences.map((s) => s.step));

  const { data: leads } = await db
    .from('leads')
    .select('*')
    .eq('statut', 'lead')
    .lt('sequence_step', maxStep)
    .lte('next_email_at', new Date().toISOString())
    .not('next_email_at', 'is', null)
    .order('next_email_at')
    .limit(BATCH_SIZE);

  let sent = 0;
  for (const lead of leads ?? []) {
    const nextStep = lead.sequence_step + 1;
    const template = sequences.find((s) => s.step === nextStep);

    // Étape inexistante ou désactivée : on saute à la suivante sans envoyer
    if (!template) {
      const following = sequences.find((s) => s.step > nextStep);
      await db
        .from('leads')
        .update({
          sequence_step: nextStep,
          next_email_at: following
            ? new Date(
                new Date(lead.created_at).getTime() + following.delay_hours * 3600 * 1000
              ).toISOString()
            : null,
        })
        .eq('id', lead.id);
      continue;
    }

    const vars = {
      poste: lead.poste ?? 'votre poste',
      gap_annual: Math.max(0, lead.gap_annual ?? 0).toLocaleString('fr-FR'),
      gap_percent: Math.abs(lead.gap_percent ?? 0),
      kit_url: `${siteUrl}/kit`,
      report_url: lead.last_report_id ? `${siteUrl}/rapport/${lead.last_report_id}` : `${siteUrl}/`,
    };

    try {
      await sendEmail(lead.email, renderTemplate(template.subject, vars), renderTemplate(template.body_html, vars));
      await db.from('email_events').insert({ lead_id: lead.id, step: nextStep, status: 'sent' });
    } catch (err) {
      await db.from('email_events').insert({
        lead_id: lead.id,
        step: nextStep,
        status: 'error',
        error: err instanceof Error ? err.message : String(err),
      });
    }

    // Programmer l'étape suivante (basée sur la date de capture, pas la date d'envoi)
    const following = sequences.find((s) => s.step > nextStep);
    await db
      .from('leads')
      .update({
        sequence_step: nextStep,
        next_email_at: following
          ? new Date(
              new Date(lead.created_at).getTime() + following.delay_hours * 3600 * 1000
            ).toISOString()
          : null,
      })
      .eq('id', lead.id);
    sent++;
  }

  return json({ sent });
});
