// Import de barèmes salaires en masse. À partir d'une MÉDIANE DE BASE par métier
// (référence IDF / Confirmé), génère la matrice complète 4 séniorités × 3 zones
// avec les fourchettes bas/médian/haut — même modèle que le seed. Réimporter un
// intitulé écrase ses lignes (dédup). Admin uniquement.

import { serviceClient } from '../_shared/db.ts';
import { handleOptions, json } from '../_shared/cors.ts';
import { requireAdmin } from '../_shared/auth.ts';

interface Row {
  intitule?: string;
  base_median?: string | number;
  code_rome?: string;
  tension_score?: string | number;
  secteur?: string;
}

const SENIORITES: [string, number][] = [
  ['Junior (0-3 ans)', 0.72],
  ['Confirmé (3-8 ans)', 1.0],
  ['Senior (8-15 ans)', 1.25],
  ['Expert / Direction (15+ ans)', 1.55],
];
const ZONES: [string, number][] = [
  ['Île-de-France', 1.0],
  ['Grande métropole régionale', 0.92],
  ['Autre région', 0.85],
];
const r500 = (n: number) => Math.round(n / 500) * 500;

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;
  if (!(await requireAdmin(req))) return json({ error: 'Réservé à l’administration.' }, 403);

  try {
    const { rows } = (await req.json()) as { rows: Row[] };
    if (!Array.isArray(rows) || rows.length === 0) return json({ error: 'Aucune ligne.' }, 400);
    if (rows.length > 2000) return json({ error: 'Maximum 2000 métiers par import.' }, 400);

    const db = serviceClient();
    const annee = new Date().getFullYear();

    let jobs = 0;
    let skipped = 0;
    const all: Record<string, unknown>[] = [];
    const intitules: string[] = [];

    for (const row of rows) {
      const intitule = (row.intitule ?? '').toString().trim();
      const base = Math.round(Number(row.base_median));
      if (!intitule || !Number.isFinite(base) || base < 10000 || base > 1000000) {
        skipped++;
        continue;
      }
      const tension = Math.max(0, Math.min(100, Math.round(Number(row.tension_score) || 0)));
      const code_rome = (row.code_rome ?? '').toString().trim() || null;
      const secteur = (row.secteur ?? '').toString().trim() || 'Tous secteurs';
      intitules.push(intitule);
      jobs++;

      for (const [seniorite, sc] of SENIORITES) {
        for (const [localisation, zc] of ZONES) {
          all.push({
            secteur,
            intitule,
            code_rome,
            seniorite,
            localisation,
            salaire_bas: r500(base * sc * zc * 0.85),
            salaire_median: r500(base * sc * zc),
            salaire_haut: r500(base * sc * zc * 1.2),
            metier_en_tension: tension >= 60,
            tension_score: tension,
            source: 'Import barème (médiane de base)',
            annee,
          });
        }
      }
    }

    if (!all.length) return json({ jobs: 0, inserted: 0, skipped });

    // Réimport idempotent : on écrase les lignes existantes de ces intitulés.
    await db.from('salary_benchmarks').delete().in('intitule', intitules);

    let inserted = 0;
    for (let i = 0; i < all.length; i += 200) {
      const batch = all.slice(i, i + 200);
      const { error } = await db.from('salary_benchmarks').insert(batch);
      if (!error) inserted += batch.length;
    }

    return json({ jobs, inserted, skipped });
  } catch (err) {
    console.error(err);
    return json({ error: 'Import barèmes impossible.' }, 500);
  }
});
