/*
  # Sync Stripe Price IDs in products table

  Updates the stripe_price_id on the three active products to match the live
  Stripe price IDs provided. Also ensures product names are consistent.

  1. Changes
    - `argumentaire-eclair`: set stripe_price_id = price_1ToC3oHHlKshr0AB0yp5yVcJ
    - `simulateur` (Agent Recruteur IA): set stripe_price_id = price_1TmKVmHHlKshr0ABiaZrLdgv
    - `kit`: set stripe_price_id = price_1TmKTqHHlKshr0ABHpYlQC0n
*/

update public.products
set
  stripe_price_id = 'price_1ToC3oHHlKshr0AB0yp5yVcJ',
  updated_at = now()
where slug = 'argumentaire-eclair';

update public.products
set
  stripe_price_id = 'price_1TmKVmHHlKshr0ABiaZrLdgv',
  name = 'Entrainement à la Négociation IA',
  updated_at = now()
where slug = 'simulateur';

update public.products
set
  stripe_price_id = 'price_1TmKTqHHlKshr0ABHpYlQC0n',
  updated_at = now()
where slug = 'kit';
