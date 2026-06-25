// Droits d'accès d'un client : commandes payées (one-shots) + abonnement actif.
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

export interface Entitlements {
  kit: boolean;
  simulator: boolean;
  bouclier: boolean;
  slugs: string[];
}

export async function getEntitlements(db: SupabaseClient, email: string): Promise<Entitlements> {
  const { data: orders } = await db
    .from('orders')
    .select('product_slugs, status')
    .eq('email', email)
    .eq('status', 'paid');

  const slugs = new Set<string>();
  for (const o of orders ?? []) for (const s of (o.product_slugs ?? []) as string[]) slugs.add(s);

  // Abonnement Bouclier actif (le statut gouverne l'accès, pas la commande historique)
  const { data: subs } = await db
    .from('subscriptions')
    .select('status')
    .eq('email', email)
    .in('status', ['active', 'trialing', 'past_due']);
  const subActive = (subs ?? []).length > 0;

  const oneShotSimulator = slugs.has('simulateur') || slugs.has('pack-carriere');

  return {
    kit: slugs.has('kit') || slugs.has('pack-carriere') || slugs.has('argumentaire-eclair'),
    simulator: oneShotSimulator || subActive,
    bouclier: slugs.has('pack-carriere') || subActive,
    slugs: [...slugs],
  };
}
