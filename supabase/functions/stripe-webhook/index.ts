import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';
import { baseKitVars } from '../_shared/kit.ts';
import { callLLM } from '../_shared/llm.ts';
import { sendEmail } from '../_shared/email.ts';
import { sendMetaPurchase } from '../_shared/meta.ts';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'Bolt Integration',
    version: '1.0.0',
  },
});

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

Deno.serve(async (req) => {
  try {
    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204 });
    }

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // get the signature from the header
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return new Response('No signature found', { status: 400 });
    }

    // get the raw body
    const body = await req.text();

    // verify the webhook signature
    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, stripeWebhookSecret);
    } catch (error: any) {
      console.error(`Webhook signature verification failed: ${error.message}`);
      return new Response(`Webhook signature verification failed: ${error.message}`, { status: 400 });
    }

    EdgeRuntime.waitUntil(handleEvent(event));

    return Response.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function handleEvent(event: Stripe.Event) {
  const stripeData = event?.data?.object ?? {};

  if (!stripeData) {
    return;
  }

  // Fulfillment du tunnel maison : marque la commande `orders` payée, mémorise le
  // client Stripe (requis pour les OTO 1-clic), génère le Kit baseline et stoppe le
  // nurturing. Indépendant de la synchro `stripe_orders`/`stripe_subscriptions` ci-dessous.
  if (event.type === 'checkout.session.completed') {
    await fulfillFunnelOrder(stripeData as Stripe.Checkout.Session);
  }

  if (!('customer' in stripeData)) {
    return;
  }

  // for one time payments, we only listen for the checkout.session.completed event
  if (event.type === 'payment_intent.succeeded' && event.data.object.invoice === null) {
    return;
  }

  const { customer: customerId } = stripeData;

  if (!customerId || typeof customerId !== 'string') {
    console.error(`No customer received on event: ${JSON.stringify(event)}`);
  } else {
    let isSubscription = true;

    if (event.type === 'checkout.session.completed') {
      const { mode } = stripeData as Stripe.Checkout.Session;

      isSubscription = mode === 'subscription';

      console.info(`Processing ${isSubscription ? 'subscription' : 'one-time payment'} checkout session`);
    }

    const { mode, payment_status } = stripeData as Stripe.Checkout.Session;

    if (isSubscription) {
      console.info(`Starting subscription sync for customer: ${customerId}`);
      await syncCustomerFromStripe(customerId);
    } else if (mode === 'payment' && payment_status === 'paid') {
      try {
        // Extract the necessary information from the session
        const {
          id: checkout_session_id,
          payment_intent,
          amount_subtotal,
          amount_total,
          currency,
        } = stripeData as Stripe.Checkout.Session;

        // Insert the order into the stripe_orders table
        const { error: orderError } = await supabase.from('stripe_orders').insert({
          checkout_session_id,
          payment_intent_id: payment_intent,
          customer_id: customerId,
          amount_subtotal,
          amount_total,
          currency,
          payment_status,
          status: 'completed', // assuming we want to mark it as completed since payment is successful
        });

        if (orderError) {
          console.error('Error inserting order:', orderError);
          return;
        }
        console.info(`Successfully processed one-time payment for session: ${checkout_session_id}`);
      } catch (error) {
        console.error('Error processing one-time payment:', error);
      }
    }
  }
}

