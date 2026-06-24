-- =====================================================================
-- Le Négociateur — Schéma initial (étendu)
-- Funnel : questionnaire -> capture A/B -> rapport d'écart -> séquence emails -> Kit + upsell
-- Back-office : CRM, config IA (OpenRouter), prix, benchmarks, A/B
-- Prospection : agent commercial Apollo + enrichissement web
-- Orchestration : file agent_jobs
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Profils & rôles
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper : l'utilisateur courant est-il admin ? (security definer => pas de récursion RLS)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ---------------------------------------------------------------------
-- 2. Funnel : leads & rapports d'écart
-- ---------------------------------------------------------------------
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  poste text not null,
  secteur text not null,
  seniorite text not null,
  localisation text not null,
  remuneration_actuelle integer not null,
  segment text,
  gap_annual integer,
  gap_percent integer,
  statut text not null default 'lead' check (statut in ('lead', 'client', 'desinscrit')),
  sequence_step integer not null default 0,
  next_email_at timestamptz,
  last_report_id uuid,
  ab_variant text,
  consent_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.gap_reports (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads (id) on delete cascade,
  poste text not null,
  secteur text not null,
  seniorite text not null,
  localisation text not null,
  remuneration_actuelle integer not null,
  market_low integer not null,
  market_median integer not null,
  market_high integer not null,
  gap_annual integer not null,
  gap_percent integer not null,
  segment text not null,
  analysis_md text not null,
  source text not null,
  annee integer not null,
  metier_en_tension boolean not null default false,
  created_at timestamptz not null default now()
);

-- L'actif produit principal : le référentiel de salaires cadres / CSP+.
create table public.salary_benchmarks (
  id uuid primary key default gen_random_uuid(),
  secteur text not null default 'Tous secteurs',
  intitule text not null,
  code_rome text,
  seniorite text not null,
  localisation text not null,
  salaire_bas integer not null,
  salaire_median integer not null,
  salaire_haut integer not null,
  metier_en_tension boolean not null default false,
  tension_score integer not null default 0, -- 0-100 : intensité de la tension / mobilité du marché
  source text not null,
  annee integer not null,
  updated_at timestamptz not null default now(),
  unique (secteur, intitule, seniorite, localisation)
);

-- Coefficients sectoriels appliqués au référentiel générique.
create table public.sector_coefficients (
  secteur text primary key,
  coef numeric not null default 1.0
);

