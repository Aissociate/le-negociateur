-- Reset des stats A/B avant le vrai test (2 juillet 2026).
-- Les données antérieures étaient du bruit/bots (ex : variante 'marche' 1944 vues / 6 captures = 0,3 %)
-- et une distribution non représentative d'un tirage équipondéré.
-- On repart à zéro avec les nouvelles variantes direct-response.
truncate table public.ab_stats;
