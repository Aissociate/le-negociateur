-- =====================================================================
-- Échelle de valeur : downsell, cœur, order bump, abonnement, bundle.
-- =====================================================================

-- 1. Étendre les types de produits
alter table public.products drop constraint products_kind_check;
alter table public.products
  add constraint products_kind_check check (kind in ('kit', 'upsell', 'subscription', 'downsell', 'bundle'));

-- 2. Catalogue (idempotent)
insert into public.products (slug, name, kind, price_cents, compare_at_cents, description_md, active, position) values
(
  'argumentaire-eclair', 'L''Argumentaire Éclair', 'downsell', 1900, 4900,
  'La version essentielle : votre positionnement chiffré, vos 3 scripts clés, le top 5 des objections et votre phrase d''ancrage.',
  true, 0
),
(
  'kit', 'Le Kit de Négociation', 'kit', 4900, 9900,
  'Le dossier complet généré sur-mesure : argumentaire chiffré, scripts mot à mot, réponses aux 12 objections, stratégie, plan B et email de verrouillage.',
  true, 1
),
(
  'simulateur', 'Le Simulateur d''Entretien', 'upsell', 2400, null,
  'Entraînez-vous en illimité face à un « manager » IA qui objecte et négocie. Scoring et feedback pour arriver le jour J avec une confiance totale.',
  true, 2
),
(
  'bouclier', 'Le Bouclier (abonnement)', 'subscription', 1200, null,
  'Votre co-pilote rémunération en continu : veille mensuelle de votre positionnement, alertes quand l''écart se recreuse, régénération illimitée du Kit, simulateur illimité.',
  true, 3
),
(
  'pack-carriere', 'Le Pack Carrière', 'bundle', 12900, 21700,
  'Tout, au meilleur prix : le Kit + le Simulateur d''Entretien + 12 mois de Bouclier. La préparation, l''entraînement et la veille réunis.',
  true, 4
)
on conflict (slug) do update set
  name = excluded.name,
  kind = excluded.kind,
  price_cents = excluded.price_cents,
  compare_at_cents = excluded.compare_at_cents,
  description_md = excluded.description_md,
  active = excluded.active,
  position = excluded.position,
  updated_at = now();

-- 3. Retirer l'ancien placeholder upsell
update public.products set active = false where slug = 'accompagnement';
