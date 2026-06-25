-- =====================================================================
-- Profil détaillé post-achat (personnalisation du Kit) : package de
-- rémunération complet, profil emploi/entreprise fin, et réalisations.
-- =====================================================================

create table public.kit_profiles (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders (id) on delete cascade,
  lead_id uuid references public.leads (id) on delete set null,
  profile jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index idx_kit_profiles_order on public.kit_profiles (order_id);

alter table public.kit_profiles enable row level security;
create policy "admin: kit_profiles" on public.kit_profiles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
