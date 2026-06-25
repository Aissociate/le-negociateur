import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, Check, X, ShieldCheck } from 'lucide-react';
import Layout from '../components/Layout';
import { supabase, callFunction } from '../lib/supabase';
import { Product, OtoStep } from '../types';

const euros = (c: number) => (c / 100).toLocaleString('fr-FR') + ' €';

export default function Oto() {
  const [params] = useSearchParams();
  const session = params.get('session') ?? '';
  const token = params.get('token') ?? '';
  const resume = params.get('resume') === '1';
  const navigate = useNavigate();

  const [steps, setSteps] = useState<OtoStep[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhase] = useState<'upsell' | 'downsell'>('upsell');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const finish = () => navigate(token ? `/kit/document/${token}` : '/compte');

  useEffect(() => {
    if (resume) {
      finish();
      return;
    }
    Promise.all([
      supabase.from('oto_steps').select('*').eq('active', true).order('position'),
      supabase.from('products').select('*').eq('active', true),
    ]).then(([s, p]) => {
      setSteps((s.data as OtoStep[]) ?? []);
      setProducts((p.data as Product[]) ?? []);
      setLoaded(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (loaded && steps.length === 0) finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, steps]);

  const prod = (slug?: string | null) => products.find((p) => p.slug === slug);
  const step = steps[stepIndex];
  const offer = step ? (phase === 'upsell' ? prod(step.upsell_slug) : prod(step.downsell_slug)) : undefined;
  const trial = !!(step && step.downsell_trial && phase === 'downsell' && offer?.kind === 'subscription');

  function advance() {
    setError('');
    setPhase('upsell');
    if (stepIndex + 1 < steps.length) setStepIndex((i) => i + 1);
    else finish();
  }
  function decline() {
    if (phase === 'upsell' && step?.downsell_slug && prod(step.downsell_slug)) setPhase('downsell');
    else advance();
  }
  async function accept() {
    if (!offer) return;
    setBusy(true);
    setError('');
    try {
      if (offer.kind === 'subscription') {
        const useTrial = phase === 'downsell' && !!step?.downsell_trial;
        const { url } = await callFunction<{ url: string }>('oto-subscribe', {
          session,
          product_slug: offer.slug,
          token,
          trial: useTrial,
        });
        window.location.href = url;
        return;
      }
      const res = await callFunction<{ ok?: boolean; requires_action?: boolean; url?: string }>('oto-charge', {
        session,
        product_slug: offer.slug,
        token,
      });
      if (res.requires_action && res.url) {
        window.location.href = res.url; // fallback SCA (3-D Secure)
        return;
      }
      advance();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur.');
      setBusy(false);
    }
  }

  if (!loaded || !step || !offer) {
    return <Layout narrow><p className="text-center py-16 text-paper/40">…</p></Layout>;
  }

  return (
    <Layout narrow>
      <div className="text-center mb-5">
        <span className="text-ember text-xs font-bold uppercase tracking-widest">Offre unique — ne réapparaîtra pas</span>
        <h1 className="font-display text-2xl sm:text-3xl font-bold mt-2">
          {phase === 'upsell' ? step.headline : 'Attendez — une alternative pour vous.'}
        </h1>
        <p className="text-paper/70 mt-2">
          {phase === 'upsell' ? step.subhead : "Si ce n'est pas le moment, voici une option plus souple."}
        </p>
      </div>

      <div className="bg-paper text-ink rounded-2xl p-6">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-xl font-bold">{offer.name}</h2>
          <p className="font-display text-2xl font-bold">
            {trial ? '1 €' : euros(offer.price_cents)}
            {offer.kind === 'subscription' && (
              <span className="text-sm font-normal">
                {trial ? ` le 1er mois, puis ${euros(offer.price_cents)}/mois` : '/mois'}
              </span>
            )}
          </p>
        </div>
        <p className="text-ink/70 text-sm mt-2">{offer.description_md}</p>
        {error && <p className="text-ember text-sm font-semibold mt-3">{error}</p>}
        <button
          onClick={accept}
          disabled={busy}
          className="mt-5 w-full bg-ink text-paper font-bold py-3.5 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-ink/90 transition"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {offer.kind === 'subscription'
            ? trial
              ? 'Oui, activer pour 1 €'
              : 'Oui, activer maintenant'
            : `Oui, ajouter en 1 clic — ${euros(offer.price_cents)}`}
        </button>
        <div className="mt-3 space-y-1 text-center text-xs text-ink/45">
          <p className="flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Satisfait ou remboursé sous 30 jours
          </p>
          {offer.kind !== 'subscription' && <p>Débité sur la carte de votre commande, sans ressaisie.</p>}
        </div>
      </div>

      <button
        onClick={decline}
        disabled={busy}
        className="mt-4 mx-auto flex items-center gap-1 text-sm text-paper/50 hover:text-paper disabled:opacity-50"
      >
        <X className="w-4 h-4" /> Non merci, continuer vers mon Kit
      </button>
    </Layout>
  );
}
