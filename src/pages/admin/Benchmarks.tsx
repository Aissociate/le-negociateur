import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { BenchmarkUpdate, SalaryBenchmark } from '../../types';

const eur = (n: number) => n.toLocaleString('fr-FR');

/**
 * Base de salaires : consultation/édition du référentiel (+ tension) et validation
 * des mises à jour proposées par l'agent IA de curation (données publiques).
 */
export default function Benchmarks() {
  const [rows, setRows] = useState<SalaryBenchmark[]>([]);
  const [pending, setPending] = useState<BenchmarkUpdate[]>([]);
  const [filter, setFilter] = useState('');
  const [tensionOnly, setTensionOnly] = useState(false);

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
          ...(update.proposed.tension_score != null
            ? { tension_score: update.proposed.tension_score, metier_en_tension: update.proposed.tension_score >= 60 }
            : {}),
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
        tension_score: row.tension_score,
        metier_en_tension: row.metier_en_tension,
        updated_at: new Date().toISOString(),
      })
      .eq('id', row.id);
    load();
  }

  const filtered = rows.filter((r) => {
    if (tensionOnly && !r.metier_en_tension) return false;
    return `${r.intitule} ${r.secteur} ${r.seniorite} ${r.localisation} ${r.code_rome ?? ''}`
      .toLowerCase()
      .includes(filter.toLowerCase());
  });

  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-2">Base salaires</h1>
      <p className="text-paper/60 text-sm mb-8">
        Référentiel utilisé pour toutes les analyses (sources publiques INSEE / DARES / APEC). L'agent de curation
        dépose ses propositions ci-dessous — rien n'est appliqué sans validation humaine.
      </p>

      {pending.length > 0 && (
        <div className="mb-10 bg-ember/10 border border-ember rounded-xl p-6">
          <h2 className="font-display text-xl font-bold mb-4">Mises à jour proposées par l'IA ({pending.length})</h2>
          <div className="space-y-3">
            {pending.map((u) => (
              <div key={u.id} className="bg-ink/40 rounded-lg p-4 text-sm">
                <p className="font-bold">
                  {u.salary_benchmarks?.intitule} · {u.salary_benchmarks?.secteur} · {u.salary_benchmarks?.seniorite} ·{' '}
                  {u.salary_benchmarks?.localisation}
                </p>
                <p className="text-paper/70 mt-1">
                  Actuel : {eur(u.salary_benchmarks?.salaire_bas ?? 0)} / {eur(u.salary_benchmarks?.salaire_median ?? 0)} /{' '}
                  {eur(u.salary_benchmarks?.salaire_haut ?? 0)} € → Proposé :{' '}
                  <strong className="text-gold">
                    {eur(u.proposed.salaire_bas)} / {eur(u.proposed.salaire_median)} / {eur(u.proposed.salaire_haut)} €
                  </strong>
                  {u.proposed.tension_score != null && (
                    <span className="text-paper/60"> · tension → {u.proposed.tension_score}</span>
                  )}
                </p>
                {u.proposed.justification && <p className="text-paper/50 mt-1 italic">{u.proposed.justification}</p>}
                <div className="mt-2 flex gap-2">
                  <button onClick={() => review(u, true)} className="bg-gold text-ink font-bold px-4 py-1.5 rounded-lg">
                    Approuver
                  </button>
                  <button onClick={() => review(u, false)} className="bg-paper/10 px-4 py-1.5 rounded-lg">
                    Rejeter
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 mb-4">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filtrer (poste, secteur, séniorité, région, ROME)…"
          className="w-full max-w-md rounded-lg bg-ink border border-paper/20 px-4 py-2 text-sm"
        />
        <label className="flex items-center gap-2 text-sm text-paper/70 whitespace-nowrap">
          <input type="checkbox" checked={tensionOnly} onChange={(e) => setTensionOnly(e.target.checked)} />
          Métiers en tension
        </label>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-paper/50 border-b border-paper/10">
            <th className="py-2 pr-3">Intitulé</th>
            <th className="py-2 pr-3">ROME</th>
            <th className="py-2 pr-3">Séniorité</th>
            <th className="py-2 pr-3">Région</th>
            <th className="py-2 pr-3">Bas</th>
            <th className="py-2 pr-3">Médian</th>
            <th className="py-2 pr-3">Haut</th>
            <th className="py-2 pr-3">Tension</th>
            <th className="py-2"></th>
          </tr>
        </thead>
        <tbody>
          {filtered.slice(0, 100).map((r) => (
            <tr key={r.id} className="border-b border-paper/5">
              <td className="py-1.5 pr-3">{r.intitule}</td>
              <td className="py-1.5 pr-3 text-paper/50">{r.code_rome ?? '—'}</td>
              <td className="py-1.5 pr-3 text-paper/70">{r.seniorite}</td>
              <td className="py-1.5 pr-3 text-paper/70">{r.localisation}</td>
              {(['salaire_bas', 'salaire_median', 'salaire_haut'] as const).map((k) => (
                <td key={k} className="py-1.5 pr-3">
                  <input
                    type="number"
                    value={r[k]}
                    onChange={(e) =>
                      setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, [k]: Number(e.target.value) } : x)))
                    }
                    className="w-20 bg-ink border border-paper/10 rounded px-1.5 py-0.5"
                  />
                </td>
              ))}
              <td className="py-1.5 pr-3">
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={r.tension_score}
                    onChange={(e) =>
                      setRows((rs) =>
                        rs.map((x) => (x.id === r.id ? { ...x, tension_score: Number(e.target.value) } : x))
                      )
                    }
                    className="w-14 bg-ink border border-paper/10 rounded px-1.5 py-0.5"
                  />
                  <input
                    type="checkbox"
                    checked={r.metier_en_tension}
                    onChange={(e) =>
                      setRows((rs) =>
                        rs.map((x) => (x.id === r.id ? { ...x, metier_en_tension: e.target.checked } : x))
                      )
                    }
                    title="Métier en tension"
                  />
                </div>
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
