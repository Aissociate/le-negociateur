// Meta Pixel — wrapper typé et sûr (no-op si `fbq` est absent : bloqueur de pub,
// rendu serveur, tests). Le PageView initial est déclenché par le snippet inline
// dans index.html ; ici on gère les vues de navigation SPA (voir PixelTracker) et
// les événements de conversion du funnel (Lead, InitiateCheckout, Purchase…).

type PixelParams = Record<string, unknown>;

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

function fbq(...args: unknown[]): void {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  window.fbq(...args);
}

/** Vue de page — à appeler sur chaque changement de route côté client. */
export function trackPageView(): void {
  fbq('track', 'PageView');
}

/**
 * Événement standard Meta (Lead, InitiateCheckout, Purchase, ViewContent…).
 * `eventID` permet la déduplication (utile pour Purchase : évite le double
 * comptage sur rafraîchissement, et prépare un futur envoi via Conversions API).
 */
export function trackEvent(event: string, params?: PixelParams, eventID?: string): void {
  if (eventID) fbq('track', event, params ?? {}, { eventID });
  else fbq('track', event, params ?? {});
}
