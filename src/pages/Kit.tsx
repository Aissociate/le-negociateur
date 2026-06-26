import { useEffect, useState } from 'react';
import { Check, ShieldCheck, Loader2, Crown, Zap, Repeat } from 'lucide-react';
import Layout from '../components/Layout';
import { supabase, callFunction } from '../lib/supabase';
import { Product } from '../types';

const euros = (cents: number) => (cents / 100).toLocaleString('fr-FR') + ' €';

const KIT_INCLUDED = [
  'Argumentaire chiffré personnalisé (votre poste, votre marché, vos chiffres)',
  'Stratégie de négociation en 5 étapes',
  'Scripts mot à mot : demande, annonce du chiffre, silence, conclusion',
  'Réponses aux 12 objections les plus fréquentes',
  'Plan B hors salaire + email de verrouillage post-entretien',
];

export default function Kit() {
  const [products, setProducts] = useState<Product[]>([]);
  const [email, setEmail] = useState('');
  const [addSimu, setAddSimu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('position')
      .then(({ data }) => setProducts((data as Product[]) ?? []));
  }, []);

  const p = (slug: string) => products.find((x) => x.slug === slug);
  const kit = p('kit');
  const simu = p('simulateur');
  const eclair = p('argumentaire-eclair');
  const pack = p('pack-carriere');
  const bouclier = p('bouclier');

  async function checkout(slugs: string[]) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Entrez votre email (celui de votre analyse) pour continuer.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { url } = await callFunction<{ url: string }>('create-checkout', { email, product_slugs: slugs });
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la création du paiement.');
      setLoading(false);
    }
  }

  const kitTotal = (kit?.price_cents ?? 0) + (addSimu && simu ? simu.price_cents : 0);

  return (
    <Layout narrow>
      <p className="text-gold tracking-widest uppercase text-xs mb-3 text-center">Passez à l'action</p>
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-center leading-tight">
        Transformez votre écart en <span className="text-gold italic">augmentation réelle</span>.
      </h1>
      <p className="mt-4 text-center text-paper/75 max-w-2xl mx-auto">
        La méthode, l'entraînement et la veille — pour ne plus jamais laisser d'argent sur la table.
      </p>

      {/* Email partagé */}
      <div className="mt-8 max-w-md mx-auto">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Votre email (celui de votre analyse)"
          className="w-full rounded-lg bg-ink border border-white/15 px-4 py-3 text-paper placeholder-paper/30 focus:border-gold focus:outline-none"
        />
        {error && <p className="text-ember text-sm font-semibold mt-2">{error}</p>}
      </div>

      {/* Bundle — mis en avant */}
      {pack && (
        <div className="mt-8 rounded-2xl border-2 border-gold bg-gradient-to-br from-gold/15 to-ember/10 p-6 relative">
          <span className="absolute -top-3 left-6 bg-gold text-ink text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
            <Crown className="w-3.5 h-3.5" /> MEILLEURE VALEUR
          </span>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold">{pack.name}</h2>
              <p className="text-paper/70 text-sm mt-1">{pack.description_md}</p>
              <ul className="mt-3 space-y-1.5 text-sm">
                <li className="flex gap-2"><Zap className="w-4 h-4 text-gold shrink-0 mt-0.5" /> Le Kit de Négociation complet</li>
                <li className="flex gap-2"><Zap className="w-4 h-4 text-gold shrink-0 mt-0.5" /> Le Simulateur d'Entretien (entraînement illimité)</li>
                <li className="flex gap-2"><Repeat className="w-4 h-4 text-gold shrink-0 mt-0.5" /> 12 mois de Bouclier (veille + alertes + régénération)</li>
              </ul>
            </div>
            <div className="text-right shrink-0">
              <p className="font-display text-3xl font-bold text-gold">{euros(pack.price_cents)}</p>
              {pack.compare_at_cents && <p className="text-sm text-paper/40 line-through">{euros(pack.compare_at_cents)}</p>}
            </div>
          </div>
          <button
            onClick={() => checkout(['pack-carriere'])}
            disabled={loading}
            className="mt-4 w-full bg-gold text-ink font-bold py-3.5 rounded-xl hover:brightness-105 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />} Je prends le Pack Carrière
          </button>
        </div>
      )}

      {/* Cœur : Kit + order bump Simulateur */}
      <div className="mt-6 bg-paper text-ink rounded-2xl p-6 sm:p-7">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-xl font-bold">{kit?.name ?? 'Le Kit de Négociation'}</h2>
          <p className="font-display text-2xl font-bold">
            {kit ? euros(kit.price_cents) : '—'}
            {kit?.compare_at_cents && <span className="ml-2 text-base text-ink/40 line-through font-normal">{euros(kit.compare_at_cents)}</span>}
          </p>
        </div>
        <ul className="mt-4 space-y-2">
          {KIT_INCLUDED.map((f) => (
            <li key={f} className="flex gap-2 text-sm">
              <Check className="w-4 h-4 text-gold shrink-0 mt-0.5" /> {f}
            </li>
          ))}
        </ul>

        {simu && (
          <label className="flex items-start gap-3 mt-5 rounded-xl border-2 border-dashed border-gold/60 bg-gold/5 p-4 cursor-pointer">
            <input type="checkbox" checked={addSimu} onChange={(e) => setAddSimu(e.target.checked)} className="mt-1" />
            <span className="text-sm">
              <strong>Ajouter {simu.name} (+{euros(simu.price_cents)})</strong>
              <span className="block text-ink/60">{simu.description_md}</span>
            </span>
          </label>
        )}

        <button
          onClick={() => checkout(['kit', ...(addSimu && simu ? ['simulateur'] : [])])}
          disabled={loading || !kit}
          className="mt-5 w-full bg-ink text-paper font-bold py-3.5 rounded-xl hover:bg-ink/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />} Obtenir mon Kit — {euros(kitTotal)}
        </button>
        <p className="mt-3 text-center text-xs text-ink/50 flex items-center justify-center gap-1">
          <ShieldCheck size={13} /> Paiement sécurisé Stripe · Satisfait ou remboursé 30 jours
        </p>
      </div>

      {/* Downsell */}
      {eclair && (
        <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.02] px-5 py-4">
          <div>
            <p className="text-sm font-semibold">Budget plus serré ? {eclair.name} — {euros(eclair.price_cents)}</p>
            <p className="text-xs text-paper/50">{eclair.description_md}</p>
          </div>
          <button
            onClick={() => checkout(['argumentaire-eclair'])}
            disabled={loading}
            className="text-sm font-bold text-gold whitespace-nowrap hover:underline disabled:opacity-50"
          >
            Choisir →
          </button>
        </div>
      )}

      {/* Bouclier (récurrence) — embarqué dans le Pack, abonnement dédié à venir */}
      {bouclier && (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] px-5 py-4">
          <div className="flex items-start gap-3">
            <Repeat className="w-5 h-5 text-gold shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold">{bouclier.name} — {euros(bouclier.price_cents)}/mois</p>
              <p className="text-xs text-paper/60">{bouclier.description_md} (inclus 12 mois dans le Pack Carrière).</p>
            </div>
            <button
              onClick={() => checkout(['bouclier'])}
              disabled={loading}
              className="text-sm font-bold text-gold whitespace-nowrap hover:underline disabled:opacity-50"
            >
              S'abonner →
            </button>
          </div>
        </div>
      )}

      <div className="mt-10 text-paper/70 text-sm space-y-4">
        <h3 className="font-display text-xl font-bold text-paper">Questions fréquentes</h3>
        <p>
          <strong className="text-paper">Quelle différence entre les offres ?</strong> L'Argumentaire Éclair donne l'essentiel ;
          le Kit, le dossier complet ; le Simulateur vous entraîne ; le Bouclier vous garde armé dans la durée. Le Pack réunit tout.
        </p>
        <p>
          <strong className="text-paper">Est-ce adapté à mon métier ?</strong> Tout est généré à partir de votre analyse (poste,
          secteur, séniorité, région) : chiffres et arguments sont les vôtres.
        </p>
        <p>
          <strong className="text-paper">Garantie.</strong> Satisfait ou remboursé sous 30 jours, sans justification.
        </p>
      </div>
    </Layout>
  );
}
