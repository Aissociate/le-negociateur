import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { BenchmarkUpdate, SalaryBenchmark } from '../../types';

const eur = (n: number) => n.toLocaleString('fr-FR');

/**
 * Base de salaires : consultation/edition du referentiel + validation des
 * mises a jour hebdomadaires proposees par l'agent IA.
 */
export default function Benchmarks() {
  const [rows, setRows] = useState<SalaryBenchmark[]>([]);
  const [pending, setPending] = useState<BenchmarkUpdate[]>([]);
  const [filter, setFilter] = useState('');

  const load = useCallback(async () => {
    const [bm, up] = await Promise.all([
      supabase.from('salary_benchmarks').select('*').order('intitule').limit(500),
      supabase
        .from('benchmark_updates')
        .select('*, salary_benchmarks(*)')
        .eq('status', 'pending')
        .order('created_at'),
    ]);
    setRows((bm.data as SalaryBenchmark[]) ?? []);
    setPending((up.data as BenchmarkUpdate[]) ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function review(update: BenchmarkUpdate, approve: boolean) {
    if (approve) {
      await supabase
        .from('salary_benchmarks')
        .update({
          salaire_bas: update.proposed.salaire_bas,
          salaire_median: update.proposed.salaire_median,
          salaire_haut: update.proposed.salaire_haut,
          updated_at: new Date().toISOString(),
        })
        .eq('id', update.benchmark_id);
    }
    await supabase
      .from('benchmark_updates')
      .update({ status: approve ? 'approved' : 'rejected', reviewed_at: new Date().toISOString() })
      .eq('id', update.id);
    load();
  }

  async function saveRow(row: SalaryBenchmark) {
    await supabase
      .from('salary_benchmarks')
      .update({
        salaire_bas: row.salaire_bas,
        salaire_median: row.salaire_median,
        salaire_haut: row.salaire_haut,
        updated_at: new Date().toISOString(),
      })
      .eq('id', row.id);
    load();
  }

  const filtered = rows.filter((r) =>
    `${r.intitule} ${r.secteur} ${r.seniorite} ${r.localisation}`
      .toLowerCase()
      .includes(filter.toLowerCase())
  );

  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-2">Base salaires</h1>
      <p className="text-paper/60 text-sm mb-8">
        Référentiel utilisé pour toutes les analyses. L'agent de mise à jour tourne chaque semaine
        et dépose ses propositions ci-dessous — rien n'est appliqué sans validation humaine.
      </p>

      {pending.length > 0 && (
        <div className="mb-10 bg-ember/10 border border-ember rounded-xl p-6">
          <h2 className="font-display text-xl font-bold mb-4">
            Mises à jour proposées par l'IA ({pending.length})
          </h2>
          <div className="space-y-3">
            {pending.map((u) => (
              <div key={u.id} className="bg-ink/40 rounded-lg p-4 text-sm">
                <p className="font-bold">
                  {u.salary_benchmarks?.intitule} · {u.salary_benchmarks?.secteur} ·{' '}
                  {u.salary_benchmarks?.seniorite} · {u.salary_benchmarks?.localisation}
                </p>
                <p className="text-paper/70 mt-1">
                  Actuel : {eur(u.salary_benchmarks?.salaire_bas ?? 0)} /{' '}
                  {eur(u.salary_benchmarks?.salaire_median ?? 0)} /{' '}
                  {eur(u.salary_benchmarks?.salaire_haut ?? 0)} € → Proposé :{' '}
                  <strong className="text-gold">
                    {eur(u.proposed.salaire_bas)} / {eur(u.proposed.salaire_median)} /{' '}
                    {eur(u.proposed.salaire_haut)} €
                  </strong>
                </p>
                {u.proposed.justification && (
                  <p className="text-paper/50 mt-1 italic">{u.proposed.justification}</p>
                )}
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => review(u, true)}
                    className="bg-gold text-ink font-bold px-4 py-1.5 rounded-lg"
                  >
                    Approuver
                  </button>
                  <button
                    onClick={() => review(u, false)}
                    className="bg-paper/10 px-4 py-1.5 rounded-lg"
                  >
                    Rejeter
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filtrer (poste, secteur, séniorité, région)…"
        className="w-full max-w-md rounded-lg bg-ink border border-paper/20 px-4 py-2 mb-4 text-sm"
      />

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-paper/50 border-b border-paper/10">
            <th className="py-2 pr-3">Intitulé</th>
            <th className="py-2 pr-3">Secteur</th>
            <th className="py-2 pr-3">Séniorité</th>
            <th className="py-2 pr-3">Région</th>
            <th className="py-2 pr-3">Bas</th>
            <th className="py-2 pr-3">Médian</th>
            <th className="py-2 pr-3">Haut</th>
            <th className="py-2 pr-3">MAJ</th>
            <th className="py-2"></th>
          </tr>
        </thead>
        <tbody>
          {filtered.slice(0, 100).map((r) => (
            <tr key={r.id} className="border-b border-paper/5">
              <td className="py-1.5 pr-3">{r.intitule}</td>
              <td className="py-1.5 pr-3 text-paper/70">{r.secteur}</td>
              <td className="py-1.5 pr-3 text-paper/70">{r.seniorite}</td>
              <td className="py-1.5 pr-3 text-paper/70">{r.localisation}</td>
              {(['salaire_bas', 'salaire_median', 'salaire_haut'] as const).map((k) => (
                <td key={k} className="py-1.5 pr-3">
                  <input
                    type="number"
                    value={r[k]}
                    onChange={(e) =>
                      setRows((rs) =>
                        rs.map((x) => (x.id === r.id ? { ...x, [k]: Number(e.target.value) } : x))
                      )
                    }
                    className="w-20 bg-ink border border-paper/10 rounded px-1.5 py-0.5"
                  />
                </td>
              ))}
              <td className="py-1.5 pr-3 text-paper/40 whitespace-nowrap">
                {new Date(r.updated_at).toLocaleDateString('fr-FR')}
              </td>
              <td className="py-1.5">
                <button onClick={() => saveRow(r)} className="text-gold text-xs font-bold">
                  Sauver
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-paper/40 text-xs mt-3">
        {filtered.length} lignes ({Math.min(filtered.length, 100)} affichées).
      </p>
    </div>
  );
}
