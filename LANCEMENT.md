# 🚀 Checklist de lancement — Le Négociateur

Tout le code est sur `main`. Ce qui reste avant de vendre = **config + déploiement**.
Coche dans l'ordre. (`[x]` = vérifié, `[ ]` = à faire.)

> Projet Supabase : `ohryhorrwzszuomedkqz` · URL fonctions : `https://ohryhorrwzszuomedkqz.supabase.co/functions/v1`

---

## 0. Secrets Edge *(rien ne marche sans ça)*
*Supabase → Edge Functions → Secrets*

- [ ] `OPENROUTER_API_KEY` (`sk-or-…`) **avec crédit + accès `perplexity/sonar`** — sinon rapport IA, Kit, recherche prospect, relances sur-mesure ne se génèrent pas. ⚠️ c'était le blocage de l'audit.
- [ ] `BREVO_API_KEY` (`xkeysib-…`, **clé API v3** — pas la clé SMTP `xsmtpsib-`) + `EMAIL_FROM` avec **expéditeur/domaine vérifié dans Brevo (SPF/DKIM)** — sinon aucun email. *(Option : `BREVO_WEBHOOK_SECRET` pour le suivi ouvertures/clics.)*
- [ ] `SITE_URL = https://ton-domaine` — sinon liens emails + redirections Stripe cassés.
- [ ] `STRIPE_SECRET_KEY = sk_live_…` *(posé par Bolt)* + `STRIPE_WEBHOOK_SECRET = whsec_…` **live** (cf. §4).
- [ ] *(option)* `LAUNCH_DAILY_QUOTA` = quota quotidien Kits au tarif de lancement (défaut 20).

## 1. Base de données

- [ ] **Prix du Kit → 99 €** : `update products set price_cents = 9900, updated_at = now() where slug = 'kit';`
      *(option prix barré : ajouter `compare_at_cents = 19900`)*
- [ ] Migration `supabase/migrations/20260701000001_email_relance.sql` (agent de relance sur-mesure)
- [ ] Migration `supabase/migrations/20260701000002_lead_unsubscribe.sql` (désinscription leads)
- [x] Migrations `20260626000002/003` + `20260630000001` (outreach, offres_salaires, recherche_contact) — appliquées
- [x] `enrichissement_prospect` repassé sur Haiku
- [x] pg_cron + pg_net + 4 jobs cron actifs

## 2. (Re)déploiement des fonctions
`supabase functions deploy <nom>` (ou via la synchro Bolt). Toutes ont été modifiées cette session :

- [ ] `stripe-webhook` — **livraison post-paiement + email du Kit** (critique)
- [ ] `create-checkout` — success_url `/formation` + codes promo
- [ ] `send-emails` — relances sur-mesure + pied désinscription
- [ ] `prospect-outreach` — CTA `/analyse` + recherche dans l'email
- [ ] `prospect-enrich` + `orchestrator` — recherche web Perplexity
- [ ] `prospect-unsubscribe` — désinscription prospects **et** leads
- [ ] `public-data` — quota de lancement
- [ ] `agent-test` — bouton « Tester » par agent (nouvelle fonction)

## 3. Stripe (LIVE)

- [ ] **Endpoint webhook live** : *Stripe (Live) → Developers → Webhooks → Add endpoint*
      → URL `…/functions/v1/stripe-webhook`, event **`checkout.session.completed`**
      → copier son `whsec_` dans les secrets (§0).
- [ ] **Code cadeau −98 %** : *Coupons → créer (98 %, une fois)* → code `CADEAU98`
      *(rappel : montant final ≥ 0,50 € ; −98 % de 99 € = 0,98 € ✅)*
- [ ] **Roller la clé live** si elle a pu être exposée (note mémoire projet).

## 4. Validation en mode TEST *(avant tout vrai client)*

- [ ] Basculer les secrets en `sk_test_` / `whsec_` test.
- [ ] Parcours complet : questionnaire → rapport (IA) → Kit `4242 4242 4242 4242` → OTO → Formation → Merci → personnalisation.
- [ ] Vérifier en base : `orders.status = paid`, `deliverables` créé, email reçu, `agent_runs` en `ok`, `email_events` en `sent`.
- [ ] Tester un agent depuis *Admin → IA & Prompts → Tester* (diagnostic clé OpenRouter).
- [ ] Remettre les clés `sk_live_` / `whsec_` live.

## 5. Honnêteté / conformité *(avant volume)*

- [ ] **Témoignages** illustratifs → remplacer par de **vrais** avis (cf. `CONFORMITE.md`).
- [ ] **Toaster preuve sociale** → refléter une activité réelle, ou le retirer.
- [ ] **Quota de lancement** → l'assumer réellement (capacité limitée), sinon ne pas l'afficher.
- [ ] **Branding** : corriger les mentions « LEMARCHÉPUBLIC.FR ».
- [x] Désinscription leads B2C (jeton + pied de page + opt-out) — en place
- [ ] Mentions Qualiopi / CPF de la page Formation : vérifier qu'elles correspondent à une formation réellement certifiée.

## 6. GO 🚀

- [ ] 1 achat réel à −98 % (0,98 €) pour valider la chaîne live de bout en bout, puis remboursement.
- [ ] Brancher le trafic (CTA cold email → `/analyse`).
- [ ] Suivre les chiffres dans **/admin/funnel**.

---

### Les 3 vrais bloqueurs (si tu ne fais que ça)
1. **Secrets** §0 — surtout `OPENROUTER_API_KEY` (Perplexity + crédit) et `BREVO_API_KEY`.
2. **Déploiement** §2 — surtout `stripe-webhook` (sinon client qui paie ≠ reçoit son Kit).
3. **Webhook live** §3.
