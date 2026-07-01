import React from 'react';
import { useCheckout } from '../hooks/useCheckout';
import type { StripeProduct } from '../stripe-config';
import { formatPrice } from '../stripe-config';

interface Props {
  product: StripeProduct;
  label?: string;
  className?: string;
  style?: React.CSSProperties;
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, string>;
}

export default function CheckoutButton({
  product,
  label,
  className,
  style,
  successUrl,
  cancelUrl,
  metadata,
}: Props) {
  const { startCheckout, loading, error } = useCheckout();

  const handleClick = () =>
    startCheckout({ product, successUrl, cancelUrl, metadata });

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.75 : 1,
          transition: 'opacity 0.15s',
          ...style,
        }}
      >
        {loading ? (
          <>
            <Spinner />
            Redirection…
          </>
        ) : (
          label ?? `Obtenir — ${formatPrice(product.price, product.currency)}`
        )}
      </button>
      {error && (
        <p style={{ color: 'var(--rouge-500, #e53e3e)', fontSize: 13, marginTop: 8 }}>
          {error}
        </p>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      style={{ animation: 'spin 0.8s linear infinite' }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}