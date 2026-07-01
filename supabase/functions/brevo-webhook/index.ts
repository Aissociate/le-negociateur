// Webhook Brevo : reçoit les événements de délivrabilité (ouvertures, clics,
// bounces, plaintes) et les enregistre dans `email_events` pour le suivi KPI.
// Brevo ne signe pas ses webhooks : protection par un jeton en query string
// (?token=…) comparé à BREVO_WEBHOOK_SECRET si configuré.
// À brancher : Brevo → Transactionnel → Paramètres → Webhooks → URL
//   …/functions/v1/brevo-webhook?token=<BREVO_WEBHOOK_SECRET>

import { serviceClient } from '../_shared/db.ts';

const MAP: Record<string, string> = {
  opened: 'opened',
  uniqueOpened: 'opened',
  click: 'clicked',
  hard_bounce: 'bounced',
  soft_bounce: 'bounced',
  spam: 'complained',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  try {
    const secret = Deno.env.get('BREVO_WEBHOOK_SECRET');
    if (secret) {
      const token = new URL(req.url).searchParams.get('token');
      if (token !== secret) return new Response('unauthorized', { status: 401 });
    }

    const evt = (await req.json()) as { event?: string };
    const status = evt.event ? MAP[evt.event] : undefined;
    if (status) {
      await serviceClient().from('email_events').insert({ lead_id: null, step: 0, status });
    }
    return Response.json({ ok: true });
  } catch (_) {
    return Response.json({ ok: false });
  }
});
