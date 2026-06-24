// Orchestrateur : consomme la file `agent_jobs` (jobs courts, idempotents, par
// lots) à chaque tick de cron. Reprend les jobs `pending` arrivés à échéance,
// les exécute, reprogramme ou marque échec avec backoff.

import { serviceClient } from '../_shared/db.ts';
import { json } from '../_shared/cors.ts';
import { ingestList, enrichBatch } from '../_shared/prospects.ts';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

const BATCH = 5;
const MAX_ATTEMPTS = 5;
const MAX_WAIT_ATTEMPTS = 40; // ~80 min d'attente max pour un run Apify

// deno-lint-ignore no-explicit-any
async function reschedule(db: SupabaseClient, job: any, seconds: number, err?: string) {
  await db
    .from('agent_jobs')
    .update({
      status: 'pending',
      run_after: new Date(Date.now() + seconds * 1000).toISOString(),
      last_error: err ?? null,
    })
    .eq('id', job.id);
}

// deno-lint-ignore no-explicit-any
async function fail(db: SupabaseClient, job: any, err: string) {
  await db.from('agent_jobs').update({ status: 'failed', last_error: err }).eq('id', job.id);
}

Deno.serve(async (_req) => {
  const db = serviceClient();
  const now = new Date().toISOString();

  const { data: jobs } = await db
    .from('agent_jobs')
    .select('*')
    .eq('status', 'pending')
    .lte('run_after', now)
    .order('run_after')
    .limit(BATCH);

  let done = 0;
  let rescheduled = 0;
  let failed = 0;

  for (const job of jobs ?? []) {
    await db.from('agent_jobs').update({ status: 'running', attempts: job.attempts + 1 }).eq('id', job.id);
    // deno-lint-ignore no-explicit-any
    const payload = (job.payload ?? {}) as any;

    try {
      if (job.agent === 'apollo_ingest') {
        const result = await ingestList(db, payload.list_id);
        if (result.status !== 'SUCCEEDED') {
          if (job.attempts >= MAX_WAIT_ATTEMPTS) {
            await fail(db, job, `Run Apify non terminé (${result.status}).`);
            failed++;
          } else {
            await reschedule(db, job, 120, `En attente du run Apify (${result.status}).`);
            rescheduled++;
          }
        } else {
          await db.from('agent_jobs').update({ status: 'done' }).eq('id', job.id);
          // Enchaîne l'enrichissement de la liste fraîchement ingérée
          await db.from('agent_jobs').insert({ agent: 'apollo_enrich', payload: { list_id: payload.list_id } });
          done++;
        }
      } else if (job.agent === 'apollo_enrich') {
        const result = await enrichBatch(db, payload.list_id, 10);
        if (result.more) {
          await reschedule(db, job, 5);
          rescheduled++;
        } else {
          await db.from('agent_jobs').update({ status: 'done' }).eq('id', job.id);
          done++;
        }
      } else {
        await db.from('agent_jobs').update({ status: 'done', last_error: 'agent inconnu' }).eq('id', job.id);
        done++;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (job.attempts >= MAX_ATTEMPTS) {
        await fail(db, job, msg);
        failed++;
      } else {
        await reschedule(db, job, 60, msg);
        rescheduled++;
      }
    }
  }

  return json({ processed: jobs?.length ?? 0, done, rescheduled, failed });
});
