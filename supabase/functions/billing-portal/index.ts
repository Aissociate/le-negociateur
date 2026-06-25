// Portail de gestion d'abonnement Stripe pour le client connecté (annulation,
// moyen de paiement, factures récurrentes).

import Stripe from 'npm:stripe@16';
import { serviceClient } from '../_shared/db.ts';
import { handleOptions, json } from '../_shared/cors.ts';
import { getUserEmail } from '../_shared/auth.ts';

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;

  const email = await getUserEmail(req);
  if (!email) return json({ error: 'Non authentifié.' }, 401);

  const db = serviceClient();
  const { data: sub } = await db
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('email', email)
    .not('stripe_customer_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!sub?.stripe_customer_id) {
    return json({ error: "Aucun abonnement géré par Stripe (peut-être inclus via le Pack Carrière)." }, 404);
  }

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' });
  const siteUrl = Deno.env.get('SITE_URL') ?? 'http://localhost:5173';
  const portal = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${siteUrl}/compte`,
  });

  return json({ url: portal.url });
});
