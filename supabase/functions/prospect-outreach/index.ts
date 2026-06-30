// Agent commercial — ENVOI : email de prospection personnalisé aux prospects
// enrichis des listes activées (outreach_active = true). Cadence pilotée par le
// cron (lots). Opt-out garanti (pied de page de désinscription). Idempotent :
// chaque prospect est tenté une seule fois puis passé en 'contacted'.

import { serviceClient } from '../_shared/db.ts';
import { json } from '../_shared/cors.ts';
import { sendEmail } from '../_shared/email.ts';
import { callLLM } from '../_shared/llm.ts';

const BATCH = 25; // cadence par tick (préserve la délivrabilité)

Deno.serve(async (_req) => {
  const db = serviceClient();
  const siteUrl = Deno.env.get('SITE_URL') ?? 'http://localhost:5173';

  // Listes dont l'envoi est activé.
  const { data: lists } = await db.from('prospect_lists').select('id').eq('outreach_active', true);
  const listIds = (lists ?? []).map((l) => l.id);
  if (!listIds.length) return json({ sent: 0, reason: 'aucune liste active' });

  // Prospects prêts : enrichis, avec email, jamais contactés ni désinscrits.
  const { data: prospects } = await db
    .from('prospects')
    .select('*')
    .in('list_id', listIds)
    .eq('stage', 'enriched')
    .not('email', 'is', null)
    .order('score', { ascending: false })
    .limit(BATCH);

  let sent = 0;
  let errors = 0;

  for (const p of prospects ?? []) {
    if (!p.email) continue;
    const unsubUrl = `${siteUrl}/desinscription?token=${p.unsubscribe_token}`;
    const markContacted = () =>
      db.from('prospects').update({ stage: 'contacted', contacted_at: new Date().toISOString() }).eq('id', p.id);

    try {
      // Contexte issu de la recherche web (enrichissement) pour un email sur-mesure.
      const research = (p.enrichment?.research ?? null) as
        | { summary?: string; company_context?: string; role_context?: string; hooks?: string[] }
        | null;
      const researchText = research
        ? [
            research.summary && `Synthèse : ${research.summary}`,
            research.company_context && `Société : ${research.company_context}`,
            research.role_context && `Rôle : ${research.role_context}`,
          ]
            .filter(Boolean)
            .join('\n')
        : 'n/c';

      const out = await callLLM(
        db,
        'email_prospection',
        {
          first_name: p.first_name ?? p.full_name ?? '',
          title: p.title ?? '',
          company: p.company ?? '',
          secteur: p.secteur ?? '',
          angle: (p.enrichment?.angle as string) ?? '',
          research: researchText,
          hooks: (research?.hooks ?? []).join(' | ') || 'n/c',
          cta_url: `${siteUrl}/`,
        },
        { jsonMode: true }
      );

      let parsed: { subject?: string; body?: string } = {};
      try {
        parsed = JSON.parse(out.text);
      } catch {
        parsed = {};
      }
      const subject = (parsed.subject || 'Ta rémunération est-elle au niveau du marché ?').slice(0, 160);
      const footer =
        `<p style="font-size:12px;color:#888;margin-top:24px">` +
        `Tu reçois cet email dans le cadre d'une prospection professionnelle B2B (intérêt légitime). ` +
        `<a href="${unsubUrl}">Se désinscrire en un clic</a>.</p>`;
      const body = (parsed.body || '<p>Bonjour,</p>') + footer;

      await sendEmail(p.email, subject, body);
      await markContacted();
      await db
        .from('prospect_events')
        .insert({ prospect_id: p.id, list_id: p.list_id, type: 'email', subject, status: 'sent' });
      sent++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Tentative unique : on passe en 'contacted' pour ne pas reboucler (et regénérer
      // un email payant) sur une erreur dure (email invalide, etc.). Trace dans le journal.
      await markContacted();
      await db
        .from('prospect_events')
        .insert({ prospect_id: p.id, list_id: p.list_id, type: 'email', status: 'error', error: msg });
      errors++;
    }
  }

  return json({ sent, errors });
});
