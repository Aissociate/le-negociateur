-- =====================================================================
-- Le Négociateur — Agrégation salariale multi-sources par prospect
-- Collecte (France Travail marché du travail, calculer-salaire.com,
-- moicombien.fr) sauvegardée par prospect, utilisée pour le rapport d'écart.
-- =====================================================================

create table public.salary_intel (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads (id) on delete cascade,
  report_id uuid references public.gap_reports (id) on delete set null,
  poste text not null,
  secteur text,
  seniorite text,
  localisation text,
  code_rome text,
  remuneration_actuelle integer,
  sources jsonb not null default '{}',     -- réponses brutes par fournisseur (audit)
  normalized jsonb not null default '{}',  -- données dérivées utilisées dans le rapport
  created_at timestamptz not null default now()
);

create index idx_salary_intel_lead on public.salary_intel (lead_id);
create index idx_salary_intel_created on public.salary_intel (created_at);

alter table public.salary_intel enable row level security;
create policy "admin: salary_intel" on public.salary_intel for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Données factuelles agrégées attachées au rapport (lues publiquement avec le rapport).
alter table public.gap_reports add column if not exists intel jsonb not null default '{}';
