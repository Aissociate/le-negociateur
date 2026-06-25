-- =====================================================================
-- Essai 1er mois à 1€ sur le downsell d'abonnement (configurable par étape OTO).
-- =====================================================================

alter table public.oto_steps add column if not exists downsell_trial boolean not null default false;

-- Étape par défaut (downsell Bouclier) : essai 1€ activé.
update public.oto_steps set downsell_trial = true where downsell_slug = 'bouclier';
