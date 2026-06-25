// Webhook Stripe : à la confirmation du paiement, marque la commande payée,
// arrête la séquence email du lead (devenu client), génère le Kit personnalisé
// (IA) et l'envoie par email. La réponse 200 part immédiatement (waitUntil) pour
// rester sous le timeout Stripe.

import Stripe from 'npm:stripe@16';
import { serviceClient } from '../_shared/db.ts';
import { callLLM } from '../_shared/llm.ts';
import { sendEmail } from '../_shared/email.ts';
import { baseKitVars } from '../_shared/kit.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' });
const cryptoProvider = Stripe.createSubtleCryptoProvider();

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!,
      undefined,
      cryptoProvider
    );
  } catch (err) {
    console.error('Signature webhook invalide', err);
    return new Response('Bad signature', { status: 400 });
  }

  // deno-lint-ignore no-explicit-any
  const er = (globalThis as any).EdgeRuntime;
  const run = async (p: Promise<unknown>) => (er?.waitUntil ? er.waitUntil(p) : await p);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    await run(session.mode === 'subscription' ? fulfillSubscription(session) : fulfill(session));
  } else if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
    await updateSubscriptionStatus(event.data.object as Stripe.Subscription);
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});

async function fulfill(session: Stripe.Checkout.Session): Promise<void> {
  const db = serviceClient();

  // 1. Commande payée (idempotent : si un livrable existe déjà, on ne régénère pas)
  const { data: order } = await db
    .from('orders')
    .select('*')
    .eq('stripe_session_id', session.id)
    .maybeSingle();
  if (!order) {
    console.error(`Commande introuvable pour la session ${session.id}`);
    return;
  }
  const { data: existing } = await db
    .from('deliverables')
    .select('id')
    .eq('order_id', order.id)
    .maybeSingle();
  if (existing) return;

  const custId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
  await db
    .from('orders')
    .update({ status: 'paid', paid_at: new Date().toISOString(), stripe_customer_id: custId ?? null })
    .eq('id', order.id);

  // Ne générer un Kit que pour les produits "document" (pas un OTO simulateur/bouclier seul).
  const docSlugs = ['kit', 'pack-carriere', 'argumentaire-eclair'];
  if (!((order.product_slugs ?? []) as string[]).some((s) => docSlugs.includes(s))) return;

  // 2. Lead + dernier rapport (pour personnaliser le Kit)
  const { data: lead } = order.lead_id
    ? await db.from('leads').select('*').eq('id', order.lead_id).maybeSingle()
    : await db.from('leads').select('*').eq('email', order.email).maybeSingle();

  if (lead) {
    await db.from('leads').update({ statut: 'client', next_email_at: null }).eq('id', lead.id);
  }

  const { data: report } = lead?.last_report_id
    ? await db.from('gap_reports').select('*').eq('id', lead.last_report_id).maybeSingle()
    : { data: null };

  // 3. Génération du Kit baseline (le détail post-achat l'enrichit via personalize-kit)
  const vars = { ...baseKitVars(report, lead), profil_detaille: 'n/c', realisations: 'n/c' };

  let content: string;
  try {
    content = (await callLLM(db, 'kit_offensif', vars)).text;
  } catch (err) {
    console.error('Génération du Kit échouée', err);
    content =
      `# Kit de Négociation\n\nVotre Kit personnalisé est en cours de préparation. ` +
      `Notre équipe a été alertée et vous le recevrez par email sous 24 h. ` +
      `En cas de question : répondez simplement à l'email de confirmation.`;
  }

  // 4. Livrable + email de livraison
  const token = crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '');
  await db.from('deliverables').insert({
    order_id: order.id,
    lead_id: lead?.id ?? null,
    type: 'kit_offensif',
    content_md: content,
    access_token: token,
  });

  const siteUrl = Deno.env.get('SITE_URL') ?? 'http://localhost:5173';
  try {
    await sendEmail(
      order.email,
      'Votre Kit de Négociation est prêt — personnalisez-le pour un dossier sur-mesure',
      `<p>Bonjour,</p>
       <p>Merci pour votre confiance. Votre <strong>Kit de Négociation</strong> est prêt :</p>
       <p><a href="${siteUrl}/kit/document/${token}" style="display:inline-block;background:#c9a227;color:#10141a;padding:12px 24px;border-radius:8px;font-weight:bold;text-decoration:none">Accéder à mon Kit</a></p>
       <p><strong>Pour un dossier encore plus précis</strong> — avec votre package de rémunération complet et vos réussites professionnelles — prenez 3 minutes pour le personnaliser :</p>
       <p><a href="${siteUrl}/personnaliser?session=${session.id}" style="display:inline-block;background:#10141a;color:#f6f3ec;padding:12px 24px;border-radius:8px;font-weight:bold;text-decoration:none">Personnaliser mon Kit</a></p>
       <p>Bonne négociation,<br/>Le Négociateur</p>`
    );
  } catch (err) {
    console.error("Envoi de l'email de livraison échoué", err);
  }
}

// --- Abonnement Bouclier ---------------------------------------------------
async function fulfillSubscription(session: Stripe.Checkout.Session): Promise<void> {
  const db = serviceClient();
  const email = (session.customer_email ?? session.customer_details?.email ?? '').toLowerCase();

  if (session.id) {
    await db
      .from('orders')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('stripe_session_id', session.id);
  }

  const subId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
  const custId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
  if (subId) {
    await db.from('subscriptions').upsert(
      { email, stripe_subscription_id: subId, stripe_customer_id: custId ?? null, status: 'active' },
      { onConflict: 'stripe_subscription_id' }
    );
  }

  if (email) {
    const { data: lead } = await db.from('leads').select('id').eq('email', email).maybeSingle();
    if (lead) await db.from('leads').update({ statut: 'client' }).eq('id', lead.id);
  }
}

async function updateSubscriptionStatus(sub: Stripe.Subscription): Promise<void> {
  const db = serviceClient();
  await db
    .from('subscriptions')
    .update({
      status: sub.status,
      current_period_end: sub.current_period_end
        ? new Date(sub.current_period_end * 1000).toISOString()
        : null,
    })
    .eq('stripe_subscription_id', sub.id);
}
