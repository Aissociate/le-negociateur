// Capture d'intérêt pour la « Formation IA » (offre Oui/Non du tunnel post-achat).
// Aucun paiement : on enregistre l'intérêt (ou le refus) du client pour un contact
// commercial ultérieur (étude d'éligibilité CPF, etc.).

import { serviceClient } from '../_shared/db.ts';
import { handleOptions, json } from '../_shared/cors.ts';

interface Input {
  session?: string;
  email?: string;
  interested: boolean;
  offer?: string;
}

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;

  try {
    const { session, email, interested, offer } = (await req.json()) as Input;
    if (typeof interested !== 'boolean') return json({ error: 'Paramètre « interested » manquant.' }, 400);

    const db = serviceClient();

    // Retrouver le client : par session de commande (prioritaire), sinon par email.
    let leadEmail = email?.toLowerCase().trim() ?? '';
    let leadId: string | null = null;

    if (session) {
      const { data: order } = await db
        .from('orders')
        .select('lead_id, email')
        .eq('stripe_session_id', session)
        .maybeSingle();
      if (order) {
        leadId = order.lead_id ?? null;
        leadEmail = (order.email ?? leadEmail).toLowerCase().trim();
      }
    }
    if (!leadId && leadEmail) {
      const { data: lead } = await db.from('leads').select('id').eq('email', leadEmail).maybeSingle();
      leadId = lead?.id ?? null;
    }
    if (!leadEmail) return json({ error: 'Client introuvable.' }, 400);

    await db.from('lead_interests').insert({
      lead_id: leadId,
      email: leadEmail,
      offer: offer ?? 'formation-ia-cpf',
      interested,
    });

    return json({ ok: true });
  } catch (err) {
    console.error(err);
    return json({ error: "Erreur lors de l'enregistrement." }, 500);
  }
});
