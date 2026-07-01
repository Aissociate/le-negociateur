import React from 'react';
import { formatPrice } from '../stripe-config';
import type { StripeProduct } from '../stripe-config';
import CheckoutButton from './CheckoutButton';

interface Props {
  product: StripeProduct;
  featured?: boolean;
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, string>;
  ctaLabel?: string;
}

export default function ProductCard({
  product,
  featured = false,
  successUrl,
  cancelUrl,
  metadata,
  ctaLabel,
}: Props) {
  return (
    <div
      style={{
        background: featured ? 'var(--encre-950, #10141a)' : 'var(--white, #fff)',
        border: featured
          ? '2px solid var(--or-500, #c9a227)'
          : '2px solid var(--encre-950, #10141a)',
        borderRadius: 14,
        padding: '32px 28px',
        boxShadow: '6px 6px 0 var(--encre-950, #10141a)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        position: 'relative',
      }}
    >
      {featured && (
        <span
          style={{
            position: 'absolute',
            top: -14,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--or-500, #c9a227)',
            color: 'var(--encre-950, #10141a)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            padding: '4px 14px',
            borderRadius: 999,
            whiteSpace: 'nowrap',
          }}
        >
          Le plus populaire
        </span>
      )}

      <div>
        <p
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: featured ? 'var(--or-400, #d4a843)' : 'var(--or-600, #a07820)',
            marginBottom: 8,
          }}
        >
          {product.name}
        </p>
        <div
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 48,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            lineHeight: 1,
            color: featured ? 'var(--papier-100, #f6f3ec)' : 'var(--encre-950, #10141a)',
          }}
        >
          {formatPrice(product.price, product.currency)}
        </div>
      </div>

      <p
        style={{
          fontSize: 14,
          lineHeight: 1.55,
          color: featured ? 'var(--papier-300, #c8c3b8)' : 'var(--encre-700, #3a3630)',
          flex: 1,
        }}
      >
        {product.description}
      </p>

      <CheckoutButton
        product={product}
        label={ctaLabel}
        successUrl={successUrl}
        cancelUrl={cancelUrl}
        metadata={metadata}
        style={{
          background: featured ? 'var(--or-500, #c9a227)' : 'var(--encre-950, #10141a)',
          color: featured ? 'var(--encre-950, #10141a)' : 'var(--papier-100, #f6f3ec)',
          border: 'none',
          borderRadius: 999,
          padding: '14px 24px',
          fontSize: 15,
          fontWeight: 700,
          width: '100%',
          fontFamily: 'inherit',
        }}
      />
    </div>
  );
}