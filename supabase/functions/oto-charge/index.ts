// OTO 1-clic : facture un produit one-shot sur la carte mémorisée du client
// (off-session), sans nouvelle saisie. Capability = l'id de session Stripe initiale.

import Stripe from 'npm:stripe@16';
import { serviceClient } from '../_shared/db.ts';
import { handleOptions, json } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;

  try {
    const { session, product_slug } = (await req.json()) as { session: string; product_slug: string };
    if (!session || !product_slug) return json({ error: 'Paramètres manquants.' }, 400);

    const db = serviceClient();
    const { data: order } = await db.from('orders').select('*').eq('stripe_session_id', session).maybeSingle();
    if (!order) return json({ error: 'Commande introuvable.' }, 404);
    if (order.status !== 'paid') return json({ error: 'Commande initiale non payée.' }, 403);
    if (!order.stripe_customer_id) return json({ error: 'Aucune carte enregistrée pour le 1-clic.' }, 400);

    const { data: product } = await db
      .from('products')
      .select('*')
      .eq('slug', product_slug)
      .eq('active', true)
      .maybeSingle();
    if (!product) return json({ error: 'Produit indisponible.' }, 400);
    if (product.kind === 'subscription') return json({ error: 'Produit récurrent : utilisez le checkout.' }, 400);

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' });
    const pms = await stripe.paymentMethods.list({ customer: order.stripe_customer_id, type: 'card', limit: 1 });
    const pm = pms.data[0];
    if (!pm) return json({ error: 'Carte introuvable.' }, 400);

    const pi = await stripe.paymentIntents.create({
      amount: product.price_cents,
      currency: product.currency ?? 'eur',
      customer: order.stripe_customer_id,
      payment_method: pm.id,
      off_session: true,
      confirm: true,
      description: `OTO — ${product.name}`,
    });
    if (pi.status !== 'succeeded') return json({ error: 'Paiement non confirmé.' }, 402);

    await db.from('orders').insert({
      lead_id: order.lead_id,
      email: order.email,
      stripe_session_id: null,
      stripe_customer_id: order.stripe_customer_id,
      amount: product.price_cents,
      product_slugs: [product.slug],
      status: 'paid',
      paid_at: new Date().toISOString(),
    });

    return json({ ok: true });
  } catch (err) {
    console.error(err);
    return json({ error: 'Le paiement en 1 clic a échoué (carte refusée ou authentification requise).' }, 402);
  }
});
