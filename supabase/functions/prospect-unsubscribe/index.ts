// Désinscription d'un prospect (opt-out RGPD). Appelée par la page /desinscription
// (front, clé anon) avec le jeton. Silencieuse et idempotente.

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
    }
    return json({ ok: true });
  } catch (err) {
    console.error(err);
    return json({ error: 'Erreur.' }, 500);
  }
});
