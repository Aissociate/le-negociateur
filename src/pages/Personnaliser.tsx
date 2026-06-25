import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Loader2, Sparkles, Minus, Plus } from 'lucide-react';
import Layout from '../components/Layout';
import { callFunction } from '../lib/supabase';
import {
  ANNEES_NAISSANCE,
  TYPES_CONTRAT,
  METIERS,
  STATUTS,
  NATURES_RESPONSABILITES,
  PERIMETRES,
  NIVEAUX_EXPERTISE,
  EFFECTIFS_ENCADRES,
  SITUATIONS_SOCIETE,
  STRUCTURES,
  NAF_SECTEURS,
  TRANCHES_CA,
  EFFECTIFS_SOCIETE,
  ACTIONNARIATS,
  ETENDUES,
  REM_GARANTIS,
  REM_VARIABLE,
  REM_EPARGNE,
  REM_LONG_TERME,
  AVANTAGES_NATURE,
  AVANTAGES_AUTRES,
  RemItem,
} from '../lib/questionnaireOptions';

const inputCls =
  'w-full bg-ink border border-white/15 rounded-lg px-3 py-2.5 text-paper placeholder-paper/30 focus:border-gold focus:outline-none text-sm';

const STEPS = ['Votre emploi', 'Votre entreprise', 'Votre rémunération', 'Vos avantages', 'Vos réalisations'];

type El = { on: boolean; montant: string };

