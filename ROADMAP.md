# Le Négociateur — Architecture & Roadmap

Cible : cadres / CSP+ francophones, priorité aux **métiers en tension** (le marché bouge vite,
rapport de force favorable). Marque unique, deux temps : **diagnostic gratuit** (rapport d'écart) →
**produit** (Kit de Négociation + upsell).

## Stack

- **Front** : Vite + React + TypeScript + Tailwind + React Router.
- **Backend** : Supabase (Postgres + Auth + RLS + Edge Functions Deno + Cron `pg_cron`).
- **IA** : OpenRouter via une abstraction unique (`_shared/llm.ts`, `callLLM`), **jamais** appelée
  depuis le navigateur. Modèles/prompts réglables en base (`agent_config`) sans redéploiement.
- **Paiement** : Stripe Checkout hébergé + webhook. **Email** : Resend. **Prospection** : Apify.

## Modèle de données (Supabase, RLS partout)

`profiles` · `leads` (CRM, segment, écart, variante A/B) · `gap_reports` · `salary_benchmarks`
(intitulé, ROME, séniorité, zone, fourchette, **metier_en_tension**, **tension_score**, source) ·
`sector_coefficients` · `benchmark_updates` (validation humaine) · `products` (prix Kit + upsell) ·
`orders` · `deliverables` · `email_sequences` / `email_events` · `ab_experiments` / `ab_stats` ·
`prospect_lists` / `prospects` · `agent_config` · `agent_runs` · `agent_jobs` (file d'orchestration).

## Agents IA (`agent_config`, pilotés depuis `/admin/prompts`)

| Agent | Rôle | Déclencheur |
|---|---|---|
| `analyse_ecart` | Analyse de positionnement du rapport gratuit | Soumission questionnaire |
| `kit_offensif` | Génération du Kit personnalisé (produit payant) | Webhook Stripe |
| `maj_benchmarks` | Curation hebdo du référentiel (propositions) | Cron lundi |
| `enrichissement_prospect` | Score + angle d'approche d'un prospect | Orchestrateur / manuel |

## Phases — état

- ✅ **Phase 0 — Fondations** : scaffold, schéma DB + RLS, client Supabase, routing.
- ✅ **Phase 1 — Tunnel** : questionnaire multi-étapes, capture A/B, reveal rapport d'écart (`rapport-ecart`).
- ✅ **Phase 2 — Données** : référentiel CSP+ / métiers en tension (ROME, tension), curation IA.
- ✅ **Phase 3 — Revenu** : page de vente Kit + upsell, Stripe Checkout, fulfillment IA, livraison, séquence emails.
- ✅ **Phase 4 — Back-office** : CRM, IA & prompts, prix, benchmarks, A/B.
- ✅ **Phase 5 — Prospection** : agent Apollo via Apify (import, ingestion, enrichissement IA), conformité B2B.
- ✅ **Phase 6 — Orchestration** : file `agent_jobs` + orchestrateur cron + journalisation.

## Pistes suivantes (non bloquantes)

- ✅ **Agrégation multi-sources par prospect** (`salary_intel`) : calculer-salaire.com, moicombien.fr,
  France Travail (OAuth2). Best-effort, sauvegardée, utilisée par le compte-rendu IA.
- **Ingestion en masse des datasets publics** (INSEE/DARES/APEC) pour enrichir le référentiel de base
  (en complément de l'agrégation temps réel par prospect ci-dessus).
- **Définir le contenu réel de l'upsell** (placeholder « Accompagnement Premium » à 99 €).
- **Séquence d'outreach** sur les prospects scorés (emails B2B conformes, opt-out, A/B).
- **Espace abonné** si offre récurrente (« Bouclier »).
- **Mentions légales / politique de confidentialité** à compléter (pages stub présentes).
