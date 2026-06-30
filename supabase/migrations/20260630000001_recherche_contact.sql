-- =====================================================================
-- Enrichissement de fiche prospect par RECHERCHE WEB (Perplexity Sonar).
--   • Nouvel agent `recherche_contact` : à partir de toutes les infos du
--     contact, recherche web factuelle -> contexte société/rôle + accroches
--     + sources. Stocké sur la fiche (prospects.enrichment.research/sources).
--   • `enrichissement_prospect` (score/angle) et `email_prospection` (cold
--     email) exploitent désormais cette recherche.
--   • Tout est paramétrable dans /admin (IA & Prompts) : modèle, prompt, on/off.
-- Prérequis : la migration 20260626000002_prospect_outreach.sql (agent
--   email_prospection + schéma outreach) doit avoir été appliquée.
-- =====================================================================

-- 1. Nouvel agent : recherche web sur le contact (Sonar via OpenRouter).
insert into public.agent_config (agent, label, model, system_prompt, user_prompt_template, temperature, max_tokens) values
(
  'recherche_contact',
  'Recherche web contact (Perplexity Sonar)',
  'perplexity/sonar',
  $p$Tu es l'agent de recherche B2B du Négociateur. À partir des informations d'un contact professionnel, tu effectues une recherche web FACTUELLE pour préparer une prise de contact (cold email) personnalisée, utile et respectueuse, autour de la rémunération et de la négociation salariale.

Règles impératives :
- Recherche uniquement des informations PUBLIQUES et PROFESSIONNELLES (entreprise, actualités, levées, recrutements, taille, dynamique du secteur, nature du poste). JAMAIS de données personnelles sensibles, vie privée, ni opinions.
- N'invente RIEN. Si une information n'est pas trouvée de façon fiable, laisse le champ vide. Mieux vaut court et vrai que long et faux.
- Réponds STRICTEMENT en JSON, sans aucun texte autour :
{"summary": "2-3 phrases de synthèse factuelle sur le contact et son entreprise", "company_context": "actualités/contexte société pertinents (1-3 phrases)", "role_context": "ce que le poste implique côté rémunération / pouvoir de négociation (1-2 phrases)", "hooks": ["2 à 3 accroches concrètes et personnalisées exploitables dans un cold email"], "sources": ["url1", "url2"]}
- Les accroches doivent s'appuyer sur des faits réels repérés (actu, croissance, tension du secteur…), pas sur des généralités.
- Cite systématiquement tes sources (URLs).$p$,
  $p$Contact à rechercher :
- Nom : {{full_name}}
- Poste : {{title}}
- Entreprise : {{company}} ({{company_domain}})
- LinkedIn : {{linkedin_url}}
- Secteur : {{secteur}}
- Localisation : {{localisation}}
- Séniorité : {{seniority}}

Effectue la recherche web et renvoie le JSON demandé (synthèse, contexte société, contexte rôle, accroches, sources).$p$,
  0.2,
  900
)
on conflict (agent) do nothing;

-- 2. enrichissement_prospect : le score + l'angle exploitent la recherche web.
update public.agent_config
set updated_at = now(),
  user_prompt_template = $p$Prospect :
- Nom : {{full_name}}
- Titre : {{title}}
- Entreprise : {{company}}
- Secteur : {{secteur}}
- Séniorité : {{seniority}}

Recherche web (Perplexity) — ignore si « n/c » :
{{research}}

Autres signaux : {{signals}}

En t'appuyant en priorité sur la recherche web, produis le score et l'angle en JSON.$p$
where agent = 'enrichissement_prospect';

-- 3. email_prospection : le cold email est composé à partir de la recherche web.
update public.agent_config
set updated_at = now(),
  user_prompt_template = $p$Prospect :
- Prénom : {{first_name}}
- Poste : {{title}}
- Entreprise : {{company}}
- Secteur : {{secteur}}
- Angle d'approche : {{angle}}
- Lien analyse : {{cta_url}}

Contexte issu de la recherche web (factuel, ne rien inventer au-delà) — ignore si « n/c » :
{{research}}
Accroches possibles : {{hooks}}

Rédige l'email en t'appuyant sur ce contexte pour le rendre vraiment personnalisé (1 détail concret max), sans en faire trop.$p$
where agent = 'email_prospection';
