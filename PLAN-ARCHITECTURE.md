# Le Négociateur — Architecture & Plan de construction (Bolt)

> Document de référence pour construire la plateforme dans **Bolt.new**.
> Cible : cadres / CSP+ francophones. Marque unique, deux modules : **Le Levier** (offensif) + **Le Bouclier** (défensif).

---

## 0. Verdict de compatibilité Bolt (lire en premier)

**Bolt convient — à condition de bien répartir les rôles.** Bolt est un *constructeur* ; l'application qui tourne vit sur **Netlify + Supabase** (les deux intégrations natives de Bolt).

| Brique | Compatible Bolt ? | Où ça tourne |
|---|---|---|
| Front client (landing, rapport d'écart, tunnel, espace abonné) | ✅ Oui | Netlify (build Vite/React) |
| Back-office admin | ✅ Oui | Netlify (même app, routes protégées) |
| Auth / Base de données / Storage | ✅ Oui | Supabase |
| Paiement (Stripe Checkout hébergé) | ✅ Oui | Stripe + Supabase Edge Function (webhook) |
| **Agents autonomes 24/7** | ⚠️ **Pas dans Bolt directement** | **Supabase Edge Functions + Supabase Cron** |

**Le point dur :** le WebContainer de Bolt **ne peut pas faire tourner de processus persistant** (daemon 24/7). Les 6 agents doivent donc être conçus comme des **jobs courts, événementiels et idempotents**, déclenchés par **Supabase Cron** ou par webhook — pas comme des workers qui tournent en boucle.

**Contraintes techniques à respecter (sinon ça casse en prod) :**
- **Vite/React obligatoire** — l'intégration Bolt↔Supabase **ne supporte pas Next.js**.
- Edge Function : CPU ≤ 2 s, timeout d'inactivité 150 s → découper le travail lourd.
- Cron : un job ≤ 10 min, ≤ 8 jobs concurrents → traiter par lots (batch), pas tout d'un coup.
- Tâches longues (ex. génération de 50 posts) → **file d'attente** (table `agent_jobs`) consommée par lots à chaque tick de cron.

> Sources : [Bolt + Supabase](https://support.bolt.new/integrations/supabase) · [Supabase Cron](https://supabase.com/docs/guides/cron) · [Limites Edge Functions](https://supabase.com/docs/guides/functions/limits) · [Limites WebContainer](https://www.sidetool.co/post/bolt-ai-troubleshooting-guide-solve-common-issues-quickly/)

---

## 1. Décisions actées

| Décision | Choix |
|---|---|
| Périmètre | **Plateforme complète à 6 agents** (construite par phases, voir §7) |
| Moteur de données salaires | **Jeu de données de référence** (table Supabase, chiffres sourçables) |
| Stack | **Vite + React + Supabase + Stripe + Netlify** |
| Fournisseur IA | **OpenRouter** (passerelle multi-modèles, API compatible OpenAI) |

---

## 2. Stack technique

- **Front** : Vite + React + TypeScript + Tailwind + React Router. UI : shadcn/ui ou Radix.
- **State / data** : TanStack Query + client Supabase JS.
- **Backend léger** : Supabase (Postgres + Auth + Storage + Edge Functions Deno + Cron `pg_cron`).
- **IA** : OpenRouter via `fetch` (compatible OpenAI) depuis les Edge Functions. **Jamais d'appel IA depuis le navigateur** (clé secrète).
- **Paiement** : Stripe Checkout (hébergé) + webhook Stripe → Edge Function.
- **Email** : Resend ou Brevo (Brevo = serveurs UE, cohérent RGPD) via Edge Function.
- **Déploiement** : Netlify (one-click depuis Bolt).

**Couche d'abstraction LLM** (`supabase/functions/_shared/llm.ts`) : une seule fonction `callLLM({ agent, messages, schema })` qui route vers OpenRouter et choisit le modèle selon l'agent. Permet de changer de modèle/fournisseur sans toucher aux agents.

Choix de modèles par agent (à régler dans une table `agent_config`, modifiable sans redéploiement) :
- Volume / rédaction (Agent 1 contenu, Agent 4 emails) → modèle économique.
- Raisonnement / chiffrage (Agent 2 rapport d'écart, Agent 5 objections) → modèle plus fort.

---

## 3. Modèle de données (Supabase)

Tables principales (avec **Row Level Security activée partout**) :

- `profiles` — utilisateur (lié à `auth.users`), rôle (`user` / `admin`), consentements RGPD horodatés.
- `leads` — poste, secteur, séniorité, localisation, rému actuelle, **segment** (sous-payé fort/léger/aligné/risque), source, statut.
- `gap_reports` — un rapport d'écart : entrées + estimation marché + écart chiffré + données sourcées utilisées.
- `salary_benchmarks` — **le jeu de données de référence** : (secteur, intitulé, séniorité, localisation) → fourchette basse/médiane/haute + **source** + année. *C'est l'actif produit le plus important.*
- `subscriptions` — Bouclier : statut Stripe, plan, période, churn.
- `orders` — Pack Négociation (one-shot) + premium.
- `deliverables` — livrables générés (argumentaire négo, scripts, dossier de positionnement).
- `email_sequences` / `email_events` — séquences A→E, état d'envoi, ouvertures/clics.
- `content_pieces` — posts/carrousels LinkedIn (Agent 1), statut (brouillon/validé/publié), résultats A/B.
- `ad_campaigns` — campagnes (Agent 3), budget, perf. **Plafonds en base, modifiables seulement par admin.**
- `alerts` — veille Bouclier (Agent 6) : signaux secteur/employeur, alertes envoyées.
- `agent_jobs` — **file d'attente** : type d'agent, payload, statut (`pending`/`running`/`done`/`failed`), tentatives. Cœur de l'orchestration.
- `agent_runs` — journal d'exécution (audit, coût tokens, durée) pour chaque tick.
- `agent_config` — modèle LLM, prompts système, plafonds, interrupteurs on/off par agent.

---

## 4. Les 6 agents → Edge Functions + Cron

Chaque agent = une (ou plusieurs) Edge Function, déclenchée par **Cron** (tick régulier) ou **webhook** (événement). Toutes lisent/écrivent via `agent_jobs` pour rester courtes et reprenables.

| # | Agent | Déclencheur | Fonction | Garde-fou 🔒 |
|---|---|---|---|---|
| 1 | **Contenu (inbound)** | Cron quotidien | Génère posts/carrousels LinkedIn → `content_pieces` (statut *brouillon*) | **Publication validée par un humain** (pas d'auto-post au départ) |
| 2 | **Rapport d'écart** | Webhook (soumission formulaire) | Interroge `salary_benchmarks`, calcule l'écart, segmente le lead, déclenche la séquence | Mention « estimation indicative », jamais « garanti » |
| 3 | **Acquisition payante** | Cron horaire | Surveille `ad_campaigns`, propose pause/réinvestissement | **Plafond budgétaire + création de comptes = humain.** L'agent *propose*, n'engage pas la dépense au-delà du plafond |
| 4 | **CRM / Email / Nurturing** | Cron (toutes les X min) | Exécute séquences A→E, score, relance | **Cold uniquement sur bases conformes** (opt-in) |
| 5 | **Conversion / Vente** | Webhook (chat / page de vente) | Réponses aux objections, devis premium, prise de RDV | **Aucun encaissement** : redirige vers Stripe hébergé |
| 6 | **Fulfillment & Rétention** | Cron quotidien + événement achat | Génère livrables, maintient la veille, envoie alertes Bouclier, gère churn/parrainage | Données sensibles minimisées, jamais dans une URL |

**Orchestrateur** = une Edge Function `orchestrator` appelée par Cron toutes les N minutes : elle lit `agent_jobs` (statut `pending`), traite un **lot** (≤ taille sûre pour rester < 10 min), met à jour les statuts, et journalise dans `agent_runs`. Idempotence obligatoire (un job traité deux fois ne double pas l'effet).

---

## 5. Tunnel (front)

1. **Page Rapport d'écart** — hook → champ simple (poste/secteur/séniorité/localisation) → chiffre révélé → CTA Pack ou capture email.
2. **Page de vente Pack** — douleur chiffrée → mécanisme → preuve → offre → **garantie 10×** → FAQ/objections → paiement.
3. **Checkout** — Stripe Checkout hébergé (🔒 aucune saisie bancaire gérée par l'app).
4. **Onboarding** — livraison rapide du livrable + ascension vers le Bouclier.
5. **Espace abonné** — tableau de bord de l'écart, alertes, dossier de positionnement.

Ancrage prix partout : « moins de 2,5 % de ce que vous récupérerez », jamais « 39 €/mois » sec.

---

## 6. Back-office admin

App même codebase, routes `/admin/*` protégées par rôle `admin` (RLS + garde côté UI). Écrans :
- **Console d'orchestration** : état des agents (on/off), `agent_jobs` en attente/échec, `agent_runs` (coût, durée), bouton relancer.
- **Validation humaine 🔒** : file de contenus à approuver, remboursements à valider, cas limites/réclamations, plafonds ads.
- **Leads & segments**, **commandes & abonnements**, **séquences email** (perf), **benchmarks salaires** (édition du jeu de données), **config agents** (modèle LLM, prompts, plafonds).

---

## 7. Roadmap par phases (construction dans Bolt)

> On bâtit la plateforme complète, mais en tranches livrables. Chaque phase est un état déployable.

- **Phase 0 — Fondations** : projet Vite/React dans Bolt, connexion Supabase, schéma DB + RLS, auth, layout front + `/admin` protégé, déploiement Netlify.
- **Phase 1 — Aimant** : page Rapport d'écart + **Agent 2** (edge function) + table `salary_benchmarks` (import du jeu de données) + capture lead + segmentation.
- **Phase 2 — Nurturing** : **Agent 4** + séquences A/B + intégration email (Brevo/Resend) + scoring. Admin : écran leads/séquences.
- **Phase 3 — Vente** : page de vente Pack + Stripe Checkout + webhook + `orders` + **Agent 5** (objections) + garantie. Admin : commandes + validation remboursement 🔒.
- **Phase 4 — Fulfillment & Bouclier** : **Agent 6** (livrables + veille + alertes) + abonnement Bouclier (Stripe récurrent) + espace abonné + séquences C/D/E.
- **Phase 5 — Acquisition** : **Agent 1** (contenu, file de validation) + **Agent 3** (ads, plafonds 🔒) + métriques (CAC, LTV, churn).
- **Phase 6 — Orchestration & durcissement** : orchestrateur cron + `agent_jobs`/`agent_runs` complets, journalisation, tableau de bord d'orchestration, revue hebdo humaine.

---

## 8. Conformité — intégrée dès le départ 🔒

- **RGPD/CNIL** : opt-in explicite + consentements horodatés dans `profiles`/`leads` ; inbound prioritaire ; **pas d'achat de bases B2C** ; mentions légales, politique de confidentialité, droit à l'effacement (procédure + bouton admin).
- **Pas de conseil réglementé** : coaching de carrière, pas d'avis juridique/financier. Renvoi vers avocat/expert à la limite.
- **Honnêteté publicitaire** : chiffres du rapport = **sourcés** depuis `salary_benchmarks` (d'où le choix « jeu de référence ») ; aucun gain « garanti » hors garantie commerciale encadrée.
- **Paiements** : Stripe hébergé uniquement ; l'IA n'encaisse rien ; **remboursements validés par un humain** (workflow admin).
- **Données sensibles** : collecte minimale, jamais de données perso en clair dans une URL ou vers un tiers non choisi par le client ; secrets (OpenRouter, Stripe, email) **uniquement** côté Edge Functions.

---

## 9. Par où démarrer concrètement dans Bolt

1. Ouvrir Bolt, créer un projet **Vite + React + TypeScript + Tailwind**.
2. Connecter **Supabase** (intégration native Bolt) puis **Netlify**.
3. Demander à Bolt de générer le **schéma DB §3 avec RLS** (migration Supabase).
4. Construire **Phase 0 → Phase 1** (l'aimant : c'est ce qui crée de la valeur en premier).
5. Ajouter les secrets dans Supabase (Edge Functions) : `OPENROUTER_API_KEY`, `STRIPE_SECRET_KEY`, clé email.
6. Itérer phase par phase.

**Prompt d'amorçage suggéré pour Bolt :**
> « Crée une app Vite + React + TypeScript + Tailwind avec Supabase (auth + Postgres + RLS) et un routing avec un espace public et un espace `/admin` protégé par rôle. Première fonctionnalité : une page “Rapport d'écart” avec un formulaire (poste, secteur, séniorité, localisation, rémunération actuelle) qui appelle une Edge Function Supabase ; cette fonction interroge une table `salary_benchmarks`, calcule l'écart, segmente le lead et l'enregistre dans `leads`. Les appels LLM passent par OpenRouter depuis l'Edge Function uniquement. »

---

## 10. Limites à garder en tête

- **« Tout sur Bolt » = construit dans Bolt, exécuté sur Netlify + Supabase.** Les agents vivent dans Supabase, pas dans Bolt.
- Les agents sont **événementiels/par lots**, pas des daemons : penser file d'attente + idempotence.
- La qualité du **jeu de données `salary_benchmarks`** détermine la crédibilité (et la conformité) de tout le produit — c'est le chantier à ne pas négliger.
- Coût IA : router les tâches volumineuses vers un modèle économique via OpenRouter ; journaliser les tokens dans `agent_runs`.
