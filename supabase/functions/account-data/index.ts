// Données de l'espace client : factures (commandes), documents (livrables) et
// droits d'accès (entitlements), pour l'utilisateur connecté (magic link).

import { serviceClient } from '../_shared/db.ts';
import { handleOptions, json } from '../_shared/cors.ts';
import { getUserEmail } from '../_shared/auth.ts';
import { getEntitlements } from '../_shared/entitlements.ts';

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;

  const email = await getUserEmail(req);
  if (!email) return json({ error: 'Non authentifié.' }, 401);

  const db = serviceClient();

  const { data: orders } = await db
    .from('orders')
    .select('id, email, amount, product_slugs, status, created_at, paid_at')
    .eq('email', email)
    .order('created_at', { ascending: false });

  const orderIds = (orders ?? []).map((o) => o.id);
  // deno-lint-ignore no-explicit-any
  let deliverables: any[] = [];
  if (orderIds.length) {
    const { data } = await db
      .from('deliverables')
      .select('id, type, access_token, created_at, order_id')
      .in('order_id', orderIds)
      .order('created_at', { ascending: false });
    deliverables = data ?? [];
  }

  const entitlements = await getEntitlements(db, email);

  return json({ email, orders: orders ?? [], deliverables, entitlements });
});
