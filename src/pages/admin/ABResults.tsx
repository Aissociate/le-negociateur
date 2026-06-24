import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { ABStat } from '../../types';
import { CAPTURE_EXPERIMENT } from '../../lib/ab';

const pct = (a: number, b: number) => (b > 0 ? ((a / b) * 100).toFixed(1) + '%' : '—');

/** Résultats A/B : vues → captures → achats par variante de copywriting. */
export default function ABResults() {
  const [stats, setStats] = useState<ABStat[]>([]);

  useEffect(() => {
    supabase.from('ab_stats').select('*').then(({ data }) => setStats((data as ABStat[]) ?? []));
  }, []);

  const experiments = Array.from(new Set(stats.map((s) => s.experiment_key)));
  const variantHeadline = (key: string) =>
    CAPTURE_EXPERIMENT.variants.find((v) => v.key === key)?.content.headline ?? '';

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-3xl font-bold mb-2">A/B copy</h1>
      <p className="text-paper/60 text-sm mb-8">
        Performance du copywriting de capture. Taux de capture = captures / vues ; taux d'achat = achats / captures.
      </p>

      {experiments.length === 0 && <p className="text-paper/40">Aucune donnée A/B pour l'instant.</p>}

      {experiments.map((exp) => (
        <div key={exp} className="mb-10">
          <h2 className="font-display text-xl font-bold mb-3">{exp}</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-paper/50 border-b border-paper/10">
                <th className="py-2 pr-4">Variante</th>
                <th className="py-2 pr-4">Vues</th>
                <th className="py-2 pr-4">Captures</th>
                <th className="py-2 pr-4">Taux capture</th>
                <th className="py-2 pr-4">Achats</th>
                <th className="py-2">Taux achat</th>
              </tr>
            </thead>
            <tbody>
              {stats
                .filter((s) => s.experiment_key === exp)
                .sort((a, b) => a.variant_key.localeCompare(b.variant_key))
                .map((s) => (
                  <tr key={s.variant_key} className="border-b border-paper/5">
                    <td className="py-2 pr-4">
                      <span className="font-semibold">{s.variant_key}</span>
                      <span className="block text-xs text-paper/40 max-w-xs truncate">{variantHeadline(s.variant_key)}</span>
                    </td>
                    <td className="py-2 pr-4">{s.views}</td>
                    <td className="py-2 pr-4">{s.captures}</td>
                    <td className="py-2 pr-4 text-gold font-semibold">{pct(s.captures, s.views)}</td>
                    <td className="py-2 pr-4">{s.purchases}</td>
                    <td className="py-2 text-gold font-semibold">{pct(s.purchases, s.captures)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
