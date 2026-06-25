-- =====================================================================
-- Abonnements (Bouclier) : suivi du statut Stripe par client.
-- =====================================================================

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  stripe_subscription_id text unique,
  stripe_customer_id text,
  status text not null default 'active',
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

create index idx_subscriptions_email on public.subscriptions (email);

alter table public.subscriptions enable row level security;
create policy "admin: subscriptions" on public.subscriptions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
