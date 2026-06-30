-- =====================================================================
-- Désinscription des LEADS (B2C) — conformité CNIL/RGPD pour la séquence de
-- nurturing. Jeton par lead (backfill par ligne), réutilisé dans le pied de
-- page des emails. La fonction `prospect-unsubscribe` gère prospects ET leads.
-- =====================================================================

alter table public.leads
  add column if not exists unsubscribe_token text not null
    default (replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''));

create unique index if not exists idx_leads_unsub on public.leads (unsubscribe_token);
