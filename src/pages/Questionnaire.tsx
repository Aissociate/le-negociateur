import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Lock, Loader2, ShieldCheck, X } from 'lucide-react';
import Layout from '../components/Layout';
import SocialProof from '../components/SocialProof';
import { SECTEURS, SENIORITES, LOCALISATIONS } from '../types';
import { callFunction } from '../lib/supabase';
import { CAPTURE_EXPERIMENT, assignVariant, trackAB, Variant } from '../lib/ab';
import { TRUST_BADGES } from '../lib/cro';
import { trackEvent } from '../lib/pixel';

type Answers = {
  poste: string;
  secteur: string;
  seniorite: string;
  localisation: string;
  remuneration: string;
};

const POSTE_SUGGESTIONS = [
  'Directeur commercial',
  'Ingénieur DevOps',
  'Responsable marketing',
  'Chef de projet IT',
  'Data scientist',
  'Contrôleur de gestion',
];

const TOTAL = 6;

export default function Questionnaire() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({
    poste: '',
    secteur: '',
    seniorite: '',
    localisation: '',
    remuneration: '',
  });
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showExit, setShowExit] = useState(false);
  const [exitArmed, setExitArmed] = useState(true);

  const variant: Variant = useMemo(() => assignVariant(CAPTURE_EXPERIMENT), []);

  useEffect(() => {
    trackAB(CAPTURE_EXPERIMENT.key, variant.key, 'view');
  }, [variant.key]);

  // Exit-intent sur l'étape de capture : on récupère l'abandon (une seule fois).
  useEffect(() => {
    if (step !== 5) return;
    const onLeave = (e: MouseEvent) => {
      if (exitArmed && !e.relatedTarget && e.clientY <= 10) {
        setShowExit(true);
        setExitArmed(false);
      }
    };
    document.addEventListener('mouseout', onLeave);
    return () => document.removeEventListener('mouseout', onLeave);
  }, [step, exitArmed]);

  const set = (key: keyof Answers, value: string) => setAnswers((a) => ({ ...a, [key]: value }));
  const goNext = () => setStep((s) => Math.min(TOTAL - 1, s + 1));
  const goPrev = () => setStep((s) => Math.max(0, s - 1));
  // Sélection d'une option -> avance automatiquement (réduit un clic par étape).
  const pick = (key: keyof Answers, value: string) => {
    set(key, value);
    window.setTimeout(goNext, 220);
  };

  const progress = Math.round((step / TOTAL) * 100);

  const canNext = (): boolean => {
    switch (step) {
      case 0:
        return !!answers.seniorite;
      case 1:
        return !!answers.secteur;
      case 2:
        return !!answers.localisation;
      case 3:
        return answers.poste.trim().length > 1;
      case 4:
        return parseInt(answers.remuneration, 10) > 0;
      default:
        return true;
    }
  };

  const submit = async () => {
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Entrez une adresse email valide.');
      return;
    }
    setSubmitting(true);
    try {
      const { report_id } = await callFunction<{ report_id: string }>('rapport-ecart', {
        poste: answers.poste.trim(),
        secteur: answers.secteur,
        seniorite: answers.seniorite,
        localisation: answers.localisation,
        remuneration_actuelle: parseInt(answers.remuneration, 10),
        email: email.trim(),
        consent: true,
        ab_variant: variant.key,
      });
      trackAB(CAPTURE_EXPERIMENT.key, variant.key, 'capture');
      // Conversion funnel : lead capté (email + analyse générée).
      trackEvent('Lead', { content_name: 'Analyse écart de rémunération' });
      navigate(`/rapport/${report_id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Une erreur est survenue. Réessayez.');
      setSubmitting(false);
    }
  };

  const stepLabel = step === 5 ? "Dernière étape — ton analyse t'attend" : `Étape ${step + 1} / ${TOTAL}`;

  return (
    <Layout narrow>
      <div className="text-center mb-8">
        <h1 className="font-display text-2xl sm:text-3xl font-bold leading-tight">
          Ton écart de rémunération, en 30 secondes
        </h1>
        <p className="text-paper/60 text-sm mt-1">5 questions rapides · analyse gratuite · données sourcées</p>
      </div>

      {/* Barre de progression */}
      <div className="mb-8" id="questionnaire">
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-gold transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-xs text-paper/40">{stepLabel}</p>
      </div>

      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 sm:p-8">
        {step === 0 && (
          <Question title="Ton niveau d'expérience ?" hint="Une seule question pour commencer — ça prend 30 secondes.">
            <OptionGrid options={SENIORITES} value={answers.seniorite} onSelect={(v) => pick('seniorite', v)} />
          </Question>
        )}

        {step === 1 && (
          <Question title="Dans quel secteur ?">
            <OptionGrid options={SECTEURS} value={answers.secteur} onSelect={(v) => pick('secteur', v)} />
          </Question>
        )}

        {step === 2 && (
          <Question title="Où travailles-tu ?">
            <OptionGrid options={LOCALISATIONS} value={answers.localisation} onSelect={(v) => pick('localisation', v)} />
          </Question>
        )}

        {step === 3 && (
          <Question title="Quel est ton poste ?" hint="Intitulé le plus proche de ta fonction réelle.">
            <input
              autoFocus
              value={answers.poste}
              onChange={(e) => set('poste', e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && canNext() && goNext()}
              placeholder="Ex. Directeur commercial"
              className={inputCls}
            />
            <div className="flex flex-wrap gap-2 mt-3">
              {POSTE_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => set('poste', s)}
                  className="text-xs px-3 py-1.5 rounded-full border border-white/15 hover:border-gold hover:text-gold transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </Question>
        )}

        {step === 4 && (
          <Question
            title="Ta rémunération brute annuelle actuelle ?"
            hint="Confidentiel — sert uniquement à calculer ton écart. Fixe + variable, en € bruts/an."
          >
            <div className="relative">
              <input
                autoFocus
                inputMode="numeric"
                value={answers.remuneration}
                onChange={(e) => set('remuneration', e.target.value.replace(/[^0-9]/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && canNext() && goNext()}
                placeholder="Ex. 65000"
                className={`${inputCls} pr-12`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-paper/40">€/an</span>
            </div>
          </Question>
        )}

        {step === 5 && (
          <div>
            {/* Teaser verrouillé : le résultat est prêt, l'email le déverrouille */}
            <div className="rounded-2xl border border-gold/30 bg-gold/5 p-5 mb-5 text-center">
              <p className="text-xs text-paper/50">
                {answers.poste || 'Ton poste'} · {answers.seniorite} · {answers.localisation}
              </p>
              <p className="text-[11px] text-gold mt-2 uppercase tracking-widest">Ton écart de rémunération estimé</p>
              <div className="relative inline-block mt-1">
                <span className="font-display text-4xl font-bold blur-md select-none">+ ●·●●● €/an</span>
                <Lock className="absolute inset-0 m-auto w-6 h-6 text-gold" />
              </div>
              <p className="text-xs text-paper/55 mt-2">
                Ton analyse est prête. Entre ton email pour révéler le <strong>chiffre exact</strong>.
              </p>
            </div>

            <h2 className="text-2xl sm:text-3xl font-display font-bold leading-tight">{variant.content.headline}</h2>
            <p className="mt-2 text-paper/70">{variant.content.subhead}</p>

            <div className="mt-5 space-y-3">
              <input
                autoFocus
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                placeholder="ton@email.fr"
                className={inputCls}
              />
              {error && <p className="text-ember text-sm">{error}</p>}
              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="w-full bg-gold text-ink font-semibold rounded-xl py-3.5 flex items-center justify-center gap-2 hover:brightness-105 disabled:opacity-60 transition"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                {submitting ? 'Calcul en cours…' : variant.content.cta}
              </button>
              <p className="text-center text-[11px] text-paper/45 leading-relaxed">
                En recevant mon analyse, j'accepte de recevoir les conseils du Négociateur par email — désinscription en
                1 clic. Voir la <Link to="/confidentialite" className="underline">confidentialité</Link>.
              </p>
            </div>

            {/* Badges de confiance */}
            <div className="mt-5 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] text-paper/45">
              {TRUST_BADGES.map((b) => (
                <span key={b} className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-gold/70" /> {b}
                </span>
              ))}
            </div>

            {/* Preuve sociale */}
            <div className="mt-6 pt-5 border-t border-white/5">
              <SocialProof index={0} />
            </div>
          </div>
        )}

        {/* Navigation : auto-avance sur les étapes à choix, bouton manuel sinon */}
        {step < 5 && (
          <div className="flex items-center justify-between mt-8">
            <button
              type="button"
              onClick={goPrev}
              className={`text-sm text-paper/50 flex items-center gap-1 ${step === 0 ? 'invisible' : ''}`}
            >
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            {(step === 3 || step === 4) && (
              <button
                type="button"
                onClick={() => canNext() && goNext()}
                disabled={!canNext()}
                className="bg-gold text-ink font-semibold rounded-xl px-6 py-3 flex items-center gap-2 disabled:opacity-40 hover:brightness-105 transition"
              >
                Continuer <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-paper/40">
        Estimations indicatives basées sur des données publiques sourcées (INSEE, DARES, APEC). Aucun résultat garanti.
      </p>

      {/* Exit-intent : pop-up de récupération d'abandon */}
      {showExit && (
        <div
          className="fixed inset-0 z-50 bg-ink/85 flex items-center justify-center p-4"
          onClick={() => setShowExit(false)}
        >
          <div
            className="relative bg-ink border border-gold/30 rounded-2xl p-6 max-w-md w-full text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowExit(false)}
              className="absolute top-3 right-3 text-paper/40 hover:text-paper"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-display text-xl font-bold">Attends — ton analyse est prête 🔓</h3>
            <p className="text-paper/70 text-sm mt-2">
              Ne pars pas sans découvrir ton écart de rémunération. Ça prend 5 secondes.
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="ton@email.fr"
              className={`${inputCls} mt-4`}
            />
            {error && <p className="text-ember text-sm mt-2">{error}</p>}
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="w-full bg-gold text-ink font-semibold rounded-xl py-3 mt-3 hover:brightness-105 disabled:opacity-60 transition"
            >
              {submitting ? 'Calcul en cours…' : 'Révéler mon analyse'}
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}

const inputCls =
  'w-full bg-ink border border-white/15 rounded-xl px-4 py-3.5 text-paper placeholder-paper/30 focus:border-gold focus:outline-none transition';

function Question({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-display font-semibold">{title}</h2>
      {hint && <p className="mt-1 text-sm text-paper/50">{hint}</p>}
      <div className="mt-5">{children}</div>
    </div>
  );
}

function OptionGrid({
  options,
  value,
  onSelect,
}: {
  options: string[];
  value: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="grid sm:grid-cols-2 gap-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onSelect(o)}
          className={`text-left px-4 py-3 rounded-xl border transition ${
            value === o ? 'border-gold bg-gold/10 text-paper' : 'border-white/15 hover:border-white/40'
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
