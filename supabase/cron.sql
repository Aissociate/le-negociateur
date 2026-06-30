-- =====================================================================
-- Planification cron (à exécuter UNE FOIS dans le SQL Editor Supabase,
-- après avoir remplacé les 2 placeholders) :
--   VOTRE-PROJET   -> ref du projet (Settings > General)
--   VOTRE_CLE_ANON -> clé anon (Settings > API)
-- Prérequis : extensions pg_cron et pg_net activées (Database > Extensions).
-- =====================================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Ré-exécutable : on retire d'abord les jobs existants (évite les doublons).
select cron.unschedule(jobname) from cron.job
 where jobname in ('send-emails-tick','orchestrator-tick','update-benchmarks-weekly','prospect-outreach-tick');

-- 1. Séquence d'emails : toutes les 15 minutes
select cron.schedule(
  'send-emails-tick',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := 'https://VOTRE-PROJET.supabase.co/functions/v1/send-emails',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer VOTRE_CLE_ANON"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- 2. Orchestrateur (file agent_jobs : ingestion Apify + enrichissement) : toutes les 2 minutes
select cron.schedule(
  'orchestrator-tick',
  '*/2 * * * *',
  $$
  select net.http_post(
    url := 'https://VOTRE-PROJET.supabase.co/functions/v1/orchestrator',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer VOTRE_CLE_ANON"}'::jsonb,
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
  $$
);

-- 3. Curation du référentiel salaires : chaque lundi à 06h00 UTC
select cron.schedule(
  'update-benchmarks-weekly',
  '0 6 * * 1',
  $$
  select net.http_post(
    url := 'https://VOTRE-PROJET.supabase.co/functions/v1/update-benchmarks',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer VOTRE_CLE_ANON"}'::jsonb,
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
  $$
);

-- 4. Prospection (agent commercial) : envoi des emails aux listes activées,
--    toutes les 10 minutes (lots de 25 pour préserver la délivrabilité).
select cron.schedule(
  'prospect-outreach-tick',
  '*/10 * * * *',
  $$
  select net.http_post(
    url := 'https://VOTRE-PROJET.supabase.co/functions/v1/prospect-outreach',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer VOTRE_CLE_ANON"}'::jsonb,
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
  $$
);

-- Vérifier : select * from cron.job;
-- Supprimer : select cron.unschedule('send-emails-tick');
