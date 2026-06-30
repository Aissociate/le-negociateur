// Webhook Resend : reçoit les événements de délivrabilité (ouvertures, clics,
// bounces, plaintes) et les enregistre dans `email_events` pour le suivi KPI.
// Vérifie la signature Svix si RESEND_WEBHOOK_SECRET est configuré.
// À brancher : Resend → Webhooks → endpoint = …/functions/v1/resend-webhook.

import { serviceClient } from '../_shared/db.ts';

const MAP: Record<string, string> = {
  'email.opened': 'opened',
  'email.clicked': 'clicked',
  'email.bounced': 'bounced',
  'email.complained': 'complained',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  try {
    const raw = await req.text();

    // Vérification de signature Svix (Resend) si le secret est configuré.
    const secret = Deno.env.get('RESEND_WEBHOOK_SECRET');
    if (secret) {
      try {
        const { Webhook } = await import('npm:svix');
        new Webhook(secret).verify(raw, {
          'svix-id': req.headers.get('svix-id') ?? '',
          'svix-timestamp': req.headers.get('svix-timestamp') ?? '',
          'svix-signature': req.headers.get('svix-signature') ?? '',
        });
      } catch (_) {
        return new Response('invalid signature', { status: 401 });
      }
    }

    const evt = JSON.parse(raw) as { type?: string };
    const status = evt.type ? MAP[evt.type] : undefined;
    if (status) {
      await serviceClient().from('email_events').insert({ lead_id: null, step: 0, status });
    }
    return Response.json({ ok: true });
  } catch (_) {
    return Response.json({ ok: false });
  }
});
