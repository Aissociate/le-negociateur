import { useState } from 'react';
import { Play, Loader2 } from 'lucide-react';
import { callAdminFunction } from '../../lib/supabase';
import { SECTEURS, SENIORITES, LOCALISATIONS } from '../../types';

interface IntelResult {
  // deno-lint-ignore no-explicit-any
  sources: Record<string, any>;
  // deno-lint-ignore no-explicit-any
  normalized: Record<string, any>;
}

const inputCls = 'w-full rounded-lg bg-ink border border-paper/20 px-3 py-2 text-sm';

const NORM_LABELS: Record<string, string> = {
  net_monthly: 'Net / mois (€)',
  net_annual: 'Net / an (€)',
  net_ratio: 'Ratio net/brut',
  percentile: 'Percentile INSEE',
  insee_verdict: 'Verdict INSEE',
  ft_tension: 'Tension (FT)',
  ft_offres: 'Offres (FT)',
  ft_salaire_min: 'Salaire min (FT)',
  ft_salaire_max: 'Salaire max (FT)',
  borrowing_current: "Capacité d'emprunt actuelle (€)",
  borrowing_target: "Capacité d'emprunt au médian (€)",
  borrowing_uplift: "Gain capacité d'emprunt (€)",
};

export default function IntelTest() {
  const [form, setForm] = useState({
    poste: 'Ingénieur cybersécurité',
    secteur: SECTEURS[0],
    seniorite: SENIORITES[1],
    localisation: LOCALISATIONS[0],
    remuneration: '60000',
    code_rome: 'M1802',
    market_median: '',
  });
  const [res, setRes] = useState<IntelResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function run() {
    setBusy(true);
    setErr('');
    setRes(null);
    try {
      const rem = parseInt(form.remuneration, 10) || 0;
      const r = await callAdminFunction<IntelResult>('salary-intel-test', {
        poste: form.poste,
        secteur: form.secteur,
        seniorite: form.seniorite,
        localisation: form.localisation,
        remuneration_actuelle: rem,
        code_rome: form.code_rome || null,
        market_median: form.market_median ? parseInt(form.market_median, 10) : Math.round(rem * 1.1),
      });
      setRes(r);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erreur');
    }
    setBusy(false);
  }

  const norm = res?.normalized ?? {};
  const providers: string[] = (norm.providers_ok as string[]) ?? [];

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-3xl font-bold mb-2">Test agrégation salariale</h1>
      <p className="text-paper/60 text-sm mb-8">
        Lance les 3 sources (calculer-salaire.com, moicombien.fr, France Travail) sur un profil et affiche les réponses
        brutes — <strong>sans rien sauvegarder</strong>. Utile pour valider France Travail et caler le mapping.
      </p>

      <div className="bg-paper/5 rounded-xl p-6 mb-8">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs text-paper/50 mb-1">Poste</label>
            <input value={form.poste} onChange={(e) => set('poste', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs text-paper/50 mb-1">Secteur</label>
            <select value={form.secteur} onChange={(e) => set('secteur', e.target.value)} className={inputCls}>
              {SECTEURS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-paper/50 mb-1">Séniorité</label>
            <select value={form.seniorite} onChange={(e) => set('seniorite', e.target.value)} className={inputCls}>
              {SENIORITES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-paper/50 mb-1">Localisation</label>
            <select value={form.localisation} onChange={(e) => set('localisation', e.target.value)} className={inputCls}>
              {LOCALISATIONS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-paper/50 mb-1">Rémunération brute / an (€)</label>
            <input value={form.remuneration} onChange={(e) => set('remuneration', e.target.value.replace(/[^0-9]/g, ''))} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs text-paper/50 mb-1">Code ROME (optionnel)</label>
            <input value={form.code_rome} onChange={(e) => set('code_rome', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs text-paper/50 mb-1">Médiane marché (€, optionnel)</label>
            <input value={form.market_median} onChange={(e) => set('market_median', e.target.value.replace(/[^0-9]/g, ''))} className={inputCls} />
          </div>
        </div>
        <button
          onClick={run}
          disabled={busy}
          className="mt-4 bg-gold text-ink font-bold px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          Lancer le test
        </button>
        {err && <p className="mt-3 text-ember text-sm font-semibold">{err}</p>}
      </div>

      {res && (
        <div className="space-y-6">
          <div>
            <h2 className="font-display text-xl font-bold mb-3">
              Données normalisées{' '}
              <span className="text-sm font-normal text-paper/50">
                — sources OK : {providers.length ? providers.join(', ') : 'aucune'}
              </span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(NORM_LABELS)
                .filter(([k]) => norm[k] !== undefined && norm[k] !== null)
                .map(([k, label]) => (
                  <div key={k} className="bg-paper/5 rounded-lg p-3">
                    <p className="text-[11px] text-paper/40">{label}</p>
                    <p className="font-display font-bold text-gold">{String(norm[k])}</p>
                  </div>
                ))}
            </div>
          </div>

          <div>
            <h2 className="font-display text-xl font-bold mb-3">Réponses brutes par fournisseur</h2>
            <div className="space-y-3">
              {Object.entries(res.sources).map(([provider, payload]) => (
                <details key={provider} className="bg-paper/5 rounded-lg p-4">
                  <summary className="cursor-pointer font-semibold">{provider}</summary>
                  <pre className="mt-3 text-xs overflow-x-auto text-paper/70 whitespace-pre-wrap break-all">
                    {JSON.stringify(payload, null, 2)}
                  </pre>
                </details>
              ))}
              {Object.keys(res.sources).length === 0 && <p className="text-paper/40 text-sm">Aucune source n'a répondu.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
