-- Ancrage du Kit à 499 € (prix barré) — décision du 2 juillet 2026.
-- Aligne compare_at_cents sur la somme des valeurs unitaires du value stack (199+99+89+59+53 = 499 €).
-- Le prix réel reste price_cents = 9900 (99 €).
update public.products
set compare_at_cents = 49900,
    updated_at = now()
where slug = 'kit';
