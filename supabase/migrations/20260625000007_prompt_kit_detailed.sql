-- =====================================================================
-- Le Kit exploite le profil détaillé post-achat + les réalisations.
-- Append (DRY) sur le prompt kit_offensif déjà refondu (migration 0005).
-- =====================================================================

update public.agent_config
set
  updated_at = now(),
  system_prompt = system_prompt || $p$

Si un « profil détaillé » et des « réalisations » sont fournis (valeurs autres que « n/c »), exploite-les pleinement : tiens compte du package de rémunération COMPLET (base × nb de mois, primes, variable, épargne salariale, avantages en nature) pour cadrer la demande et l'ancrage ; transforme les réussites et réalisations en ARGUMENTS concrets et chiffrés dans les scripts (section 5) et dans les réponses aux objections (section 6) ; ouvre la section 1 par une sous-section « ### Vos arguments personnels » qui liste vos réalisations comme preuves de valeur.$p$,
  user_prompt_template = user_prompt_template || $p$

Profil détaillé (post-achat) — exploite chaque élément, ignore les « n/c » :
{{profil_detaille}}

Réalisations / réussites à valoriser comme arguments de négociation : {{realisations}}$p$
where agent = 'kit_offensif';