-- Propositions de mise à jour (agent IA de curation) — validation humaine requise.
create table public.benchmark_updates (
  id uuid primary key default gen_random_uuid(),
  benchmark_id uuid not null references public.salary_benchmarks (id) on delete cascade,
  proposed jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

-- ---------------------------------------------------------------------
-- 3. Produits & prix (Kit + upsell) — pilotables depuis le back-office
-- ---------------------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  kind text not null default 'kit' check (kind in ('kit', 'upsell', 'subscription')),
  price_cents integer not null,
  compare_at_cents integer,
  currency text not null default 'eur',
  stripe_price_id text,
  description_md text not null default '',
  active boolean not null default true,
  position integer not null default 0,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 4. Commandes & livrables
-- ---------------------------------------------------------------------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads (id) on delete set null,
  email text not null,
  stripe_session_id text unique,
  amount integer not null,
  product_slugs text[] not null default array['kit'],
  status text not null default 'pending' check (status in ('pending', 'paid', 'refunded')),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table public.deliverables (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders (id) on delete cascade,
  lead_id uuid references public.leads (id) on delete set null,
  type text not null default 'kit_offensif',
  content_md text not null,
  access_token text not null unique,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 5. Emails (séquences de nurturing)
-- ---------------------------------------------------------------------
create table public.email_sequences (
  id uuid primary key default gen_random_uuid(),
  step integer not null unique,
  delay_hours integer not null,
  subject text not null,
  body_html text not null,
  active boolean not null default true
);

create table public.email_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads (id) on delete cascade,
  step integer not null,
  status text not null,
  error text,
  sent_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 6. A/B testing du copywriting de capture
-- ---------------------------------------------------------------------
create table public.ab_experiments (
  key text primary key,
  label text not null,
  active boolean not null default true,
  variants jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create table public.ab_stats (
  experiment_key text not null,
  variant_key text not null,
  views integer not null default 0,
  captures integer not null default 0,
  purchases integer not null default 0,
  primary key (experiment_key, variant_key)
);

-- Incrément atomique d'un compteur A/B (appelé par la fonction ab-track via service role).
create or replace function public.increment_ab_stat(p_experiment text, p_variant text, p_event text)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.ab_stats (experiment_key, variant_key, views, captures, purchases)
  values (
    p_experiment, p_variant,
    case when p_event = 'view' then 1 else 0 end,
    case when p_event = 'capture' then 1 else 0 end,
    case when p_event = 'purchase' then 1 else 0 end
  )
  on conflict (experiment_key, variant_key) do update set
    views = ab_stats.views + (case when p_event = 'view' then 1 else 0 end),
    captures = ab_stats.captures + (case when p_event = 'capture' then 1 else 0 end),
    purchases = ab_stats.purchases + (case when p_event = 'purchase' then 1 else 0 end);
end;
$$;

-- ---------------------------------------------------------------------
-- 7. CRM prospection (agent commercial Apollo + enrichissement web)
-- ---------------------------------------------------------------------
create table public.prospect_lists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  criteria jsonb not null default '{}',
  source text not null default 'apollo' check (source in ('apollo', 'web', 'manual')),
  status text not null default 'draft' check (status in ('draft', 'enriching', 'ready', 'archived')),
  count integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.prospects (
  id uuid primary key default gen_random_uuid(),
  list_id uuid references public.prospect_lists (id) on delete set null,
  full_name text not null,
  first_name text,
  last_name text,
  title text,
  company text,
  company_domain text,
  email text,
  email_status text not null default 'unknown' check (email_status in ('unknown', 'verified', 'guessed', 'invalid')),
  linkedin_url text,
  secteur text,
  localisation text,
  seniority text,
  apollo_id text,
  enrichment jsonb not null default '{}',
  score integer not null default 0,
  stage text not null default 'new' check (stage in ('new', 'enriched', 'queued', 'contacted', 'replied', 'won', 'lost', 'unsubscribed')),
  consent_basis text, -- base légale RGPD (ex : intérêt légitime B2B documenté)
  notes text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 8. IA : config, journal, file d'orchestration
-- ---------------------------------------------------------------------
create table public.agent_config (
  id uuid primary key default gen_random_uuid(),
  agent text not null unique,
  label text not null,
  model text not null,
  system_prompt text not null,
  user_prompt_template text not null,
  temperature numeric not null default 0.5,
  max_tokens integer not null default 2000,
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

create table public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  agent text not null,
  status text not null,
  tokens_in integer not null default 0,
  tokens_out integer not null default 0,
  duration_ms integer not null default 0,
  detail text,
  created_at timestamptz not null default now()
);

-- File d'attente : jobs courts, idempotents, repris par lots à chaque tick de cron.
create table public.agent_jobs (
  id uuid primary key default gen_random_uuid(),
  agent text not null,
  payload jsonb not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'running', 'done', 'failed')),
  attempts integer not null default 0,
  last_error text,
  run_after timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 9. Index
-- ---------------------------------------------------------------------
create index idx_leads_next_email on public.leads (next_email_at) where next_email_at is not null;
create index idx_benchmarks_updated on public.salary_benchmarks (updated_at);
create index idx_benchmarks_tension on public.salary_benchmarks (metier_en_tension) where metier_en_tension;
create index idx_benchmark_updates_status on public.benchmark_updates (status);
create index idx_prospects_list on public.prospects (list_id);
create index idx_prospects_stage on public.prospects (stage);
create index idx_agent_jobs_pending on public.agent_jobs (run_after) where status = 'pending';

-- ---------------------------------------------------------------------
-- 10. RLS — tout fermé ; accès admin via is_admin() ; le public passe par
--     les Edge Functions (clé service). Exception : lecture des produits actifs.
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.leads enable row level security;
alter table public.gap_reports enable row level security;
alter table public.salary_benchmarks enable row level security;
alter table public.sector_coefficients enable row level security;
alter table public.benchmark_updates enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.deliverables enable row level security;
alter table public.email_sequences enable row level security;
alter table public.email_events enable row level security;
alter table public.ab_experiments enable row level security;
alter table public.ab_stats enable row level security;
alter table public.prospect_lists enable row level security;
alter table public.prospects enable row level security;
alter table public.agent_config enable row level security;
alter table public.agent_runs enable row level security;
alter table public.agent_jobs enable row level security;

create policy "profiles: lire son profil" on public.profiles
  for select to authenticated using (auth.uid() = id);

-- Produits actifs lisibles publiquement (page de vente affiche les prix).
create policy "public: produits actifs" on public.products
  for select to anon, authenticated using (active = true);

-- Accès admin complet sur l'ensemble des tables métier.
create policy "admin: leads" on public.leads for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin: gap_reports" on public.gap_reports for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin: salary_benchmarks" on public.salary_benchmarks for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin: sector_coefficients" on public.sector_coefficients for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin: benchmark_updates" on public.benchmark_updates for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin: products" on public.products for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin: orders" on public.orders for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin: deliverables" on public.deliverables for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin: email_sequences" on public.email_sequences for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin: email_events" on public.email_events for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin: ab_experiments" on public.ab_experiments for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin: ab_stats" on public.ab_stats for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin: prospect_lists" on public.prospect_lists for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin: prospects" on public.prospects for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin: agent_config" on public.agent_config for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin: agent_runs" on public.agent_runs for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin: agent_jobs" on public.agent_jobs for all to authenticated using (public.is_admin()) with check (public.is_admin());
