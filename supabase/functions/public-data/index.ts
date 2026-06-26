// Lectures publiques contrôlées (les tables sont fermées côté RLS) :
//   ?report=<uuid>          -> rapport d'écart (inclut metier_en_tension)
//   ?kit=<token>            -> livrable Kit (contenu markdown)
//   ?order_session=<cs_...> -> { token } si le Kit de cette commande est prêt
// Les identifiants (uuid / token aléatoires) servent de capacité d'accès.

import { serviceClient } from '../_shared/db.ts';
import { handleOptions, json } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;

  const url = new URL(req.url);
  const db = serviceClient();

  const reportId = url.searchParams.get('report');
  if (reportId) {
    const { data } = await db.from('gap_reports').select('*').eq('id', reportId).maybeSingle();
    return data ? json(data) : json({ error: 'Introuvable' }, 404);
  }

  const kitToken = url.searchParams.get('kit');
  if (kitToken) {
    const { data } = await db
      .from('deliverables')
      .select('content_md, type, created_at')
      .eq('access_token', kitToken)
      .maybeSingle();
    return data ? json(data) : json({ error: 'Introuvable' }, 404);
  }

  const session = url.searchParams.get('order_session');
  if (session) {
    const { data: order } = await db
      .from('orders')
      .select('id')
      .eq('stripe_session_id', session)
      .maybeSingle();
    if (!order) return json({ token: null });
    const { data: deliverable } = await db
      .from('deliverables')
      .select('access_token')
      .eq('order_id', order.id)
      .maybeSingle();
    return json({ token: deliverable?.access_token ?? null });
  }

  return json({ error: 'Paramètre manquant' }, 400);
});
