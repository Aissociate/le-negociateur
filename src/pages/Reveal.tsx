import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { TrendingUp, AlertTriangle, ArrowRight, Loader2, Flame } from 'lucide-react';
import Layout from '../components/Layout';
import Markdown from '../components/Markdown';
import { getFunction } from '../lib/supabase';
import { GapReport } from '../types';

const euros = (n: number) => new Intl.NumberFormat('fr-FR').format(n) + ' €';

function segmentTone(segment: string): { label: string; cls: string } {
  const s = segment.toLowerCase();
  if (s.includes('fort')) return { label: 'Fortement sous-payé', cls: 'text-ember' };
  if (s.includes('léger') || s.includes('leger')) return { label: 'Légèrement sous-payé', cls: 'text-gold' };
  if (s.includes('aligné') || s.includes('aligne')) return { label: 'Aligné au marché', cls: 'text-paper' };
  return { label: segment, cls: 'text-gold' };
}

export default function Reveal() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<GapReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getFunction<GapReport>('public-data', { report: id })
      .then(setReport)
      .catch((e) => setError(e instanceof Error ? e.message : 'Rapport introuvable.'));
  }, [id]);

  if (error) {
    return (
      <Layout narrow>
        <div className="text-center py-16">
          <AlertTriangle className="w-10 h-10 text-ember mx-auto mb-4" />
          <p className="text-paper/70">{error}</p>
          <Link to="/" className="text-gold underline mt-4 inline-block">Recommencer l'analyse</Link>
        </div>
      </Layout>
    );
  }

  if (!report) {
    return (
      <Layout narrow>
        <div className="text-center py-24 text-paper/50">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
          Révélation de votre écart…
        </div>
      </Layout>
    );
  }

  const tone = segmentTone(report.segment);
  const span = Math.max(report.market_high - report.market_low, 1);
  const marker = Math.min(100, Math.max(0, ((report.remuneration_actuelle - report.market_low) / span) * 100));
  const medianPos = Math.min(100, Math.max(0, ((report.market_median - report.market_low) / span) * 100));

  const intel = report.intel ?? {};
  const facts: { label: string; value: string }[] = [];
  if (intel.net_annual != null) facts.push({ label: 'Net estimé / an', value: euros(intel.net_annual) });
  if (intel.percentile != null) facts.push({ label: 'Percentile INSEE', value: `${intel.percentile}e` });
  if (intel.borrowing_uplift) facts.push({ label: "Capacité d'emprunt en +", value: euros(intel.borrowing_uplift) });
  if (intel.upside_to_high) facts.push({ label: 'Marge haut de fourchette', value: euros(intel.upside_to_high) });

  return (
    <Layout narrow>
      {report.metier_en_tension && (
        <div className="inline-flex items-center gap-1.5 text-xs font-medium text-ember bg-ember/10 border border-ember/30 rounded-full px-3 py-1 mb-4">
          <Flame className="w-3.5 h-3.5" /> Métier en tension — le marché bouge vite
        </div>
      )}

      <p className="text-paper/50 text-sm">{report.poste} · {report.secteur} · {report.seniorite}</p>
      <h1 className="text-3xl sm:text-4xl font-display font-bold mt-1">Votre écart de rémunération</h1>

      {/* Chiffre choc */}
      <div className="mt-6 bg-white/[0.03] border border-white/10 rounded-2xl p-6">
        <p className={`text-sm font-medium ${tone.cls}`}>{tone.label}</p>
        <div className="flex items-end gap-3 mt-1">
          <span className="text-5xl font-display font-bold text-gold">
            {report.gap_annual > 0 ? '+' : ''}{euros(report.gap_annual)}
          </span>
          <span className="text-paper/50 mb-2">/ an d'écart estimé</span>
        </div>
        <p className="text-sm text-paper/60 mt-1">
          Soit {report.gap_percent > 0 ? '+' : ''}{report.gap_percent}% par rapport à la médiane du marché.
        </p>

        {/* Barre de positionnement marché */}
        <div className="mt-6">
          <div className="relative h-2 rounded-full bg-gradient-to-r from-ember/40 via-gold/40 to-emerald-500/40">
            <div className="absolute -top-1.5 w-1 h-5 bg-paper rounded" style={{ left: `${marker}%` }} title="Vous" />
            <div className="absolute -bottom-1.5 w-0.5 h-4 bg-paper/40" style={{ left: `${medianPos}%` }} title="Médiane" />
          </div>
          <div className="flex justify-between text-xs text-paper/40 mt-3">
            <span>{euros(report.market_low)}</span>
            <span>médiane {euros(report.market_median)}</span>
            <span>{euros(report.market_high)}</span>
          </div>
          <p className="text-xs text-paper/40 mt-1">Vous : {euros(report.remuneration_actuelle)}</p>
        </div>
      </div>

      {/* Faits clés (données externes agrégées) */}
      {facts.length > 0 && (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {facts.map((f) => (
            <div key={f.label} className="bg-white/[0.03] border border-white/10 rounded-xl p-3">
              <p className="text-[11px] text-paper/40">{f.label}</p>
              <p className="font-display font-bold text-gold">{f.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Analyse IA */}
      <div className="mt-8 prose-invert max-w-none text-paper/85">
        <Markdown>{report.analysis_md}</Markdown>
      </div>

      <p className="mt-4 text-xs text-paper/40">
        Sources : {report.source} ({report.annee})
        {intel.providers_ok?.length ? ` · ${intel.providers_ok.join(' · ')}` : ''}. Estimations indicatives, non contractuelles.
      </p>

      {/* CTA vers le Kit */}
      <div className="mt-8 bg-gradient-to-br from-gold/15 to-ember/10 border border-gold/30 rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <TrendingUp className="w-6 h-6 text-gold shrink-0 mt-1" />
          <div>
            <h2 className="text-xl font-display font-semibold">Récupérez cet écart.</h2>
            <p className="text-paper/70 text-sm mt-1">
              Le Kit de Négociation génère, sur-mesure pour votre poste, l'argumentaire chiffré, les scripts et la
              stratégie pour obtenir l'augmentation que vous méritez.
            </p>
            <Link
              to={`/kit?report=${report.id}`}
              className="mt-4 inline-flex items-center gap-2 bg-gold text-ink font-semibold rounded-xl px-5 py-3 hover:brightness-105 transition"
            >
              Découvrir le Kit de Négociation <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
