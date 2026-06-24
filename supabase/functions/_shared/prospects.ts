// Logique de prospection partagée entre les Edge Functions (déclenchement manuel
// par l'admin) et l'orchestrateur (cron). Idempotent et repreneable.

import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { callLLM } from './llm.ts';

// deno-lint-ignore no-explicit-any
function pick(o: any, keys: string[]): string | null {
  for (const k of keys) {
    const v = o?.[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return null;
}

// deno-lint-ignore no-explicit-any
function mapProspect(o: any) {
  const first = pick(o, ['first_name', 'firstName']);
  const last = pick(o, ['last_name', 'lastName']);
  const full = pick(o, ['name', 'full_name', 'fullName']) || [first, last].filter(Boolean).join(' ');
  const email = pick(o, ['email', 'work_email', 'professional_email']);
  return {
    full_name: full,
    first_name: first,
    last_name: last,
    title: pick(o, ['title', 'job_title', 'headline']),
    company: pick(o, ['organization_name', 'company', 'company_name', 'organization']),
    company_domain: pick(o, ['organization_domain', 'company_domain', 'domain', 'website']),
    email,
    email_status: email ? (pick(o, ['email_status']) === 'verified' ? 'verified' : 'guessed') : 'unknown',
    linkedin_url: pick(o, ['linkedin_url', 'linkedinUrl', 'linkedin']),
    secteur: pick(o, ['industry', 'organization_industry']),
    localisation: pick(o, ['location', 'city', 'country', 'organization_city']),
    seniority: pick(o, ['seniority', 'seniority_level']),
    apollo_id: pick(o, ['id', 'apollo_id', 'person_id']),
  };
}

export interface IngestResult {
  status: string;
  inserted: number;
  total: number;
}

/** Vérifie le run Apify d'une liste et ingère le dataset s'il est terminé. */
export async function ingestList(db: SupabaseClient, listId: string): Promise<IngestResult> {
  const apifyKey = Deno.env.get('APIFY_API_KEY');
  if (!apifyKey) throw new Error('Apify non configuré (APIFY_API_KEY).');

  const { data: list } = await db.from('prospect_lists').select('*').eq('id', listId).maybeSingle();
  if (!list) throw new Error('Liste introuvable.');

  // deno-lint-ignore no-explicit-any
  const meta = (list.criteria as any)?._apify ?? {};
  const runId = meta.runId;
  if (!runId) throw new Error('Aucun run Apify associé.');

  const runRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${apifyKey}`);
  const runBody = await runRes.json();
  const status = runBody.data?.status ?? 'UNKNOWN';
  const datasetId = meta.datasetId || runBody.data?.defaultDatasetId;

  if (status !== 'SUCCEEDED') return { status, inserted: 0, total: list.count ?? 0 };

  const itemsRes = await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items?clean=true&format=json&limit=1000&token=${apifyKey}`
  );
  const items = (await itemsRes.json()) as unknown[];

  const consentBasis = 'Intérêt légitime B2B (prospection professionnelle) — opt-out respecté';
  const existing = new Set<string>();
  const { data: already } = await db.from('prospects').select('apollo_id, email').eq('list_id', listId);
  for (const p of already ?? []) {
    if (p.apollo_id) existing.add('a:' + p.apollo_id);
    if (p.email) existing.add('e:' + p.email);
  }

  const rows = items
    .map(mapProspect)
    .filter((r) => r.full_name)
    .filter((r) => {
      const key = r.apollo_id ? 'a:' + r.apollo_id : r.email ? 'e:' + r.email : 'n:' + r.full_name;
      if (existing.has(key)) return false;
      existing.add(key);
      return true;
    })
    .map((r) => ({ ...r, list_id: listId, consent_basis: consentBasis, stage: 'new' as const }));

  let inserted = 0;
  for (let i = 0; i < rows.length; i += 200) {
    const batch = rows.slice(i, i + 200);
    const { error } = await db.from('prospects').insert(batch);
    if (!error) inserted += batch.length;
  }

  const { count } = await db
    .from('prospects')
    .select('id', { count: 'exact', head: true })
    .eq('list_id', listId);
  await db.from('prospect_lists').update({ status: 'ready', count: count ?? inserted }).eq('id', listId);

  return { status, inserted, total: count ?? inserted };
}

export interface EnrichResult {
  enriched: number;
  more: boolean;
}

/** Score + angle d'approche IA pour un lot de prospects "new". */
export async function enrichBatch(db: SupabaseClient, listId: string, limit: number): Promise<EnrichResult> {
  const { data: prospects } = await db
    .from('prospects')
    .select('*')
    .eq('list_id', listId)
    .eq('stage', 'new')
    .limit(Math.min(limit, 20));

  let enriched = 0;
  for (const p of prospects ?? []) {
    try {
      const vars = {
        full_name: p.full_name,
        title: p.title ?? '',
        company: p.company ?? '',
        secteur: p.secteur ?? '',
        seniority: p.seniority ?? '',
        signals: JSON.stringify(p.enrichment ?? {}).slice(0, 500),
      };
      const out = await callLLM(db, 'enrichissement_prospect', vars, { jsonMode: true });
      // deno-lint-ignore no-explicit-any
      let parsed: any = {};
      try {
        parsed = JSON.parse(out.text);
      } catch {
        parsed = {};
      }
      const score = Math.max(0, Math.min(100, Number(parsed.score) || 0));
      await db
        .from('prospects')
        .update({
          score,
          enrichment: { ...(p.enrichment ?? {}), angle: parsed.angle ?? null, rationale: parsed.rationale ?? null },
          stage: 'enriched',
        })
        .eq('id', p.id);
      enriched++;
    } catch (e) {
      console.error('Enrichissement prospect échoué', p.id, e);
    }
  }

  const { count } = await db
    .from('prospects')
    .select('id', { count: 'exact', head: true })
    .eq('list_id', listId)
    .eq('stage', 'new');

  return { enriched, more: (count ?? 0) > 0 };
}
