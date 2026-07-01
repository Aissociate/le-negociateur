import React, { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useOrderBySession } from '../hooks/useOrders';
import { getProductByPriceId, formatPrice } from '../stripe-config';

export default function Merci() {
  const [params] = useSearchParams();
  const sessionId = params.get('session_id');
  const { order, loading } = useOrderBySession(sessionId);

  const amountPaid =
    order?.amount_total != null ? order.amount_total / 100 : null;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--papier-100, #f6f3ec)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        fontFamily: 'var(--font-text, system-ui, sans-serif)',
      }}
    >
      <div style={{ maxWidth: 560, width: '100%', textAlign: 'center' }}>
        {loading ? (
          <LoadingState />
        ) : order && order.payment_status === 'paid' ? (
          <SuccessState
            amount={amountPaid}
            currency={order.currency ?? 'eur'}
            sessionId={sessionId}
          />
        ) : sessionId && !order ? (
          <PendingState />
        ) : (
          <GenericSuccess />
        )}

        <div style={{ marginTop: 40, display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            to="/"
            style={{
              fontSize: 14,
              color: 'var(--encre-600, #5a5650)',
              textDecoration: 'none',
              padding: '10px 20px',
              border: '1.5px solid var(--encre-200, #d4d0cb)',
              borderRadius: 999,
            }}
          >
            ← Retour à l'accueil
          </Link>
          <Link
            to="/compte"
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--encre-950, #10141a)',
              textDecoration: 'none',
              padding: '10px 20px',
              background: 'var(--or-500, #c9a227)',
              border: '1.5px solid transparent',
              borderRadius: 999,
            }}
          >
            Accéder à mon espace →
          </Link>
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div>
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          border: '3px solid var(--encre-100, #e8e4de)',
          borderTopColor: 'var(--or-500, #c9a227)',
          margin: '0 auto 24px',
          animation: 'spin 0.9s linear infinite',
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <h2
        style={{
          fontFamily: 'var(--font-display, system-ui)',
          fontSize: 24,
          fontWeight: 700,
          color: 'var(--encre-900, #1e1a14)',
          marginBottom: 8,
        }}
      >
        Confirmation en cours…
      </h2>
      <p style={{ color: 'var(--encre-500, #7a756e)', fontSize: 15 }}>
        On vérifie ton paiement, ça prend quelques secondes.
      </p>
    </div>
  );
}

function PendingState() {
  return (
    <div>
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: 'var(--or-100, #fdf4dc)',
          border: '2px solid var(--or-400, #d4a843)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          fontSize: 32,
        }}
      >
        ⏳
      </div>
      <h2
        style={{
          fontFamily: 'var(--font-display, system-ui)',
          fontSize: 26,
          fontWeight: 700,
          color: 'var(--encre-900, #1e1a14)',
          marginBottom: 10,
        }}
      >
        Paiement en traitement
      </h2>
      <p style={{ color: 'var(--encre-500, #7a756e)', fontSize: 15, lineHeight: 1.6 }}>
        Ton paiement est en cours de validation. Tu recevras une confirmation par email
        dans quelques minutes.
      </p>
    </div>
  );
}

function SuccessState({
  amount,
  currency,
  sessionId,
}: {
  amount: number | null;
  currency: string;
  sessionId: string | null;
}) {
  return (
    <div>
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'var(--or-500, #c9a227)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 28px',
          boxShadow: '4px 4px 0 var(--encre-950, #10141a)',
        }}
      >
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--encre-950, #10141a)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <h1
        style={{
          fontFamily: 'var(--font-display, system-ui)',
          fontSize: 38,
          fontWeight: 800,
          letterSpacing: '-0.03em',
          color: 'var(--encre-950, #10141a)',
          marginBottom: 12,
          lineHeight: 1.1,
        }}
      >
        Paiement confirmé !
      </h1>

      {amount != null && (
        <div
          style={{
            display: 'inline-block',
            background: 'var(--encre-950, #10141a)',
            color: 'var(--or-400, #d4a843)',
            borderRadius: 8,
            padding: '8px 20px',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 22,
            fontWeight: 700,
            marginBottom: 20,
          }}
        >
          {formatPrice(amount, currency)}
        </div>
      )}

      <p
        style={{
          fontSize: 16,
          lineHeight: 1.6,
          color: 'var(--encre-700, #3a3630)',
          maxWidth: 420,
          margin: '0 auto',
        }}
      >
        Ton accès est activé. Tu vas recevoir un email de confirmation.
        Tu peux dès maintenant accéder à ton espace.
      </p>
    </div>
  );
}

function GenericSuccess() {
  return (
    <div>
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'var(--or-500, #c9a227)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 28px',
          boxShadow: '4px 4px 0 var(--encre-950, #10141a)',
        }}
      >
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--encre-950, #10141a)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h1
        style={{
          fontFamily: 'var(--font-display, system-ui)',
          fontSize: 38,
          fontWeight: 800,
          letterSpacing: '-0.03em',
          color: 'var(--encre-950, #10141a)',
          marginBottom: 12,
        }}
      >
        Merci !
      </h1>
      <p style={{ fontSize: 16, lineHeight: 1.6, color: 'var(--encre-700, #3a3630)' }}>
        Ton accès est activé. Vérifie ta boîte email pour la confirmation.
      </p>
    </div>
  );
}