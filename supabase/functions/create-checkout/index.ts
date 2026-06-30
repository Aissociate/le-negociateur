// Crée une session Stripe Checkout (hébergée). Mode 'payment' pour les one-shots
// (Kit, downsell, bundle) ; mode 'subscription' (prix mensuel récurrent) si le
// panier contient un produit kind='subscription' (Bouclier).
// Aucune donnée bancaire ne transite par l'application.

import Stripe from 'npm:stripe@16';
import { serviceClient } from '../_shared/db.ts';
import { handleOptions, json } from '../_shared/cors.ts';

interface Input {
  email: string;
  product_slugs?: string[];
}

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;

  try {
    const { email, product_slugs } = (await req.json()) as Input;
    if (!email?.includes('@')) return json({ error: 'Email invalide.' }, 400);

    const slugs = product_slugs?.length ? product_slugs : ['kit'];
    const db = serviceClient();

    const { data: products } = await db.from('products').select('*').in('slug', slugs).eq('active', true);
    if (!products?.length) return json({ error: 'Produit indisponible.' }, 400);

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' });
    const siteUrl = Deno.env.get('SITE_URL') ?? 'http://localhost:5173';
    const isSubscription = products.some((p) => p.kind === 'subscription');

    const lineItems = products.map((p) => ({
      price_data: {
        currency: p.currency ?? 'eur',
        unit_amount: p.price_cents,
        ...(p.kind === 'subscription' ? { recurring: { interval: 'month' as const } } : {}),
        product_data: {
          name: p.name,
          description: (p.description_md ?? '').slice(0, 380) || undefined,
        },
      },
      quantity: 1,
    }));
    const amount = products.reduce((s, p) => s + p.price_cents, 0);

    const { data: lead } = await db
      .from('leads')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    const session = await stripe.checkout.sessions.create({
      mode: isSubscription ? 'subscription' : 'payment',
      customer_email: email,
      line_items: lineItems,
      // Affiche le champ « Ajouter un code promo » sur le checkout hébergé.
      // Les codes (ex. cadeau -99 %) se créent/révoquent côté Stripe.
      allow_promotion_codes: true,
      // One-shots : on crée un client et on mémorise la carte pour les OTO 1-clic.
      ...(isSubscription
        ? {}
        : { customer_creation: 'always', payment_intent_data: { setup_future_usage: 'off_session' } }),
      success_url: isSubscription
        ? `${siteUrl}/compte?welcome=1`
        : `${siteUrl}/merci?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/kit`,
    });

    await db.from('orders').insert({
      lead_id: lead?.id ?? null,
      email: email.toLowerCase().trim(),
      stripe_session_id: session.id,
      amount,
      product_slugs: products.map((p) => p.slug),
      status: 'pending',
    });

    return json({ url: session.url });
  } catch (err) {
    console.error(err);
    return json({ error: 'Impossible de créer le paiement.' }, 500);
  }
});
