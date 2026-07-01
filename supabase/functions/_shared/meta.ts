// Meta Conversions API (CAPI) — envoi d'événements de conversion côté serveur.
// Fiable même si le navigateur ne charge jamais le pixel (bloqueur de pub, ou le
// client ne revient pas sur /merci). Dédupliqué avec le pixel navigateur grâce à
// `eventId` : on réutilise l'id de session Stripe des deux côtés, Meta fusionne.
//
// Secrets :
//   META_CAPI_TOKEN  (requis)  — jeton d'accès CAPI (Events Manager → Paramètres → Conversions API).
//   META_PIXEL_ID    (optionnel) — par défaut l'ID du pixel du site.
// Sans META_CAPI_TOKEN : no-op silencieux (le pixel navigateur reste la seule source).

const PIXEL_ID = Deno.env.get('META_PIXEL_ID') ?? '1388030989410695';
const GRAPH_VERSION = 'v21.0';

// Hash SHA-256 (hex) requis par Meta pour les données personnelles (email…).
async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input.trim().toLowerCase());
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

interface PurchaseInput {
  eventId: string; // = id de session Stripe (déduplication avec le pixel navigateur)
  email?: string | null;
  value: number; // montant en euros
  currency: string; // ex. 'EUR'
  eventSourceUrl?: string;
}

/** Envoie un événement `Purchase` à la Conversions API. Lève en cas d'échec HTTP. */
export async function sendMetaPurchase(input: PurchaseInput): Promise<void> {
  const token = Deno.env.get('META_CAPI_TOKEN');
  if (!token) return; // CAPI non configurée : le pixel navigateur suffit.

  const user_data: Record<string, unknown> = {};
  if (input.email) user_data.em = [await sha256(input.email)];

  const payload = {
    data: [
      {
        event_name: 'Purchase',
        event_time: Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        action_source: 'website',
        ...(input.eventSourceUrl ? { event_source_url: input.eventSourceUrl } : {}),
        user_data,
        custom_data: { currency: input.currency.toUpperCase(), value: input.value },
      },
    ],
  };

  const res = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${PIXEL_ID}/events?access_token=${token}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );
  if (!res.ok) {
    throw new Error(`Meta CAPI ${res.status}: ${await res.text()}`);
  }
}
