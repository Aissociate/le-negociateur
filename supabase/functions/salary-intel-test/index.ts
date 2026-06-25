// Test d'agrégation salariale (admin) : lance les 3 sources sur un profil et
// renvoie les réponses BRUTES + normalisées, SANS rien sauvegarder. Sert à
// valider France Travail et à caler le mapping des API publiques.

import { handleOptions, json } from '../_shared/cors.ts';
import { requireAdmin } from '../_shared/auth.ts';
import { aggregateSalaryIntel } from '../_shared/salary_sources.ts';

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;
  if (!(await requireAdmin(req))) return json({ error: 'Réservé à l’administration.' }, 403);

  try {
    // deno-lint-ignore no-explicit-any
    const input = (await req.json()) as any;
    const rem = Number(input.remuneration_actuelle) || 50000;
    const intel = await aggregateSalaryIntel({
      poste: input.poste ?? 'Cadre',
      secteur: input.secteur ?? 'Tous secteurs',
      seniorite: input.seniorite ?? 'Confirmé (3-8 ans)',
      localisation: input.localisation ?? 'Île-de-France',
      remuneration_actuelle: rem,
      code_rome: input.code_rome || null,
      market_median: Number(input.market_median) || Math.round(rem * 1.1),
    });
    return json(intel);
  } catch (err) {
    console.error(err);
    return json({ error: err instanceof Error ? err.message : 'Erreur' }, 500);
  }
});
