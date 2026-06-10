// Crée une session Stripe Checkout (hébergée) pour le Kit de Négociation Offensif.
// Aucune donnée bancaire ne transite par l'application.

import Stripe from 'npm:stripe@16';
import { serviceClient } from '../_shared/db.ts';
import { handleOptions, json } from '../_shared/cors.ts';

const KIT_PRICE_CENTS = 7900; // 79 € — modifier ici et sur la page /kit

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;

  try {
    const { email } = (await req.json()) as { email: string };
    if (!email?.includes('@')) return json({ error: 'Email invalide.' }, 400);

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2024-06-20',
    });
    const siteUrl = Deno.env.get('SITE_URL') ?? 'http://localhost:5173';
    const db = serviceClient();

    const { data: lead } = await db
      .from('leads')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: KIT_PRICE_CENTS,
            product_data: {
              name: 'Kit de Négociation Offensif',
              description:
                'Rapport personnalisé + stratégie en 5 étapes + scripts + contre-arguments (PDF)',
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${siteUrl}/merci?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/kit`,
    });

    await db.from('orders').insert({
      lead_id: lead?.id ?? null,
      email: email.toLowerCase().trim(),
      stripe_session_id: session.id,
      amount: KIT_PRICE_CENTS,
      status: 'pending',
    });

    return json({ url: session.url });
  } catch (err) {
    console.error(err);
    return json({ error: 'Impossible de créer le paiement.' }, 500);
  }
});
