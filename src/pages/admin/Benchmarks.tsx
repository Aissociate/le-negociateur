import { useCallback, useEffect, useState } from 'react';
import { Upload } from 'lucide-react';
import { supabase, callAdminFunction } from '../../lib/supabase';
import { parseCSV, guessMapping } from '../../lib/csv';
import type { BenchmarkUpdate, SalaryBenchmark } from '../../types';

const eur = (n: number) => n.toLocaleString('fr-FR');

// Import de barèmes : 1 ligne = 1 métier + sa médiane de base (IDF/Confirmé).
const BFIELDS: { key: string; label: string }[] = [
  { key: 'intitule', label: 'Intitulé du métier' },
  { key: 'base_median', label: 'Médiane de base €/an (IDF, Confirmé)' },
  { key: 'code_rome', label: 'Code ROME' },
  { key: 'tension_score', label: 'Tension (0-100)' },
  { key: 'secteur', label: 'Secteur' },
];
const BSYN: Record<string, string[]> = {
  intitule: ['intitulé', 'intitule', 'métier', 'metier', 'poste', 'fonction', 'job', 'title'],
  base_median: ['médiane', 'mediane', 'median', 'salaire', 'salaire médian', 'base', 'médiane de base', 'salary'],
  code_rome: ['rome', 'code rome', 'code_rome'],
  tension_score: ['tension', 'tension_score', 'score tension'],
  secteur: ['secteur', 'sector', 'branche'],
};

/**
 * Base de salaires : consultation/édition du référentiel (+ tension) et validation
 * des mises à jour proposées par l'agent IA de curation (données publiques).
 */
export default function Benchmarks() {
  const [rows, setRows] = useState<SalaryBenchmark[]>([]);
  const [pending, setPending] = useState<BenchmarkUpdate[]>([]);
  const [filter, setFilter] = useState('');
  const [tensionOnly, setTensionOnly] = useState(false);

  // Import CSV de barèmes
  const [msg, setMsg] = useState('');
  const [csvName, setCsvName] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [dataRows, setDataRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, number>>({});
  const [importing, setImporting] = useState(false);

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

  function onBenchFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const all = parseCSV(String(reader.result ?? ''));
      if (all.length < 2) {
        setMsg('CSV vide ou sans données.');
        return;
      }
      setHeaders(all[0]);
      setDataRows(all.slice(1));
      setMapping(guessMapping(all[0], BSYN));
    };
    reader.readAsText(file);
  }

  async function importBenchmarks() {
    if (!dataRows.length) return;
    setImporting(true);
    try {
      const payload = dataRows.map((r) => {
        const o: Record<string, string> = {};
        BFIELDS.forEach((f) => {
          const idx = mapping[f.key];
          if (idx != null && idx >= 0 && r[idx]?.trim()) o[f.key] = r[idx].trim();
        });
        return o;
      });
      const res = await callAdminFunction<{ jobs: number; inserted: number; skipped: number }>(
        'benchmark-import-csv',
        { rows: payload }
      );
      setMsg(
        `${res.jobs} métier(s) importés → ${res.inserted} lignes générées (4 séniorités × 3 régions)` +
          (res.skipped ? `, ${res.skipped} ligne(s) ignorée(s).` : '.')
      );
      setHeaders([]);
      setDataRows([]);
      setCsvName('');
      setMapping({});
      load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Erreur import barèmes.');
    }
    setImporting(false);
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

      {msg && <p className="mb-4 text-gold font-semibold text-sm">{msg}</p>}

      {/* Import de barèmes en masse (CSV) */}
      <div className="bg-paper/5 rounded-xl p-6 mb-10 max-w-3xl">
        <h2 className="font-display text-xl font-bold mb-1">Étoffer le référentiel (import CSV)</h2>
        <p className="text-xs text-paper/50 mb-4">
          1 ligne = 1 métier + sa <strong>médiane de base</strong> (€/an, référence Île-de-France / Confirmé, ex.
          barème APEC). Le système génère automatiquement les <strong>12 combos</strong> (4 séniorités × 3 régions) avec
          les fourchettes. Réimporter un même intitulé écrase ses lignes.
        </p>
        <input type="file" accept=".csv,text/csv" onChange={onBenchFile} className="text-sm text-paper/70" />

        {headers.length > 0 && (
          <div className="mt-5">
            <p className="text-xs text-paper/50 mb-2 uppercase tracking-wide">Associe tes colonnes</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {BFIELDS.map((f) => (
                <div key={f.key}>
                  <label className="block text-xs text-paper/50 mb-1">
                    {f.label}
                    {(f.key === 'intitule' || f.key === 'base_median') && <span className="text-gold"> *</span>}
                  </label>
                  <select
                    value={mapping[f.key] ?? -1}
                    onChange={(e) => setMapping((m) => ({ ...m, [f.key]: Number(e.target.value) }))}
                    className="w-full rounded-lg bg-ink border border-paper/20 px-3 py-2 text-sm"
                  >
                    <option value={-1}>— ignorer —</option>
                    {headers.map((h, i) => (
                      <option key={i} value={i}>
                        {h || `Colonne ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <p className="text-xs text-paper/40 mt-3">
              {dataRows.length} métier(s) dans « {csvName} » → {dataRows.length * 12} lignes générées.
            </p>
            <button
              onClick={importBenchmarks}
              disabled={importing}
              className="mt-4 bg-gold text-ink font-bold px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50"
            >
              <Upload className="w-4 h-4" /> Importer {dataRows.length} métier(s)
            </button>
          </div>
        )}
      </div>

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