export default function Personnaliser() {
  const [params] = useSearchParams();
  const session = params.get('session');
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [emploi, setEmploi] = useState({
    sexe: '', annee_naissance: '', anciennete_totale: '', anciennete_societe: '', type_contrat: '',
    temps_partiel: false, quotite: '', conges_payes: 25, conges_complementaires: 0, metier: '',
    intitule_exact: '', statut: '', nature_responsabilites: '', perimetre: '', niveau_expertise: '',
    effectif_encadre: '', codir_comex: false,
  });
  const [entreprise, setEntreprise] = useState({
    nom: '', situation: '', departement: '', structure: '', type_precis: '', naf: '', ca: '', effectif: '',
    actionnariat: '', etendue: '',
  });
  const [rem, setRem] = useState<{ mensuel_brut: string; mois: number; elements: Record<string, El> }>({
    mensuel_brut: '', mois: 12, elements: {},
  });
  const [avantages, setAvantages] = useState<{ nature: Record<string, boolean>; autres: Record<string, boolean>; total_autres_annuel: string }>({
    nature: {}, autres: {}, total_autres_annuel: '',
  });
  const [real, setReal] = useState({ reussites: '', evolutions: '', competences: '', objectif: '', confiance: '3', contexte: '' });

  const setE = (k: keyof typeof emploi, v: string | number | boolean) => setEmploi((s) => ({ ...s, [k]: v }));
  const setC = (k: keyof typeof entreprise, v: string) => setEntreprise((s) => ({ ...s, [k]: v }));
  const setEl = (key: string, patch: Partial<El>) =>
    setRem((r) => ({
      ...r,
      elements: { ...r.elements, [key]: { ...(r.elements[key] ?? { on: false, montant: '' }), ...patch } },
    }));

  const total = useMemo(() => {
    const base = (parseInt(rem.mensuel_brut, 10) || 0) * (rem.mois || 12);
    const els = Object.values(rem.elements).reduce((s, el) => s + (el.on ? parseInt(el.montant, 10) || 0 : 0), 0);
    return base + els + (parseInt(avantages.total_autres_annuel, 10) || 0);
  }, [rem, avantages.total_autres_annuel]);

  async function submit() {
    if (!session) {
      setError('Lien de personnalisation invalide. Utilisez le lien reçu après votre achat.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const profile = {
        emploi,
        entreprise,
        remuneration: { mensuel_brut: rem.mensuel_brut, mois: rem.mois, elements: rem.elements },
        avantages,
        realisations: real,
      };
      // Le webhook Stripe valide le paiement de façon asynchrone : on tolère un
      // court délai (race) en réessayant si la commande n'est pas encore "payée".
      let token = '';
      for (let attempt = 0; attempt < 3 && !token; attempt++) {
        try {
          const r = await callFunction<{ token: string }>('personalize-kit', { session, profile });
          token = r.token;
        } catch (e) {
          const msg = e instanceof Error ? e.message : '';
          if (/pay[ée]/i.test(msg) && attempt < 2) {
            await new Promise((res) => setTimeout(res, 2500));
            continue;
          }
          throw e;
        }
      }
      // Tunnel OTO (upsell/downsell) avant la remise du Kit final.
      navigate(`/oto?session=${encodeURIComponent(session)}&token=${token}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Une erreur est survenue. Réessayez.');
      setSubmitting(false);
    }
  }

  if (!session) {
    return (
      <Layout narrow>
        <div className="text-center py-16">
          <p className="text-paper/70">Cette page personnalise votre Kit après achat. Utilisez le lien reçu par email.</p>
        </div>
      </Layout>
    );
  }

  const remSection = (title: string, items: RemItem[]) => (
    <div className="mb-5">
      <p className="text-xs uppercase tracking-wide text-gold/80 font-semibold mb-2">{title}</p>
      <div className="rounded-xl border border-white/10 divide-y divide-white/5">
        {items.map((item) => {
          const el = rem.elements[item.key] ?? { on: false, montant: '' };
          return (
            <div key={item.key} className="flex items-center justify-between gap-3 px-3 py-2.5">
              <span className="text-sm">{item.label}</span>
              <div className="flex items-center gap-2">
                {item.money && el.on && (
                  <input
                    value={el.montant}
                    onChange={(e) => setEl(item.key, { montant: e.target.value.replace(/[^0-9]/g, '') })}
                    placeholder="€/an"
                    className="w-24 bg-ink border border-white/15 rounded px-2 py-1 text-sm text-right"
                  />
                )}
                <Toggle checked={el.on} onChange={(v) => setEl(item.key, { on: v })} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const avantSection = (title: string, items: { key: string; label: string }[], group: 'nature' | 'autres') => (
    <div className="mb-5">
      <p className="text-xs uppercase tracking-wide text-gold/80 font-semibold mb-2">{title}</p>
      <div className="rounded-xl border border-white/10 divide-y divide-white/5">
        {items.map((item) => (
          <div key={item.key} className="flex items-center justify-between gap-3 px-3 py-2.5">
            <span className="text-sm">{item.label}</span>
            <Toggle
              checked={!!avantages[group][item.key]}
              onChange={(v) => setAvantages((a) => ({ ...a, [group]: { ...a[group], [item.key]: v } }))}
            />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Layout narrow>
      <div className="text-center mb-6">
        <h1 className="font-display text-2xl sm:text-3xl font-bold">Personnalisez votre Kit</h1>
        <p className="text-paper/60 text-sm mt-1">
          Plus vous renseignez votre situation et vos réussites, plus votre Kit sera précis et redoutable.
        </p>
      </div>

      {/* Progression */}
      <div className="mb-6">
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-gold transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
        <p className="mt-2 text-xs text-paper/40">
          Étape {step + 1}/{STEPS.length} — {STEPS[step]}
        </p>
      </div>

      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-7 space-y-4">
        {step === 0 && (
          <>
            <div className="grid sm:grid-cols-2 gap-4">
              <Sel label="Vous êtes" value={emploi.sexe} onChange={(v) => setE('sexe', v)} options={['Homme', 'Femme']} />
              <Sel label="Année de naissance" value={emploi.annee_naissance} onChange={(v) => setE('annee_naissance', v)} options={ANNEES_NAISSANCE} />
              <Txt label="Ancienneté professionnelle totale (années)" value={emploi.anciennete_totale} onChange={(v) => setE('anciennete_totale', v.replace(/[^0-9]/g, ''))} placeholder="ex. 8" />
              <Txt label="Ancienneté dans la société (années)" value={emploi.anciennete_societe} onChange={(v) => setE('anciennete_societe', v.replace(/[^0-9]/g, ''))} placeholder="ex. 3" />
              <Sel label="Type de contrat" value={emploi.type_contrat} onChange={(v) => setE('type_contrat', v)} options={TYPES_CONTRAT} />
              <Sel label="Métier / emploi" value={emploi.metier} onChange={(v) => setE('metier', v)} options={METIERS} />
            </div>
            <Txt label="Intitulé exact de votre poste (facultatif)" value={emploi.intitule_exact} onChange={(v) => setE('intitule_exact', v)} placeholder="ex. Lead Developer Frontend" />
            <div className="grid sm:grid-cols-2 gap-4">
              <Sel label="Statut actuel" value={emploi.statut} onChange={(v) => setE('statut', v)} options={STATUTS} />
              <Sel label="Niveau d'expertise" value={emploi.niveau_expertise} onChange={(v) => setE('niveau_expertise', v)} options={NIVEAUX_EXPERTISE} />
              <Sel label="Nature de vos responsabilités" value={emploi.nature_responsabilites} onChange={(v) => setE('nature_responsabilites', v)} options={NATURES_RESPONSABILITES} />
              <Sel label="Ces responsabilités portent sur" value={emploi.perimetre} onChange={(v) => setE('perimetre', v)} options={PERIMETRES} />
              <Sel label="Personnes encadrées au total" value={emploi.effectif_encadre} onChange={(v) => setE('effectif_encadre', v)} options={EFFECTIFS_ENCADRES} />
            </div>
            <Slider label="Jours de congés payés" value={emploi.conges_payes} max={40} onChange={(v) => setE('conges_payes', v)} />
            <Slider label="Jours de congés complémentaires (RTT…)" value={emploi.conges_complementaires} max={25} onChange={(v) => setE('conges_complementaires', v)} />
            <ToggleRow label="Travaillez-vous à temps partiel ?" checked={emploi.temps_partiel} onChange={(v) => setE('temps_partiel', v)} />
            {emploi.temps_partiel && (
              <Txt label="Quotité (%)" value={emploi.quotite} onChange={(v) => setE('quotite', v.replace(/[^0-9]/g, ''))} placeholder="ex. 80" />
            )}
            <ToggleRow label="Membre du Comité de direction (CODIR) / exécutif (COMEX) ?" checked={emploi.codir_comex} onChange={(v) => setE('codir_comex', v)} />
          </>
        )}

        {step === 1 && (
          <>
            <Txt label="Nom de votre société (facultatif)" value={entreprise.nom} onChange={(v) => setC('nom', v)} placeholder="ex. WAAGE" />
            <div className="grid sm:grid-cols-2 gap-4">
              <Sel label="Situation de la société" value={entreprise.situation} onChange={(v) => setC('situation', v)} options={SITUATIONS_SOCIETE} />
              <Txt label="Département (lieu de travail)" value={entreprise.departement} onChange={(v) => setC('departement', v)} placeholder="ex. 75, Paris" />
              <Sel label="Il s'agit d'une" value={entreprise.structure} onChange={(v) => setC('structure', v)} options={STRUCTURES} />
              <Sel label="Secteur d'activité (NAF)" value={entreprise.naf} onChange={(v) => setC('naf', v)} options={NAF_SECTEURS} />
              <Sel label="Chiffre d'affaires" value={entreprise.ca} onChange={(v) => setC('ca', v)} options={TRANCHES_CA} />
              <Sel label="Nombre de salariés" value={entreprise.effectif} onChange={(v) => setC('effectif', v)} options={EFFECTIFS_SOCIETE} />
              <Sel label="La société est (actionnariat)" value={entreprise.actionnariat} onChange={(v) => setC('actionnariat', v)} options={ACTIONNARIATS} />
              <Sel label="Étendue de l'activité" value={entreprise.etendue} onChange={(v) => setC('etendue', v)} options={ETENDUES} />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="grid sm:grid-cols-2 gap-4 items-end">
              <Txt label="Rémunération mensuelle brute (€)" value={rem.mensuel_brut} onChange={(v) => setRem((r) => ({ ...r, mensuel_brut: v.replace(/[^0-9]/g, '') }))} placeholder="ex. 3200" />
              <div>
                <label className="block text-sm font-medium mb-1">Sur combien de mois ?</label>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setRem((r) => ({ ...r, mois: Math.max(12, r.mois - 1) }))} className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-display text-xl font-bold w-8 text-center">{rem.mois}</span>
                  <button type="button" onClick={() => setRem((r) => ({ ...r, mois: Math.min(16, r.mois + 1) }))} className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-paper/40">
                    soit {((parseInt(rem.mensuel_brut, 10) || 0) * rem.mois).toLocaleString('fr-FR')} € bruts/an
                  </span>
                </div>
              </div>
            </div>
            {remSection('Éléments garantis et statutaires', REM_GARANTIS)}
            {remSection('Rémunération variable', REM_VARIABLE)}
            {remSection('Épargne salariale', REM_EPARGNE)}
            {remSection('Rémunération long terme', REM_LONG_TERME)}
          </>
        )}

        {step === 3 && (
          <>
            {avantSection('Avantages en nature, mutuelle, prévoyance', AVANTAGES_NATURE, 'nature')}
            {avantSection('Autres avantages', AVANTAGES_AUTRES, 'autres')}
            <Txt label="Total annuel brut estimé de ces autres avantages (€)" value={avantages.total_autres_annuel} onChange={(v) => setAvantages((a) => ({ ...a, total_autres_annuel: v.replace(/[^0-9]/g, '') }))} placeholder="ex. 1500" />
          </>
        )}

        {step === 4 && (
          <>
            <p className="text-sm text-paper/60">
              C'est le carburant de votre argumentaire : vos résultats et votre trajectoire deviennent des arguments concrets dans votre Kit.
            </p>
            <Area label="Vos principales réussites professionnelles (résultats chiffrés, projets, CA apporté, économies générées…)" value={real.reussites} onChange={(v) => setReal((s) => ({ ...s, reussites: v }))} />
            <Area label="Évolutions / promotions récentes" value={real.evolutions} onChange={(v) => setReal((s) => ({ ...s, evolutions: v }))} rows={2} />
            <Txt label="Compétences ou certifications différenciantes" value={real.competences} onChange={(v) => setReal((s) => ({ ...s, competences: v }))} placeholder="ex. certification AWS, anglais courant…" />
            <Txt label="Votre objectif (augmentation visée, promotion…)" value={real.objectif} onChange={(v) => setReal((s) => ({ ...s, objectif: v }))} placeholder="ex. +8 %, passage cadre dirigeant" />
            <Slider label="Votre confiance pour négocier (1 à 5)" value={parseInt(real.confiance, 10)} max={5} min={1} onChange={(v) => setReal((s) => ({ ...s, confiance: String(v) }))} />
            <Txt label="Contexte particulier (entretien à venir, date…)" value={real.contexte} onChange={(v) => setReal((s) => ({ ...s, contexte: v }))} placeholder="ex. entretien annuel dans 3 semaines" />
          </>
        )}

        {(step === 2 || step === 3) && (
          <p className="text-right text-sm text-paper/50 pt-2 border-t border-white/5">
            Package total estimé : <span className="text-gold font-bold">{total.toLocaleString('fr-FR')} € bruts/an</span>
          </p>
        )}

        {error && <p className="text-ember text-sm">{error}</p>}

        <div className="flex items-center justify-between pt-2">
          <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} className={`text-sm text-paper/50 flex items-center gap-1 ${step === 0 ? 'invisible' : ''}`}>
            <ArrowLeft className="w-4 h-4" /> Précédent
          </button>
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={() => setStep((s) => s + 1)} className="bg-gold text-ink font-semibold rounded-xl px-6 py-3 flex items-center gap-2 hover:brightness-105 transition">
              Continuer <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button type="button" onClick={submit} disabled={submitting} className="bg-gold text-ink font-semibold rounded-xl px-6 py-3 flex items-center gap-2 hover:brightness-105 disabled:opacity-60 transition">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {submitting ? 'Génération de votre Kit…' : 'Générer mon Kit sur-mesure'}
            </button>
          )}
        </div>
      </div>
    </Layout>
  );
}

// --- Sous-composants ---
function Sel({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
        <option value="">Sélectionnez…</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}
function Txt({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputCls} />
    </div>
  );
}
function Area({ label, value, onChange, rows = 4 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} />
    </div>
  );
}
function Slider({ label, value, onChange, max, min = 0 }: { label: string; value: number; onChange: (v: number) => void; max: number; min?: number }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-medium">{label}</label>
        <span className="text-gold font-bold text-sm">{value}</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-gold" />
    </div>
  );
}
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} aria-pressed={checked} className={`relative w-11 h-6 rounded-full transition shrink-0 ${checked ? 'bg-gold' : 'bg-white/15'}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-paper transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
  );
}
function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-medium">{label}</span>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}
