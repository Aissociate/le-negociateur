import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface UserOrder {
  customer_id: string | null;
  order_id: number | null;
  checkout_session_id: string | null;
  payment_intent_id: string | null;
  amount_subtotal: number | null;
  amount_total: number | null;
  currency: string | null;
  payment_status: string | null;
  order_status: string | null;
  order_date: string | null;
}

export function useOrders() {
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      const { data } = await supabase.from('stripe_user_orders').select('*');
      setOrders(data ?? []);
      setLoading(false);
    }
    fetchOrders();
  }, []);

  return { orders, loading };
}

export function useOrderBySession(sessionId: string | null) {
  const [order, setOrder] = useState<UserOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    async function poll() {
      let attempts = 0;
      while (attempts < 8) {
        const { data } = await supabase
          .from('stripe_user_orders')
          .select('*')
          .eq('checkout_session_id', sessionId)
          .maybeSingle();

        if (data) {
          setOrder(data);
          setLoading(false);
          return;
        }
        await new Promise((r) => setTimeout(r, 1500));
        attempts++;
      }
      setLoading(false);
    }

    poll();
  }, [sessionId]);

  return { order, loading };
}