-- =====================================================================
-- Moteur OTO (one-time offers façon ClickFunnels) : upsell/downsell
-- post-achat, configurables depuis le back-office. One-click via la carte
-- mémorisée (stripe_customer_id sur la commande).
-- =====================================================================

alter table public.orders add column if not exists stripe_customer_id text;

create table public.oto_steps (
  id uuid primary key default gen_random_uuid(),
  position integer not null default 0,
  headline text not null default '',
  subhead text not null default '',
  upsell_slug text not null,
  downsell_slug text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.oto_steps enable row level security;
create policy "public: oto actifs" on public.oto_steps
  for select to anon, authenticated using (active = true);
create policy "admin: oto_steps" on public.oto_steps for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Étape OTO par défaut : upsell Simulateur (1-clic), downsell Bouclier (abo).
insert into public.oto_steps (position, headline, subhead, upsell_slug, downsell_slug) values
(
  1,
  'Une dernière chose, et vous serez imbattable.',
  'Vous avez le dossier. Ajoutez l''entraînement : affrontez un manager IA jusqu''à ce que votre demande soit parfaitement rodée — en un clic, sans ressaisir votre carte.',
  'simulateur',
  'bouclier'
);
