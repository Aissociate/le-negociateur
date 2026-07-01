import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { STRIPE_PRODUCTS } from '../stripe-config';

export interface ActiveProduct {
  name: string;
  slug: string;
}

export function useActiveProducts() {
  const [activeProducts, setActiveProducts] = useState<ActiveProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data: orders } = await supabase
        .from('stripe_user_orders')
        .select('payment_status')
        .eq('payment_status', 'paid');

      if (orders && orders.length > 0) {
        // User has paid orders — resolve which products from config are active
        // In a fuller implementation you'd match by priceId stored on the order
        const products = Object.values(STRIPE_PRODUCTS).map((p) => ({
          name: p.name,
          slug: p.priceId,
        }));
        setActiveProducts(products);
      }
      setLoading(false);
    }
    fetch();
  }, []);

  return { activeProducts, loading };
}