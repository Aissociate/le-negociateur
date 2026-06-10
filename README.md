# Le Négociateur

Funnel de vente complet pour cadres : analyse gratuite du positionnement salarial (capture email) → séquence de 4 emails → **Kit de Négociation Offensif** (PDF payant, généré par IA) — avec back-office admin (IA, prompts, référentiel salaires, leads, emails, commandes).

> Architecture détaillée : voir [PLAN-ARCHITECTURE.md](PLAN-ARCHITECTURE.md). Stack : **Vite + React + TypeScript + Tailwind + Supabase + Stripe + OpenRouter + Resend** — compatible **Bolt.new** (l'app tourne sur Netlify + Supabase).

## Le funnel

1. **`/` Vitrine** — formulaire (poste, secteur, séniorité, localisation, salaire, email + consentement RGPD).
2. **`/rapport/:id`** — rapport d'écart chiffré (référentiel + coefficient sectoriel) + analyse IA, CTA vers le Kit.
3. **Séquence de 4 emails** (cron 15 min) — J0 analyse, J+2 coût de l'inaction, J+4 objections, J+7 garantie. S'arrête à l'achat.
4. **`/kit`** — page de vente (79 €) → Stripe Checkout hébergé.
5. **`/merci` + `/kit/document/:token`** — webhook Stripe → génération IA du Kit personnalisé → livraison email + page imprimable en PDF.
6. **`/admin`** — tableau de bord, leads, **base salaires** (validation des MAJ hebdo proposées par l'IA), **IA & prompts** (modèle, prompts, température par agent), séquence emails, commandes.

## Mise en route

### 1. Front

```bash
npm install
cp .env.example .env   # renseigner VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY
npm run dev
```

### 2. Supabase

1. Créer un projet Supabase (ou connecter l'intégration native dans Bolt).
2. Appliquer les migrations : `supabase db push` (ou copier les fichiers `supabase/migrations/*.sql` dans le SQL Editor, dans l'ordre).
3. Déployer les fonctions : `supabase functions deploy rapport-ecart public-data create-checkout stripe-webhook send-emails update-benchmarks`.
4. Renseigner les secrets (Settings → Edge Functions → Secrets) :
   - `OPENROUTER_API_KEY` — IA (modèles réglables dans `/admin/prompts`)
   - `STRIPE_SECRET_KEY` et `STRIPE_WEBHOOK_SECRET`
   - `RESEND_API_KEY` et `EMAIL_FROM`
   - `SITE_URL` — URL publique du site
5. Activer les crons : exécuter `supabase/cron.sql` dans le SQL Editor (remplacer les 2 placeholders).

### 3. Stripe

Créer un webhook → `https://VOTRE-PROJET.supabase.co/functions/v1/stripe-webhook`, événement `checkout.session.completed`, et copier le secret `whsec_...` dans `STRIPE_WEBHOOK_SECRET`.

### 4. Compte admin

1. Créer un utilisateur : Authentication → Users → « Add user » (email + mot de passe).
2. Le passer admin :
   ```sql
   update public.profiles set role = 'admin' where id = 'UUID-DE-L-UTILISATEUR';
   ```
3. Se connecter sur `/admin/login`.

## Base de salaires

- Seed initial : 24 fonctions cadres × 4 séniorités × 3 zones = **288 lignes** (`salary_benchmarks`) + 10 coefficients sectoriels.
- **Mise à jour hebdomadaire** : chaque lundi, l'agent `maj_benchmarks` passe en revue un lot de lignes et dépose ses propositions dans `benchmark_updates`. **Rien n'est appliqué sans validation humaine** dans `/admin/benchmarks` (conformité « chiffres sourcés »).
- Édition manuelle possible ligne à ligne dans le même écran.

## Gestion des IA (back-office)

`/admin/prompts` pilote la table `agent_config` : pour chaque agent (`analyse_ecart`, `kit_offensif`, `maj_benchmarks`), on règle **sans redéploiement** le modèle (slug OpenRouter), les prompts système/utilisateur, la température, le plafond de tokens et l'interrupteur on/off. Chaque appel est journalisé dans `agent_runs` (tokens, durée, erreurs) — visible sur le tableau de bord.

## Conformité (résumé)

- Consentement explicite horodaté à la capture ; désinscription gérée (statut `desinscrit`).
- Chiffres toujours présentés comme **estimations sourcées** ; aucun gain « garanti ».
- Paiement exclusivement via Stripe Checkout hébergé ; aucune donnée bancaire dans l'app.
- RLS activée sur toutes les tables ; le public ne passe que par les Edge Functions ; secrets uniquement côté serveur.

## Import dans Bolt

Pousser ce dépôt sur GitHub puis l'importer dans Bolt (`bolt.new/~/github.com/...`), ou copier les fichiers dans un projet Bolt Vite+React. Connecter ensuite les intégrations natives Supabase et Netlify, et suivre « Mise en route » ci-dessus.
