// OTO abonnement : crée une session Checkout d'abonnement en RÉUTILISANT le client
// Stripe existant (carte déjà connue → quasi 1-clic), puis renvoie l'URL. Le
// success/cancel renvoie vers /oto avec ?resume=1 pour terminer le tunnel (Kit).

import Stripe from 'npm:stripe@16';
import { serviceClient } from '../_shared/db.ts';
import { handleOptions, json } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;

  try {
    const { session, product_slug, token } = (await req.json()) as {
      session: string;
      product_slug: string;
      token?: string;
    };
    if (!session || !product_slug) return json({ error: 'Paramètres manquants.' }, 400);

    const db = serviceClient();
    const { data: order } = await db.from('orders').select('*').eq('stripe_session_id', session).maybeSingle();
    if (!order) return json({ error: 'Commande introuvable.' }, 404);

    const { data: product } = await db
      .from('products')
      .select('*')
      .eq('slug', product_slug)
      .eq('active', true)
      .maybeSingle();
    if (!product || product.kind !== 'subscription') return json({ error: 'Produit abonnement indisponible.' }, 400);

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' });
    const siteUrl = Deno.env.get('SITE_URL') ?? 'http://localhost:5173';
    const resume = `${siteUrl}/oto?session=${encodeURIComponent(session)}&token=${encodeURIComponent(token ?? '')}&resume=1`;

    const checkout = await stripe.checkout.sessions.create({
      mode: 'subscription',
      ...(order.stripe_customer_id ? { customer: order.stripe_customer_id } : { customer_email: order.email }),
      line_items: [
        {
          price_data: {
            currency: product.currency ?? 'eur',
            unit_amount: product.price_cents,
            recurring: { interval: 'month' as const },
            product_data: { name: product.name },
          },
          quantity: 1,
        },
      ],
      success_url: resume,
      cancel_url: resume,
    });

    await db.from('orders').insert({
      lead_id: order.lead_id,
      email: order.email,
      stripe_session_id: checkout.id,
      stripe_customer_id: order.stripe_customer_id,
      amount: product.price_cents,
      product_slugs: [product.slug],
      status: 'pending',
    });

    return json({ url: checkout.url });
  } catch (err) {
    console.error(err);
    return json({ error: "Impossible de lancer l'abonnement." }, 500);
  }
});
