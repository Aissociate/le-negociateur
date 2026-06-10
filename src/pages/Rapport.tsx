import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { getFunction } from '../lib/supabase';
import Markdown from '../components/Markdown';
import type { GapReport } from '../types';

const eur = (n: number) => n.toLocaleString('fr-FR') + ' €';

export default function Rapport() {
  const { id } = useParams();
  const [report, setReport] = useState<GapReport | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    const cached = sessionStorage.getItem(`report:${id}`);
    if (cached) {
      setReport(JSON.parse(cached));
      return;
    }
    getFunction<GapReport>('public-data', { report: id })
      .then(setReport)
      .catch(() => setError("Rapport introuvable ou expiré."));
  }, [id]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4">{error}</p>
          <Link to="/" className="text-gold underline">
            Refaire une analyse
          </Link>
        </div>
      </div>
    );
  }

  if (!report) {
    return <div className="min-h-screen flex items-center justify-center text-paper/60">Chargement…</div>;
  }

  const underPaid = report.gap_annual > 0;

  return (
    <div className="min-h-screen max-w-3xl mx-auto px-6 py-12">
      <p className="text-gold tracking-widest uppercase text-sm mb-2">Le Négociateur — Rapport de positionnement</p>
      <h1 className="font-display text-3xl md:text-4xl font-bold mb-8">
        {report.poste} · {report.seniorite}
      </h1>

      {/* The number */}
      <div className="bg-paper text-ink rounded-2xl p-8 text-center mb-8">
        {underPaid ? (
          <>
            <p className="text-sm uppercase tracking-wide text-ink/60 mb-2">
              Écart estimé avec le marché
            </p>
            <p className="font-display text-5xl md:text-6xl font-bold text-ember">
              −{eur(report.gap_annual)} / an
            </p>
            <p className="mt-3 text-ink/70">
              Votre rémunération est environ <strong>{Math.abs(report.gap_percent)}%</strong> sous
              la médiane de votre marché.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm uppercase tracking-wide text-ink/60 mb-2">Positionnement</p>
            <p className="font-display text-5xl font-bold text-ink">
              +{eur(Math.abs(report.gap_annual))} / an
            </p>
            <p className="mt-3 text-ink/70">
              Vous êtes au-dessus de la médiane — l'enjeu est de <strong>sécuriser</strong> et
              valoriser cette position.
            </p>
          </>
        )}
        <div className="mt-6 grid grid-cols-3 gap-2 text-sm">
          <div className="bg-ink/5 rounded-lg p-3">
            <p className="text-ink/50">Bas de marché</p>
            <p className="font-bold">{eur(report.market_low)}</p>
          </div>
          <div className="bg-gold/20 rounded-lg p-3 border border-gold">
            <p className="text-ink/50">Médiane</p>
            <p className="font-bold">{eur(report.market_median)}</p>
          </div>
          <div className="bg-ink/5 rounded-lg p-3">
            <p className="text-ink/50">Haut de marché</p>
            <p className="font-bold">{eur(report.market_high)}</p>
          </div>
        </div>
        <p className="mt-4 text-xs text-ink/40">
          Source : {report.source} ({report.annee}) — estimation indicative pour {report.secteur},{' '}
          {report.localisation}.
        </p>
      </div>

      {/* AI analysis */}
      <Markdown text={report.analysis_md} className="text-paper/90" />

      {/* CTA */}
      <div className="mt-10 bg-gold/10 border border-gold rounded-2xl p-8 text-center">
        <h2 className="font-display text-2xl font-bold mb-3">
          Transformez cet écart en augmentation
        </h2>
        <p className="text-paper/80 mb-6">
          Le <strong>Kit de Négociation Offensif</strong> : votre dossier complet et personnalisé
          pour préparer, mener et conclure la négociation de votre salaire — scripts, contre-arguments,
          stratégie en 5 étapes.
        </p>
        <Link
          to="/kit"
          className="inline-flex items-center gap-2 bg-gold text-ink font-bold px-8 py-4 rounded-lg hover:bg-gold/90 transition"
        >
          Découvrir le Kit <ArrowRight size={18} />
        </Link>
        <p className="mt-3 text-xs text-paper/50">
          Moins de 2,5 % de ce que vous pouvez récupérer dès la première année.
        </p>
      </div>

      <p className="mt-10 text-center text-xs text-paper/40">
        Votre analyse complète vous a aussi été envoyée par email.
      </p>
    </div>
  );
}
