// Droits d'accès d'un client, calculés depuis ses commandes payées.
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

  return {
    kit: slugs.has('kit') || slugs.has('pack-carriere') || slugs.has('argumentaire-eclair'),
    simulator: slugs.has('simulateur') || slugs.has('pack-carriere') || slugs.has('bouclier'),
    bouclier: slugs.has('bouclier') || slugs.has('pack-carriere'),
    slugs: [...slugs],
  };
}
