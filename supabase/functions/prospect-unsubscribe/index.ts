// Désinscription (opt-out RGPD). Appelée par la page /desinscription (front, clé
// anon) avec le jeton. Gère les PROSPECTS (B2B) et les LEADS (B2C nurturing).
// Silencieuse et idempotente : même réponse que le jeton existe ou non.

import { serviceClient } from '../_shared/db.ts';
import { handleOptions, json } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;

  try {
    const { token } = (await req.json()) as { token?: string };
    if (!token) return json({ error: 'Token manquant.' }, 400);

    const db = serviceClient();
    const { data: p } = await db
      .from('prospects')
      .select('id, list_id')
      .eq('unsubscribe_token', token)
      .maybeSingle();

    // Réponse identique que le token existe ou non (ne rien divulguer).
    if (p) {
      await db.from('prospects').update({ stage: 'unsubscribed' }).eq('id', p.id);
      await db
        .from('prospect_events')
        .insert({ prospect_id: p.id, list_id: p.list_id, type: 'unsubscribe', status: 'unsubscribed' });
    } else {
      // Sinon, c'est peut-être un lead B2C (séquence de nurturing) : on l'opt-out.
      const { data: l } = await db
        .from('leads')
        .select('id')
        .eq('unsubscribe_token', token)
        .maybeSingle();
      if (l) {
        await db.from('leads').update({ statut: 'desinscrit', next_email_at: null }).eq('id', l.id);
      }
    }
    return json({ ok: true });
  } catch (err) {
    console.error(err);
    return json({ error: 'Erreur.' }, 500);
  }
});
