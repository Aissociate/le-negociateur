// Accès par capacité : un token de livrable (secret, envoyé par email) identifie
// le client sans login. On résout token -> livrable -> commande -> email, puis les
// droits se calculent par email (getEntitlements). Utilisé pour l'accès direct à
// l'espace client et au simulateur, sans code ni mot de passe.

import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

export async function emailFromToken(db: SupabaseClient, token: string | undefined | null): Promise<string | null> {
  if (!token) return null;
  const { data: d } = await db.from('deliverables').select('order_id').eq('access_token', token).maybeSingle();
  if (!d?.order_id) return null;
  const { data: o } = await db.from('orders').select('email').eq('id', d.order_id).maybeSingle();
  return o?.email ? String(o.email).toLowerCase() : null;
}
