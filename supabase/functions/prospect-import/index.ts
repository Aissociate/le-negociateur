// Agent prospection — IMPORT : démarre un run Apify (scraper Apollo.io) et crée
// une liste de prospects en statut "enriching". L'ingestion du dataset se fait
// ensuite via prospect-ingest (manuel ou orchestrateur).
//
// Conformité : prospection B2B uniquement (intérêt légitime documenté). Pas
// d'achat de bases B2C, pas de données sensibles. Opt-out respecté.

import { serviceClient } from '../_shared/db.ts';
import { handleOptions, json } from '../_shared/cors.ts';
import { requireAdmin } from '../_shared/auth.ts';

interface Criteria {
  apollo_search_url?: string;
  override?: Record<string, unknown>;
  [k: string]: unknown;
}

interface Input {
  list_name: string;
  criteria: Criteria;
  actor_id?: string;
  max_results?: number;
}

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;
  if (!(await requireAdmin(req))) return json({ error: 'Réservé à l’administration.' }, 403);

  try {
    const { list_name, criteria, actor_id, max_results } = (await req.json()) as Input;
    const actor = actor_id || Deno.env.get('APIFY_APOLLO_ACTOR');
    const apifyKey = Deno.env.get('APIFY_API_KEY');
    if (!apifyKey || !actor) {
      return json({ error: 'Apify non configuré (APIFY_API_KEY / APIFY_APOLLO_ACTOR).' }, 400);
    }

    const db = serviceClient();

    const { data: list, error } = await db
      .from('prospect_lists')
      .insert({
        name: list_name?.trim() || 'Liste prospects',
        criteria,
        source: 'apollo',
        status: 'enriching',
        count: 0,
      })
      .select()
      .single();
    if (error) throw error;

    // Entrée de l'actor : on adapte aux scrapers Apollo les plus courants
    // (clé `url` = URL de recherche Apollo) + override libre pour tout autre actor.
    const input: Record<string, unknown> = {
      ...(criteria.apollo_search_url ? { url: criteria.apollo_search_url } : {}),
      ...(max_results ? { totalRecords: max_results, maxItems: max_results } : {}),
      cleanOutput: true,
      ...(criteria.override && typeof criteria.override === 'object' ? criteria.override : {}),
    };

    const runRes = await fetch(
      `https://api.apify.com/v2/acts/${encodeURIComponent(actor)}/runs?token=${apifyKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) }
    );
    const runBody = await runRes.json();
    if (!runRes.ok) {
      await db.from('prospect_lists').update({ status: 'draft' }).eq('id', list.id);
      return json({ error: runBody.error?.message ?? `Apify HTTP ${runRes.status}` }, 502);
    }

    const runId = runBody.data?.id;
    const datasetId = runBody.data?.defaultDatasetId;

    await db
      .from('prospect_lists')
      .update({ criteria: { ...criteria, _apify: { runId, datasetId, actor } } })
      .eq('id', list.id);

    // File d'orchestration : l'ingestion sera tentée par le cron quand le run finit.
    await db.from('agent_jobs').insert({
      agent: 'apollo_ingest',
      payload: { list_id: list.id, run_id: runId, dataset_id: datasetId },
    });

    return json({ list_id: list.id, run_id: runId });
  } catch (err) {
    console.error(err);
    return json({ error: 'Import impossible.' }, 500);
  }
});
