-- =====================================================================
-- Refonte du tunnel post-achat :
--   • Order bump = « L'Agent Recruteur IA » (ex-Simulateur) — slug inchangé.
--   • Upsell post-achat = capture d'intérêt « Formation IA » (CPF / Qualiopi),
--     enregistrée pour contact futur. AUCUN paiement (le CPF se finance via
--     Mon Compte Formation).
--   • Suppression du Bouclier (abonnement) et du Pack Carrière qui le bundlait.
--   • Le questionnaire détaillé passe APRÈS les upsells (géré côté front).
-- =====================================================================

-- 1. Capture d'intérêt pour des offres « Oui / Non » (formation + futures offres).
create table if not exists public.lead_interests (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete set null,
  email text not null,
  offer text not null,
  interested boolean not null,
  created_at timestamptz not null default now()
);
create index if not exists lead_interests_email_idx on public.lead_interests (email);
create index if not exists lead_interests_offer_idx on public.lead_interests (offer);

alter table public.lead_interests enable row level security;
create policy "admin: lead_interests" on public.lead_interests for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
-- Pas de policy anon : l'écriture passe par la fonction Edge (service role, bypass RLS).

-- 2. L'order bump : on rebaptise le Simulateur en « Agent Recruteur IA ».
update public.products
set name = 'L''Agent Recruteur IA',
    description_md = 'Ton sparring-partner d''entraînement : affronte un « manager » IA qui objecte et négocie vraiment, à l''écrit ou à la voix. Scoring et débrief à chaque passage pour arriver le jour J parfaitement rodé.',
    updated_at = now()
where slug = 'simulateur';

-- 3. Suppression du Bouclier (abonnement) et du Pack Carrière (qui le bundlait).
update public.products set active = false, updated_at = now()
where slug in ('bouclier', 'pack-carriere');

-- 4. On retire les étapes OTO post-achat : le Simulateur devient l'order bump et
--    le Bouclier disparaît. L'unique upsell post-achat est désormais la page
--    « Formation » (capture de lead), gérée hors du moteur oto_steps.
update public.oto_steps set active = false;
