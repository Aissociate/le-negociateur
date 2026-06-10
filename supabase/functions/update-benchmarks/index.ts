// Agent "Mise à jour benchmarks" : exécuté par cron chaque semaine.
// Sélectionne les lignes les plus anciennes du référentiel, demande au LLM des
// valeurs actualisées (JSON strict), et dépose les propositions dans
// `benchmark_updates` (statut pending). RIEN n'est appliqué sans validation
// humaine dans /admin/benchmarks — conformité « chiffres sourcés ».

import { serviceClient } from '../_shared/db.ts';
import { json } from '../_shared/cors.ts';
import { callLLM } from '../_shared/llm.ts';

const BATCH_SIZE = 25;

interface Proposal {
  id: string;
  salaire_bas: number;
  salaire_median: number;
  salaire_haut: number;
  justification: string;
}

Deno.serve(async (_req) => {
  const db = serviceClient();

  const { data: batch } = await db
    .from('salary_benchmarks')
    .select('*')
    .order('updated_at', { ascending: true })
    .limit(BATCH_SIZE);
  if (!batch?.length) return json({ proposed: 0 });

  const lines = batch
    .map(
      (b) =>
        `${b.id} | ${b.intitule} | ${b.seniorite} | ${b.localisation} | bas=${b.salaire_bas} median=${b.salaire_median} haut=${b.salaire_haut} (maj ${b.updated_at?.slice(0, 10)})`
    )
    .join('\n');

  let proposals: Proposal[] = [];
  try {
    const result = await callLLM(db, 'maj_benchmarks', { lignes: lines }, { jsonMode: true });
    const parsed = JSON.parse(result.text);
    proposals = Array.isArray(parsed) ? parsed : (parsed.propositions ?? []);
  } catch (err) {
    console.error('Agent maj_benchmarks en échec', err);
    return json({ proposed: 0, error: 'LLM indisponible' }, 500);
  }

  let proposed = 0;
  const validIds = new Set(batch.map((b) => b.id));
  for (const p of proposals) {
    if (!validIds.has(p.id)) continue;
    const current = batch.find((b) => b.id === p.id)!;
    // Garde-fou : on ignore les valeurs aberrantes (> ±20% de variation) ou incohérentes
    const sane =
      [p.salaire_bas, p.salaire_median, p.salaire_haut].every(
        (v) => Number.isFinite(v) && v > 15000 && v < 500000
      ) &&
      p.salaire_bas <= p.salaire_median &&
      p.salaire_median <= p.salaire_haut &&
      Math.abs(p.salaire_median - current.salaire_median) / current.salaire_median <= 0.2;
    if (!sane) continue;

    // Pas de variation -> pas de proposition (on rafraîchit juste la date)
    if (
      p.salaire_bas === current.salaire_bas &&
      p.salaire_median === current.salaire_median &&
      p.salaire_haut === current.salaire_haut
    ) {
      await db
        .from('salary_benchmarks')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', p.id);
      continue;
    }

    await db.from('benchmark_updates').insert({
      benchmark_id: p.id,
      proposed: {
        salaire_bas: Math.round(p.salaire_bas),
        salaire_median: Math.round(p.salaire_median),
        salaire_haut: Math.round(p.salaire_haut),
        justification: p.justification ?? '',
      },
      status: 'pending',
    });
    // La date de revue est rafraîchie pour faire tourner le batch hebdomadaire
    await db
      .from('salary_benchmarks')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', p.id);
    proposed++;
  }

  return json({ scanned: batch.length, proposed });
});
