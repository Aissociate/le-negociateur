import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Lock, Loader2 } from 'lucide-react';
import Layout from '../components/Layout';
import Hero from '../components/Hero';
import { SECTEURS, SENIORITES, LOCALISATIONS } from '../types';
import { callFunction } from '../lib/supabase';
import { CAPTURE_EXPERIMENT, assignVariant, trackAB, Variant } from '../lib/ab';

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
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const variant: Variant = useMemo(() => assignVariant(CAPTURE_EXPERIMENT), []);

  useEffect(() => {
    trackAB(CAPTURE_EXPERIMENT.key, variant.key, 'view');
  }, [variant.key]);

  const set = (key: keyof Answers, value: string) => setAnswers((a) => ({ ...a, [key]: value }));

  // 5 étapes de questionnaire + 1 étape de capture.
  const TOTAL = 6;
  const progress = Math.round((step / TOTAL) * 100);

  const canNext = (): boolean => {
    switch (step) {
      case 0:
        return answers.poste.trim().length > 1;
      case 1:
        return !!answers.secteur;
      case 2:
        return !!answers.seniorite;
      case 3:
        return !!answers.localisation;
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
    if (!consent) {
      setError('Merci de cocher le consentement pour recevoir votre analyse.');
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
      navigate(`/rapport/${report_id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Une erreur est survenue. Réessayez.');
      setSubmitting(false);
    }
  };

  return (
    <Layout narrow hero={<Hero />}>
      {/* Barre de progression */}
      <div className="mb-8" id="questionnaire">
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-gold transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-xs text-paper/40">Étape {Math.min(step + 1, TOTAL)} / {TOTAL}</p>
      </div>

      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 sm:p-8">
        {step === 0 && (
          <Question title="Quel est votre poste ?" hint="Intitulé le plus proche de votre fonction réelle.">
            <input
              autoFocus
              value={answers.poste}
              onChange={(e) => set('poste', e.target.value)}
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

        {step === 1 && (
          <Question title="Dans quel secteur ?">
            <OptionGrid options={SECTEURS} value={answers.secteur} onSelect={(v) => set('secteur', v)} />
          </Question>
        )}

        {step === 2 && (
          <Question title="Votre niveau d'expérience ?">
            <OptionGrid options={SENIORITES} value={answers.seniorite} onSelect={(v) => set('seniorite', v)} />
          </Question>
        )}

        {step === 3 && (
          <Question title="Où travaillez-vous ?">
            <OptionGrid options={LOCALISATIONS} value={answers.localisation} onSelect={(v) => set('localisation', v)} />
          </Question>
        )}

        {step === 4 && (
          <Question title="Votre rémunération brute annuelle actuelle ?" hint="Fixe + variable, en euros bruts par an.">
            <div className="relative">
              <input
                autoFocus
                inputMode="numeric"
                value={answers.remuneration}
                onChange={(e) => set('remuneration', e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Ex. 65000"
                className={`${inputCls} pr-12`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-paper/40">€/an</span>
            </div>
          </Question>
        )}

        {step === 5 && (
          <div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold leading-tight">{variant.content.headline}</h2>
            <p className="mt-3 text-paper/70">{variant.content.subhead}</p>

            <div className="mt-6 space-y-4">
              <input
                autoFocus
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.fr"
                className={inputCls}
              />
              <label className="flex items-start gap-2 text-xs text-paper/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  J'accepte de recevoir mon analyse et les conseils du Négociateur par email. Désinscription en
                  un clic. Vos données ne sont jamais revendues.
                </span>
              </label>

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
              <p className="text-center text-xs text-paper/40">{variant.content.reassurance}</p>
            </div>
          </div>
        )}

        {/* Navigation */}
        {step < 5 && (
          <div className="flex items-center justify-between mt-8">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className={`text-sm text-paper/50 flex items-center gap-1 ${step === 0 ? 'invisible' : ''}`}
            >
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            <button
              type="button"
              onClick={() => canNext() && setStep((s) => s + 1)}
              disabled={!canNext()}
              className="bg-gold text-ink font-semibold rounded-xl px-6 py-3 flex items-center gap-2 disabled:opacity-40 hover:brightness-105 transition"
            >
              Continuer <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-paper/40">
        Estimations indicatives basées sur des données publiques sourcées (INSEE, DARES, APEC). Aucun résultat garanti.
      </p>
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
