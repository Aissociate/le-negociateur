-- =====================================================================
-- Personas du Simulateur d'entretien, configurables en back-office.
-- Le prompt du persona est injecté dans {{persona}} de l'agent simulateur.
-- =====================================================================

create table public.simulator_personas (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  prompt text not null,
  active boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.simulator_personas enable row level security;
create policy "public: personas actifs" on public.simulator_personas
  for select to anon, authenticated using (active = true);
create policy "admin: personas" on public.simulator_personas for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

insert into public.simulator_personas (key, label, prompt, position) values
('bienveillant', 'Manager bienveillant', 'Manager à l''écoute, encourageant mais réaliste sur le budget. Pose des questions ouvertes, valorise les arguments solides, mais rappelle les contraintes.', 1),
('direct', 'Direct & budget', 'Manager direct et factuel, attaché au budget, ouvert mais exigeant. Va droit au but, demande des preuves chiffrées, oppose des contraintes budgétaires.', 2),
('coriace', 'Recruteur coriace', 'Recruteur expérimenté et coriace, qui pousse fort les objections et cède difficilement. Teste la résistance, minimise les arguments, multiplie les contre-objections.', 3);
