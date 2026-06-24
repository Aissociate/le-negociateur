# Conformité — RGPD / CNIL / honnêteté commerciale

Notes de conformité intégrées à la conception. **À faire valider par un juriste avant mise en production.**

## Données personnelles (B2C — leads du tunnel)

- **Consentement explicite horodaté** à la capture (`leads.consent_at`, case à cocher non pré-cochée).
- **Désinscription** : statut `desinscrit` ; la séquence email s'arrête à l'achat ou à l'opt-out.
- **Minimisation** : on ne collecte que le nécessaire au diagnostic. Aucune donnée sensible.
- **Pas de donnée perso en clair dans une URL** ; les accès aux livrables passent par un **token aléatoire**.
- Droits d'accès / effacement : à exposer (procédure + contact DPO sur `/confidentialite`, à compléter).

## Prospection sortante (B2B — agent Apollo via Apify)

- **B2B uniquement**, base légale **intérêt légitime** documentée (`prospects.consent_basis`).
- **Pas d'achat de bases B2C**, pas de données sensibles, données professionnelles strictement.
- Tout message d'outreach doit proposer une **désinscription** ; un prospect `unsubscribed` n'est
  **jamais** recontacté.
- Les fonctions de prospection sont **réservées à l'admin** (garde JWT `_shared/auth.ts`).

## Honnêteté commerciale

- Les chiffres sont présentés comme **estimations indicatives, sourcées** (`salary_benchmarks.source`),
  **jamais** comme un gain garanti.
- Le référentiel s'appuie sur des **sources publiques** (INSEE / DARES / APEC) + curation **validée
  par un humain** (`/admin/benchmarks`) — rien n'est appliqué automatiquement.
- Garantie commerciale encadrée (satisfait ou remboursé 30 j) ; remboursements à valider par un humain.
- Pas de conseil juridique ou financier réglementé ; renvoi vers un avocat pour les cas limites.

## Sécurité

- **RLS activée sur toutes les tables** ; le public ne passe que par les Edge Functions.
- **Secrets** (OpenRouter, Stripe, Resend, Apify, service role) **uniquement côté serveur** (Edge Functions).
- Paiement **exclusivement** via Stripe Checkout hébergé ; aucune donnée bancaire dans l'app.
- Appels IA journalisés (`agent_runs`) ; actions admin protégées par rôle + RLS.