// Fulfillment de la commande du tunnel (table `orders`) suite à un Checkout payé.
// Idempotent : ré-appelable sans double-effet (Stripe peut rejouer l'événement).
async function fulfillFunnelOrder(session: Stripe.Checkout.Session) {
  const sessionId = session.id;
  const customerId =
    typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null;

  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('stripe_session_id', sessionId)
    .maybeSingle();
  if (!order) {
    console.info(`Aucune commande funnel pour la session ${sessionId}`);
    return;
  }

  // Paiement effectif requis (les modes 'payment' async pourraient être 'unpaid').
  if (session.payment_status && session.payment_status === 'unpaid') {
    console.info(`Session ${sessionId} encore impayée, fulfillment différé`);
    return;
  }

  // 1. Marque payée + mémorise le client Stripe (sans écraser une commande déjà traitée).
  if (order.status !== 'paid') {
    await supabase
      .from('orders')
      .update({ status: 'paid', paid_at: new Date().toISOString(), stripe_customer_id: customerId })
      .eq('id', order.id);

    // Conversion server-side (Meta CAPI) — fiable même si le navigateur ne recharge pas
    // /merci. Dédupliqué avec le pixel via event_id = id de session Stripe. N'envoyé
    // qu'une fois : au rejeu Stripe, la commande est déjà 'paid' et on ne repasse pas ici.
    try {
      const site = Deno.env.get('SITE_URL') ?? '';
      await sendMetaPurchase({
        eventId: sessionId,
        email: order.email,
        value: (session.amount_total ?? 0) / 100,
        currency: session.currency ?? 'eur',
        eventSourceUrl: site ? `${site}/merci?session_id=${sessionId}` : undefined,
      });
    } catch (capiErr) {
      console.error('Meta CAPI Purchase échoué :', capiErr);
    }
  } else if (customerId && !order.stripe_customer_id) {
    await supabase.from('orders').update({ stripe_customer_id: customerId }).eq('id', order.id);
  }

  // 2. Lead + rapport associés (par lead_id, sinon par email).
  const { data: lead } = order.lead_id
    ? await supabase.from('leads').select('*').eq('id', order.lead_id).maybeSingle()
    : await supabase.from('leads').select('*').eq('email', order.email).maybeSingle();
  const { data: report } = lead?.last_report_id
    ? await supabase.from('gap_reports').select('*').eq('id', lead.last_report_id).maybeSingle()
    : { data: null };

  // 3. Ce lead devient client : on stoppe la séquence de relances.
  if (lead && lead.statut !== 'client') {
    await supabase.from('leads').update({ statut: 'client', next_email_at: null }).eq('id', lead.id);
  }

  // 4. Livraison.
  //    - Le KIT ne se génère PAS ici : il vient du Formulaire 2 (personalize-kit),
  //      qui l'alimente avec le profil détaillé. On invite le client à le compléter.
  //    - L'Argumentaire Éclair (downsell) n'a pas de formulaire : on le génère direct.
  const slugs: string[] = order.product_slugs ?? [];
  const siteUrl = Deno.env.get('SITE_URL') ?? 'http://localhost:5173';
  const hasKit = slugs.includes('kit');
  const hasEclair = slugs.includes('argumentaire-eclair');

  if (hasKit) {
    try {
      const formUrl = `${siteUrl}/personnaliser?session=${order.stripe_session_id}`;
      await sendEmail(
        order.email,
        'Paiement confirmé — dernière étape pour ton Kit',
        `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;color:#1a1a1a">
          <p>Bonjour,</p>
          <p>Ton paiement est confirmé 🎉</p>
          <p>Pour générer ton <strong>Kit de Négociation 100 % sur-mesure</strong>, il te reste une étape rapide : compléter ton profil détaillé.</p>
          <p style="margin:24px 0">
            <a href="${formUrl}" style="background:#c8a24a;color:#1a1a1a;font-weight:bold;padding:12px 22px;border-radius:8px;text-decoration:none">Compléter mon profil et générer mon Kit</a>
          </p>
          <p>Sans cette étape, ton Kit ne peut pas être personnalisé.</p>
          <p>À ta réussite,<br/>L'équipe Le Négociateur</p>
        </div>`
      );
      console.info(`Email « compléter le profil » envoyé pour la commande ${order.id}`);
    } catch (mailErr) {
      console.error('Envoi email « compléter le profil » échoué :', mailErr);
    }
    return;
  }

  if (!hasEclair) return;

  // Argumentaire Éclair : généré directement (aucun formulaire). Idempotent.
  const { data: existing } = await supabase
    .from('deliverables')
    .select('id')
    .eq('order_id', order.id)
    .maybeSingle();
  if (existing) return;

  try {
    const { text } = await callLLM(supabase, 'argumentaire_eclair', baseKitVars(report, lead));
    const token = crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '');
    await supabase.from('deliverables').insert({
      order_id: order.id,
      lead_id: lead?.id ?? null,
      type: 'argumentaire_eclair',
      content_md: text,
      access_token: token,
    });
    console.info(`Argumentaire Éclair généré pour la commande ${order.id}`);

    try {
      const docUrl = `${siteUrl}/kit/document/${token}`;
      await sendEmail(
        order.email,
        'Ton Argumentaire Éclair est prêt 🎯',
        `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;color:#1a1a1a">
          <p>Bonjour,</p>
          <p>Merci pour ta confiance — ton <strong>Argumentaire Éclair personnalisé</strong> est prêt.</p>
          <p style="margin:24px 0">
            <a href="${docUrl}" style="background:#c8a24a;color:#1a1a1a;font-weight:bold;padding:12px 22px;border-radius:8px;text-decoration:none">Accéder à mon document</a>
          </p>
          <p>Tu peux retrouver tes accès à tout moment depuis ton <a href="${siteUrl}/compte?acces=${token}">espace personnel</a> — sans code, en un clic.</p>
          <p>À ta réussite,<br/>L'équipe Le Négociateur</p>
        </div>`
      );
      console.info(`Email de livraison envoyé pour la commande ${order.id}`);
    } catch (mailErr) {
      console.error('Envoi email de livraison échoué (Éclair créé) :', mailErr);
    }
  } catch (err) {
    console.error("Génération de l'Argumentaire Éclair échouée (commande payée) :", err);
  }
}

// based on the excellent https://github.com/t3dotgg/stripe-recommendations
async function syncCustomerFromStripe(customerId: string) {
  try {
    // fetch latest subscription data from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
      status: 'all',
      expand: ['data.default_payment_method'],
    });

    // TODO verify if needed
    if (subscriptions.data.length === 0) {
      console.info(`No active subscriptions found for customer: ${customerId}`);
      const { error: noSubError } = await supabase.from('stripe_subscriptions').upsert(
        {
          customer_id: customerId,
          subscription_status: 'not_started',
        },
        {
          onConflict: 'customer_id',
        },
      );

      if (noSubError) {
        console.error('Error updating subscription status:', noSubError);
        throw new Error('Failed to update subscription status in database');
      }
    }

    // assumes that a customer can only have a single subscription
    const subscription = subscriptions.data[0];

    // store subscription state
    const { error: subError } = await supabase.from('stripe_subscriptions').upsert(
      {
        customer_id: customerId,
        subscription_id: subscription.id,
        price_id: subscription.items.data[0].price.id,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        ...(subscription.default_payment_method && typeof subscription.default_payment_method !== 'string'
          ? {
              payment_method_brand: subscription.default_payment_method.card?.brand ?? null,
              payment_method_last4: subscription.default_payment_method.card?.last4 ?? null,
            }
          : {}),
        status: subscription.status,
      },
      {
        onConflict: 'customer_id',
      },
    );

    if (subError) {
      console.error('Error syncing subscription:', subError);
      throw new Error('Failed to sync subscription in database');
    }
    console.info(`Successfully synced subscription for customer: ${customerId}`);
  } catch (error) {
    console.error(`Failed to sync subscription for customer ${customerId}:`, error);
    throw error;
  }
}