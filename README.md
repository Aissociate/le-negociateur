# Le Négociateur

Plateforme de génération de leads et de vente pour cadres / CSP+ : un tunnel de conversion
qui révèle, par IA, l'écart entre le salaire de l'utilisateur et le marché, puis vend un
**Kit de Négociation** personnalisé — le tout piloté par un back-office complet (CRM, IA, prix,
A/B, prospection sortante, orchestration).

> Pitch : **« Êtes-vous assez payé pour ce que vous savez faire ? Votre patron dirait oui. »**

Stack : **Vite + React + TypeScript + Tailwind + Supabase (Postgres/Auth/Edge Functions/Cron) +
Stripe + OpenRouter + Resend + Apify**. Architecture détaillée : [ROADMAP.md](ROADMAP.md). Conformité :
[CONFORMITE.md](CONFORMITE.md).

## Le tunnel

1. **`/`** — Questionnaire multi-étapes (poste → secteur → séniorité → localisation → rému) puis
   **capture email + consentement**, avec **A/B testing** du copywriting (`src/lib/ab.ts`).
2. **`/rapport/:id`** — Page *reveal* : écart chiffré, positionnement marché, badge **métier en
   tension**, analyse IA, CTA Kit.
3. **Séquence de 4 emails** (cron) — relances jusqu'à l'achat.
4. **`/kit`** — Page de vente (Kit **49 €** + order-bump upsell), prix lus en base → Stripe Checkout.
5. **`/merci` → `/kit/document/:token`** — webhook Stripe → génération IA du Kit → page imprimable PDF + email.
6. **`/admin`** — back-office (voir plus bas).

## Mise en route

### 1. Front

```bash
npm install
cp .env.example .env   # renseigner VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY
npm run dev
```

### 2. Supabase

1. Créer un projet Supabase.
2. Appliquer les migrations (`supabase db push`, ou coller les fichiers `supabase/migrations/*.sql`
   dans le SQL Editor, dans l'ordre).
3. Déployer les fonctions :
   ```bash
   supabase functions deploy rapport-ecart public-data ab-track create-checkout stripe-webhook \
     send-emails update-benchmarks orchestrator prospect-import prospect-ingest prospect-enrich \
     salary-intel-test personalize-kit account-data interview-chat billing-portal
   ```
4. Renseigner les secrets (Settings → Edge Functions → Secrets) :
   - `OPENROUTER_API_KEY` — IA (modèles réglables dans `/admin/prompts`)
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
   - `RESEND_API_KEY`, `EMAIL_FROM`
   - `APIFY_API_KEY`, `APIFY_APOLLO_ACTOR` — agent de prospection
   - `FT_CLIENT_ID`, `FT_CLIENT_SECRET`, `FT_SCOPE`, `FT_MARCHE_TRAVAIL_URL` — France Travail (optionnel, agrégation salaires)
   - `SITE_URL` — URL publique du site
5. Activer les crons : exécuter `supabase/cron.sql` (remplacer les 2 placeholders).

### 3. Stripe

Webhook → `https://VOTRE-PROJET.supabase.co/functions/v1/stripe-webhook`, événements
`checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted` ;
copier le secret `whsec_...` dans `STRIPE_WEBHOOK_SECRET`. Activer le **Customer Portal**
(Stripe → Settings → Billing → Customer portal) pour la gestion d'abonnement.

### 4. Compte admin

1. Authentication → Users → « Add user » (email + mot de passe).
2. `update public.profiles set role = 'admin' where id = 'UUID';`
3. Se connecter sur `/admin/login`.

## Données salaires (actif n°1)

Référentiel `salary_benchmarks` orienté **cadres CSP+ / métiers en tension** (cyber, DevOps, data,
dev, product, R&D, supply chain…), avec **code ROME**, **score de tension** et sources publiques
(INSEE base Tous salariés, DARES métiers en tension, APEC). Mise à jour : l'agent `maj_benchmarks`
propose des ajustements hebdo dans `/admin/benchmarks` — **rien n'est appliqué sans validation humaine**.

### Agrégation multi-sources par prospect

À chaque soumission, `rapport-ecart` agrège (best-effort, tolérant aux pannes) des **données externes
en temps réel** propres au prospect et les sauve dans `salary_intel` :
- **calculer-salaire.com** (public) : brut→net + cotisations, percentile INSEE ;
- **moicombien.fr** (public) : capacité d'emprunt (projection chiffrée du bénéfice) ;
- **France Travail – Marché du travail** (OAuth2, optionnel) : tension, offres, salaires proposés par ROME.

Ces faits + des projections calculées (écart cumulé 5 ans, marge haut de fourchette, gain de capacité
d'emprunt) nourrissent un **compte-rendu IA éducatif et factuel** qui conclut sur l'offre produit —
que le prospect soit en dessous **ou** au-dessus de la médiane.

## Back-office (`/admin`)

Tableau de bord · **Leads (CRM)** · **Prospection** (Apollo via Apify) · **Base salaires** ·
**Produits & prix** · **A/B copy** · **IA & Prompts** (OpenRouter, sans redéploiement) ·
Séquence emails · Commandes · **Orchestration** (file `agent_jobs`).

## Prospection sortante (Apollo via Apify)

`/admin/prospection` crée des listes, lance un **run Apify** (scraper Apollo.io), ingère le dataset,
puis **score + génère un angle d'approche par IA**. Fonctions protégées par garde admin (JWT).
Conformité B2B intégrée (voir [CONFORMITE.md](CONFORMITE.md)).

## Espace client & Simulateur

`/compte` — connexion **magic link** (Supabase OTP), avec documents générés, factures, statut d'abonnement et **accès IA si actif**. *(Configurer les Redirect URLs dans Supabase → Authentication → URL Configuration : ajouter `https://votredomaine.fr/compte`.)*

`/simulateur` — **Simulateur d'entretien IA** (gated par l'achat du Simulateur / Pack / Bouclier) : jeu de rôle où l'IA joue le recruteur, connaît tout le contexte du client (positionnement + profil détaillé), mène l'entretien selon un **persona**, avec **input vocal** (Web Speech API) et débrief noté. Agent `simulateur_entretien` éditable dans `/admin/prompts`.

## Orchestration

La file `agent_jobs` (ingestion Apify, enrichissement) est consommée par la fonction `orchestrator`
(cron toutes les 2 min) : jobs courts, idempotents, repris avec backoff. Journalisation des appels IA
dans `agent_runs` (tokens, durée), visible au tableau de bord.
