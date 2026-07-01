// Personnalisation du Kit (post-achat) : valide la commande payée via la session
// Stripe (capacité), sauvegarde le profil détaillé, puis RÉGÉNÈRE le Kit avec
// tout le contexte (positionnement + données externes + package + réalisations).

import { serviceClient } from '../_shared/db.ts';
import { handleOptions, json } from '../_shared/cors.ts';
import { callLLM } from '../_shared/llm.ts';
import { detailedKitVars } from '../_shared/kit.ts';
import { sendEmail } from '../_shared/email.ts';

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;

  try {
    // deno-lint-ignore no-explicit-any
    const { session, profile } = (await req.json()) as { session: string; profile: any };
    if (!session) return json({ error: 'Session manquante.' }, 400);

    const db = serviceClient();

    const { data: order } = await db.from('orders').select('*').eq('stripe_session_id', session).maybeSingle();
    if (!order) return json({ error: 'Commande introuvable.' }, 404);
    if (order.status !== 'paid') return json({ error: 'Commande non payée.' }, 403);

    // Seules les commandes contenant le Kit se personnalisent. Sinon (ex. Argumentaire
    // Éclair via exit-intent), on renvoie le livrable existant sans régénérer un Kit complet.
    if (!((order.product_slugs as string[] | null) ?? []).includes('kit')) {
      const { data: existing } = await db
        .from('deliverables')
        .select('access_token')
        .eq('order_id', order.id)
        .maybeSingle();
      return json({ token: existing?.access_token ?? null });
    }

    const { data: lead } = order.lead_id
      ? await db.from('leads').select('*').eq('id', order.lead_id).maybeSingle()
      : await db.from('leads').select('*').eq('email', order.email).maybeSingle();

    const { data: report } = lead?.last_report_id
      ? await db.from('gap_reports').select('*').eq('id', lead.last_report_id).maybeSingle()
      : { data: null };

    // 1. Sauvegarde du profil détaillé
    await db.from('kit_profiles').insert({ order_id: order.id, lead_id: lead?.id ?? null, profile: profile ?? {} });

    // 2. Régénération du Kit avec tout le contexte
    const vars = detailedKitVars(report, lead, profile ?? {});
    let content: string;
    try {
      content = (await callLLM(db, 'kit_offensif', vars)).text;
    } catch (err) {
      console.error('Génération du Kit personnalisé échouée', err);
      return json({ error: 'Génération impossible, merci de réessayer.' }, 500);
    }

    // 3. Upsert du livrable (on conserve le token si déjà créé à l'achat)
    const { data: existing } = await db
      .from('deliverables')
      .select('id, access_token')
      .eq('order_id', order.id)
      .maybeSingle();

    let token: string;
    if (existing) {
      token = existing.access_token;
      await db.from('deliverables').update({ content_md: content }).eq('id', existing.id);
    } else {
      token = crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '');
      await db.from('deliverables').insert({
        order_id: order.id,
        lead_id: lead?.id ?? null,
        type: 'kit_offensif',
        content_md: content,
        access_token: token,
      });
    }

    if (lead) await db.from('leads').update({ statut: 'client', next_email_at: null }).eq('id', lead.id);

    // Email de livraison du Kit (généré à partir du Formulaire 2). Best-effort.
    try {
      const siteUrl = Deno.env.get('SITE_URL') ?? 'http://localhost:5173';
      const kitUrl = `${siteUrl}/kit/document/${token}`;
      const hasSimulateur = ((order.product_slugs as string[] | null) ?? []).includes('simulateur');
      const trainingBlock = hasSimulateur
        ? `<p>Tu as aussi débloqué l'<strong>entraînement IA à la négociation</strong> : <a href="${siteUrl}/simulateur">démarrer une session</a>.</p>`
        : '';
      await sendEmail(
        order.email,
        'Ton Kit de Négociation est prêt 🎯',
        `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;color:#1a1a1a">
          <p>Bonjour,</p>
          <p>Ton <strong>Kit de Négociation personnalisé</strong> est prêt.</p>
          <p style="margin:24px 0">
            <a href="${kitUrl}" style="background:#c8a24a;color:#1a1a1a;font-weight:bold;padding:12px 22px;border-radius:8px;text-decoration:none">Accéder à mon Kit</a>
          </p>
          ${trainingBlock}
          <p>Tu peux retrouver tes accès (Kit + entraînement IA) à tout moment depuis ton <a href="${siteUrl}/compte?acces=${token}">espace personnel</a> — sans code, en un clic.</p>
          <p>À ta réussite,<br/>L'équipe Le Négociateur</p>
        </div>`
      );
    } catch (mailErr) {
      console.error('Envoi email de livraison du Kit échoué (Kit créé) :', mailErr);
    }

    return json({ token });
  } catch (err) {
    console.error(err);
    return json({ error: 'Erreur interne.' }, 500);
  }
});
