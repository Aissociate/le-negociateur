// Agent "Nurturing" : exécuté par cron (toutes les 15 min).
// Envoie l'email suivant de la séquence aux leads arrivés à échéance.
// Idempotent et par lots (≤ 20 leads par tick) pour rester dans les limites Edge.

import { serviceClient } from '../_shared/db.ts';
import { json } from '../_shared/cors.ts';
import { sendEmail } from '../_shared/email.ts';
import { callLLM, renderTemplate } from '../_shared/llm.ts';

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

  // Contexte rapport (pour personnaliser les relances) — un seul fetch par lot.
  const reportIds = [...new Set((leads ?? []).map((l) => l.last_report_id).filter(Boolean))];
  const reportsById = new Map<string, Record<string, unknown>>();
  if (reportIds.length) {
    const { data: reps } = await db.from('gap_reports').select('*').in('id', reportIds);
    for (const r of reps ?? []) reportsById.set(r.id as string, r);
  }

  let sent = 0;
  for (const lead of leads ?? []) {
    const nextStep = lead.sequence_step + 1;
    const template = sequences.find((s) => s.step === nextStep);

    const scheduleFollowing = async () => {
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
    };

    // Étape inexistante / désactivée : on saute sans envoyer
    if (!template) {
      await scheduleFollowing();
      continue;
    }

    const report = lead.last_report_id ? reportsById.get(lead.last_report_id) : undefined;
    const num = (v: unknown) => Number(v ?? 0).toLocaleString('fr-FR');
    const vars = {
      poste: lead.poste ?? 'votre poste',
      secteur: lead.secteur ?? '',
      seniorite: lead.seniorite ?? '',
      localisation: lead.localisation ?? '',
      gap_annual: Math.max(0, lead.gap_annual ?? 0).toLocaleString('fr-FR'),
      gap_percent: Math.abs(lead.gap_percent ?? 0),
      segment: lead.segment ?? '',
      tension: report?.metier_en_tension ? 'oui' : 'non',
      market_low: num(report?.market_low),
      market_median: num(report?.market_median),
      market_high: num(report?.market_high),
      step: nextStep,
      theme: template.subject,
      kit_url: lead.last_report_id ? `${siteUrl}/kit?report=${lead.last_report_id}` : `${siteUrl}/kit`,
      report_url: lead.last_report_id ? `${siteUrl}/rapport/${lead.last_report_id}` : `${siteUrl}/`,
    };

    // Contenu sur-mesure (agent `email_relance`) avec repli sur le template statique
    // si l'agent est absent / désactivé / échoue (zéro régression).
    let subject = renderTemplate(template.subject, vars);
    let html = renderTemplate(template.body_html, vars);
    try {
      const out = await callLLM(db, 'email_relance', vars, { jsonMode: true });
      const parsed = JSON.parse(out.text) as { subject?: string; body?: string };
      if (parsed.subject && parsed.body) {
        subject = parsed.subject.slice(0, 160);
        html = parsed.body;
      }
    } catch (_) {
      /* repli template statique */
    }

    // Pied de page de désinscription (conformité RGPD/CNIL) sur toutes les relances.
    const unsubUrl = `${siteUrl}/desinscription?token=${lead.unsubscribe_token ?? ''}`;
    html +=
      `<p style="font-size:12px;color:#888;margin-top:24px">` +
      `Tu reçois cet email car tu as demandé ton analyse de positionnement salarial. ` +
      `<a href="${unsubUrl}">Se désinscrire en un clic</a>.</p>`;

    try {
      await sendEmail(lead.email, subject, html);
      await db.from('email_events').insert({ lead_id: lead.id, step: nextStep, status: 'sent' });
    } catch (err) {
      await db.from('email_events').insert({
        lead_id: lead.id,
        step: nextStep,
        status: 'error',
        error: err instanceof Error ? err.message : String(err),
      });
    }

    await scheduleFollowing();
    sent++;
  }

  return json({ sent });
});
