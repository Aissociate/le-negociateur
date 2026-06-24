// Agent prospection — ENRICHISSEMENT (déclenchement manuel admin). Logique
// partagée avec l'orchestrateur via _shared/prospects.ts.

import { serviceClient } from '../_shared/db.ts';
import { handleOptions, json } from '../_shared/cors.ts';
import { requireAdmin } from '../_shared/auth.ts';
import { enrichBatch } from '../_shared/prospects.ts';

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;
  if (!(await requireAdmin(req))) return json({ error: 'Réservé à l’administration.' }, 403);

  try {
    const { list_id, limit } = (await req.json()) as { list_id: string; limit?: number };
    const result = await enrichBatch(serviceClient(), list_id, limit ?? 8);
    return json(result);
  } catch (err) {
    console.error(err);
    return json({ error: err instanceof Error ? err.message : 'Enrichissement impossible.' }, 500);
  }
});
