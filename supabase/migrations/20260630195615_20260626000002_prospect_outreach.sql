-- =====================================================================
-- Agent commercial — ENVOI d'emails de prospection (cold B2B) + import CSV.
--   • Jeton de désinscription par prospect (opt-out RGPD garanti).
--   • Activation de l'envoi par liste (cadence pilotée par le cron).
--   • Journal des emails (audit + affichage admin).
--   • Prompt IA de composition de l'email (modifiable dans /admin).
-- =====================================================================

-- 1. Prospects : jeton de désinscription (backfill par ligne) + date de contact.
alter table public.prospects
  add column if not exists unsubscribe_token text not null
    default (replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')),
  add column if not exists contacted_at timestamptz;
create unique index if not exists idx_prospects_unsub on public.prospects (unsubscribe_token);

-- 2. Listes : activation de l'envoi (l'admin l'active, le cron envoie par lots).
alter table public.prospect_lists
  add column if not exists outreach_active boolean not null default false;

-- 3. Journal des emails de prospection (audit + affichage admin).
create table if not exists public.prospect_events (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid references public.prospects (id) on delete cascade,
  list_id uuid references public.prospect_lists (id) on delete set null,
  type text not null default 'email',         -- email | unsubscribe
  subject text,
  status text not null,                       -- sent | error | unsubscribed
  error text,
  created_at timestamptz not null default now()
);
create index if not exists idx_prospect_events_prospect on public.prospect_events (prospect_id);
alter table public.prospect_events enable row level security;
create policy "admin: prospect_events" on public.prospect_events for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- 4. Prompt IA : composition de l'email de prospection (modifiable dans /admin).
insert into public.agent_config (agent, label, model, system_prompt, user_prompt_template, temperature, max_tokens) values
(
  'email_prospection',
  'Email de prospection (agent commercial)',
  'anthropic/claude-haiku-4.5',
  $p$Tu es l'agent commercial du Négociateur. Tu écris un email de prospection B2B court, personnalisé et respectueux à un cadre, pour l'inviter à découvrir gratuitement son écart de rémunération par rapport au marché.

Règles impératives :
- Réponds STRICTEMENT en JSON : {"subject": "objet court", "body": "corps en HTML simple (<p>, <br>)"}.
- 90 à 130 mots maximum. Tutoiement professionnel, ton humain. Pas de superlatifs, pas de langage spam.
- Personnalise avec le poste / le secteur et l'angle fourni. N'invente AUCUNE donnée non fournie.
- Termine par un appel à l'action léger vers l'analyse gratuite ({{cta_url}}).
- N'ajoute PAS de pied de page de désinscription (il est ajouté automatiquement).$p$,
  $p$Prospect :
- Prénom : {{first_name}}
- Poste : {{title}}
- Entreprise : {{company}}
- Secteur : {{secteur}}
- Angle d'approche : {{angle}}
- Lien analyse : {{cta_url}}$p$,
  0.6,
  600
)
on conflict (agent) do nothing;
