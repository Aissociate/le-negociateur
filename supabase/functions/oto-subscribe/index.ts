// OTO abonnement : crée une session Checkout d'abonnement en RÉUTILISANT le client
// Stripe existant (carte déjà connue), puis renvoie l'URL. Option `trial` =
// 1er mois à 1€ (coupon Stripe ponctuel). Le retour pointe sur /oto?resume=1.

import Stripe from 'npm:stripe@16';
import { serviceClient } from '../_shared/db.ts';
import { handleOptions, json } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;

  try {
    const { session, product_slug, token, trial } = (await req.json()) as {
      session: string;
      product_slug: string;
      token?: string;
      trial?: boolean;
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

    // Sécurité : on ne souscrit en OTO que des produits réellement configurés comme tels.
    const { data: steps } = await db.from('oto_steps').select('upsell_slug, downsell_slug').eq('active', true);
    const allowed = new Set<string>();
    for (const s of steps ?? []) {
      allowed.add(s.upsell_slug);
      if (s.downsell_slug) allowed.add(s.downsell_slug);
    }
    if (!allowed.has(product_slug)) return json({ error: 'Produit non proposé en OTO.' }, 400);

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' });
    const siteUrl = Deno.env.get('SITE_URL') ?? 'http://localhost:5173';
    const resume = `${siteUrl}/oto?session=${encodeURIComponent(session)}&token=${encodeURIComponent(token ?? '')}&resume=1`;

    // Essai 1er mois à 1€ : coupon ponctuel réduisant la 1re facture à 100 centimes.
    // deno-lint-ignore no-explicit-any
    const discounts: any[] = [];
    if (trial && product.price_cents > 100) {
      // Coupon réutilisable (déterministe par devise+prix) plutôt qu'un coupon par appel.
      const couponId = `trial1e_${product.currency ?? 'eur'}_${product.price_cents}`;
      try {
        await stripe.coupons.retrieve(couponId);
      } catch {
        await stripe.coupons.create({
          id: couponId,
          amount_off: product.price_cents - 100,
          currency: product.currency ?? 'eur',
          duration: 'once',
          name: '1er mois à 1€',
        });
      }
      discounts.push({ coupon: couponId });
    }

    const checkout = await stripe.checkout.sessions.create({
      mode: 'subscription',
      ...(order.stripe_customer_id ? { customer: order.stripe_customer_id } : { customer_email: order.email }),
      ...(discounts.length ? { discounts } : {}),
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
      amount: trial ? 100 : product.price_cents,
      product_slugs: [product.slug],
      status: 'pending',
    });

    return json({ url: checkout.url });
  } catch (err) {
    console.error(err);
    return json({ error: "Impossible de lancer l'abonnement." }, 500);
  }
});
