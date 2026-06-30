// Lectures publiques contrôlées (les tables sont fermées côté RLS) :
//   ?report=<uuid>          -> rapport d'écart (inclut metier_en_tension)
//   ?kit=<token>            -> livrable Kit (contenu markdown)
//   ?order_session=<cs_...> -> { token } si le Kit de cette commande est prêt
// Les identifiants (uuid / token aléatoires) servent de capacité d'accès.

import { serviceClient } from '../_shared/db.ts';
import { handleOptions, json } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;

  const url = new URL(req.url);
  const db = serviceClient();

  // Compteur public d'analyses générées (preuve sociale honnête et dynamique).
  const stat = url.searchParams.get('stat');
  if (stat === 'analyses') {
    const { count } = await db.from('gap_reports').select('id', { count: 'exact', head: true });
    return json({ analyses: count ?? 0 });
  }

  // Quota quotidien de lancement (RÉEL) : nb de Kits au tarif de lancement encore
  // disponibles aujourd'hui = quota - Kits déjà vendus depuis minuit UTC. Le quota
  // se règle via LAUNCH_DAILY_QUOTA (raison : capacité de génération/curation/jour).
  if (stat === 'launch') {
    const now = new Date();
    // Début de journée à minuit heure de Paris (gère l'heure d'été/hiver) : on soustrait
    // le temps écoulé depuis minuit Paris à l'instant courant.
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Paris',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(now);
    const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
    const elapsedMs = (get('hour') * 3600 + get('minute') * 60 + get('second')) * 1000;
    const start = new Date(now.getTime() - elapsedMs).toISOString();
    const quota = Number(Deno.env.get('LAUNCH_DAILY_QUOTA') ?? '20');
    const { count } = await db
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'paid')
      .gte('created_at', start)
      .contains('product_slugs', ['kit']);
    const sold = count ?? 0;
    return json({ quota, sold_today: sold, remaining: Math.max(0, quota - sold) });
  }

  const reportId = url.searchParams.get('report');
  if (reportId) {
    const { data } = await db.from('gap_reports').select('*').eq('id', reportId).maybeSingle();
    return data ? json(data) : json({ error: 'Introuvable' }, 404);
  }

  const kitToken = url.searchParams.get('kit');
  if (kitToken) {
    const { data } = await db
      .from('deliverables')
      .select('content_md, type, created_at')
      .eq('access_token', kitToken)
      .maybeSingle();
    return data ? json(data) : json({ error: 'Introuvable' }, 404);
  }

  const session = url.searchParams.get('order_session');
  if (session) {
    const { data: order } = await db
      .from('orders')
      .select('id')
      .eq('stripe_session_id', session)
      .maybeSingle();
    if (!order) return json({ token: null });
    const { data: deliverable } = await db
      .from('deliverables')
      .select('access_token')
      .eq('order_id', order.id)
      .maybeSingle();
    return json({ token: deliverable?.access_token ?? null });
  }

  return json({ error: 'Paramètre manquant' }, 400);
});
