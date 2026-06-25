// OTO 1-clic : facture un produit one-shot sur la carte mémorisée (off-session),
// sans ressaisie. Si la carte exige une authentification (SCA / 3-D Secure),
// fallback vers un Checkout hébergé pour finaliser, puis reprise du tunnel.

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

    // Sécurité : on ne facture en OTO que des produits réellement configurés comme tels.
    const { data: steps } = await db.from('oto_steps').select('upsell_slug, downsell_slug').eq('active', true);
    const allowed = new Set<string>();
    for (const s of steps ?? []) {
      allowed.add(s.upsell_slug);
      if (s.downsell_slug) allowed.add(s.downsell_slug);
    }
    if (!allowed.has(product_slug)) return json({ error: 'Produit non proposé en OTO.' }, 400);

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' });
    const siteUrl = Deno.env.get('SITE_URL') ?? 'http://localhost:5173';

    const pms = await stripe.paymentMethods.list({ customer: order.stripe_customer_id, type: 'card', limit: 1 });
    const pm = pms.data[0];
    if (!pm) return json({ error: 'Carte introuvable.' }, 400);

    try {
      const pi = await stripe.paymentIntents.create({
        amount: product.price_cents,
        currency: product.currency ?? 'eur',
        customer: order.stripe_customer_id,
        payment_method: pm.id,
        off_session: true,
        confirm: true,
        description: `OTO — ${product.name}`,
      });
      if (pi.status !== 'succeeded') throw new Error(`PI status ${pi.status}`);

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
      // deno-lint-ignore no-explicit-any
      const code = (err as any)?.code ?? (err as any)?.raw?.code;
      if (code === 'authentication_required') {
        // Fallback SCA : checkout hébergé (3-D Secure), reprise du tunnel au retour.
        const resume = `${siteUrl}/oto?session=${encodeURIComponent(session)}&token=${encodeURIComponent(token ?? '')}&resume=1`;
        const checkout = await stripe.checkout.sessions.create({
          mode: 'payment',
          customer: order.stripe_customer_id,
          line_items: [
            {
              price_data: {
                currency: product.currency ?? 'eur',
                unit_amount: product.price_cents,
                product_data: { name: product.name },
              },
              quantity: 1,
            },
          ],
          payment_intent_data: { setup_future_usage: 'off_session' },
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
        return json({ requires_action: true, url: checkout.url });
      }
      console.error(err);
      return json({ error: 'Paiement refusé (carte ou solde insuffisant).' }, 402);
    }
  } catch (err) {
    console.error(err);
    return json({ error: 'Erreur interne.' }, 500);
  }
});
