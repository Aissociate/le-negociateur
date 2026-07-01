import { useState } from 'react';
import { supabase } from '../lib/supabase';
import type { StripeProduct } from '../stripe-config';

interface CheckoutOptions {
  product: StripeProduct;
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, string>;
}

export function useCheckout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout({ product, successUrl, cancelUrl, metadata }: CheckoutOptions) {
    setLoading(true);
    setError(null);

    try {
      const origin = window.location.origin;
      const defaultSuccess = `${origin}/merci?session_id={CHECKOUT_SESSION_ID}`;
      const defaultCancel = `${origin}${window.location.pathname}`;

      const { data, error: fnError } = await supabase.functions.invoke('create-checkout', {
        body: {
          priceId: product.priceId,
          mode: product.mode,
          successUrl: successUrl ?? defaultSuccess,
          cancelUrl: cancelUrl ?? defaultCancel,
          metadata: metadata ?? {},
        },
      });

      if (fnError) throw new Error(fnError.message);
      if (!data?.url) throw new Error('Lien de paiement indisponible.');

      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
      setLoading(false);
    }
  }

  return { startCheckout, loading, error };
}