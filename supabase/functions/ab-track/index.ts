// Tracking A/B best-effort : incrémente un compteur (vues / captures / achats)
// par expérience et variante. Appelé depuis le front avec la clé anon.

import { serviceClient } from '../_shared/db.ts';
import { handleOptions, json } from '../_shared/cors.ts';

interface Input {
  experiment_key: string;
  variant_key: string;
  event: 'view' | 'capture' | 'purchase';
}

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;

  try {
    const { experiment_key, variant_key, event } = (await req.json()) as Input;
    if (
      !experiment_key ||
      !variant_key ||
      !['view', 'capture', 'purchase'].includes(event)
    ) {
      return json({ error: 'invalid' }, 400);
    }
    const db = serviceClient();
    await db.rpc('increment_ab_stat', {
      p_experiment: experiment_key,
      p_variant: variant_key,
      p_event: event,
    });
    return json({ ok: true });
  } catch (_) {
    // Best-effort : ne jamais bloquer le funnel pour un échec de tracking.
    return json({ ok: false });
  }
});
