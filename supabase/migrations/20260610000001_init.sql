-- =====================================================================
-- Le Négociateur — Schéma initial
-- Funnel : capture lead -> rapport d'écart -> séquence 4 emails -> Kit payant
-- + back-office admin (IA, prompts, benchmarks, leads, emails, commandes)
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
-- 2. Tables métier
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
  created_at timestamptz not null default now()
);

-- L'actif produit principal : le référentiel de salaires cadres.
create table public.salary_benchmarks (
  id uuid primary key default gen_random_uuid(),
  secteur text not null default 'Tous secteurs',
  intitule text not null,
  seniorite text not null,
  localisation text not null,
  salaire_bas integer not null,
  salaire_median integer not null,
  salaire_haut integer not null,
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

-- Propositions de mise à jour hebdomadaires (agent IA) — validation humaine requise.
create table public.benchmark_updates (
  id uuid primary key default gen_random_uuid(),
  benchmark_id uuid not null references public.salary_benchmarks (id) on delete cascade,
  proposed jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads (id) on delete set null,
  email text not null,
  stripe_session_id text unique,
  amount integer not null,
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

-- Configuration des agents IA : modèle, prompts, paramètres — éditable dans /admin.
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

-- Journal d'exécution des agents (audit, coût tokens, durée).
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

create index idx_leads_next_email on public.leads (next_email_at) where next_email_at is not null;
create index idx_benchmarks_updated on public.salary_benchmarks (updated_at);
create index idx_benchmark_updates_status on public.benchmark_updates (status);

-- ---------------------------------------------------------------------
-- 3. RLS — tout est fermé ; accès admin via is_admin() ; le public passe
--    exclusivement par les Edge Functions (clé service).
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.leads enable row level security;
alter table public.gap_reports enable row level security;
alter table public.salary_benchmarks enable row level security;
alter table public.sector_coefficients enable row level security;
alter table public.benchmark_updates enable row level security;
alter table public.orders enable row level security;
alter table public.deliverables enable row level security;
alter table public.email_sequences enable row level security;
alter table public.email_events enable row level security;
alter table public.agent_config enable row level security;
alter table public.agent_runs enable row level security;

create policy "profiles: lire son profil" on public.profiles
  for select to authenticated using (auth.uid() = id);

create policy "admin: leads" on public.leads for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "admin: gap_reports" on public.gap_reports for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "admin: salary_benchmarks" on public.salary_benchmarks for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "admin: sector_coefficients" on public.sector_coefficients for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "admin: benchmark_updates" on public.benchmark_updates for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "admin: orders" on public.orders for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "admin: deliverables" on public.deliverables for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "admin: email_sequences" on public.email_sequences for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "admin: email_events" on public.email_events for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "admin: agent_config" on public.agent_config for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "admin: agent_runs" on public.agent_runs for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
