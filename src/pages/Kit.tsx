import { useEffect, useState } from 'react';
import { Check, ShieldCheck, Loader2 } from 'lucide-react';
import Layout from '../components/Layout';
import { supabase, callFunction } from '../lib/supabase';
import { Product } from '../types';

const euros = (cents: number) => (cents / 100).toLocaleString('fr-FR') + ' €';

const KIT_INCLUDED = [
  'Argumentaire chiffré personnalisé (ton poste, ton marché, tes chiffres)',
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

  async function checkout(slugs: string[]) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Entre ton email (celui de ton analyse) pour continuer.');
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
        Transforme ton écart en <span className="text-gold italic">augmentation réelle</span>.
      </h1>
      <p className="mt-4 text-center text-paper/75 max-w-2xl mx-auto">
        La méthode et l'entraînement — pour ne plus jamais laisser d'argent sur la table.
      </p>

      {/* Email partagé */}
      <div className="mt-8 max-w-md mx-auto">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Ton email (celui de ton analyse)"
          className="w-full rounded-lg bg-ink border border-white/15 px-4 py-3 text-paper placeholder-paper/30 focus:border-gold focus:outline-none"
        />
        {error && <p className="text-ember text-sm font-semibold mt-2">{error}</p>}
      </div>

      {/* Cœur : Kit + order bump Agent Recruteur IA */}
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

      <div className="mt-10 text-paper/70 text-sm space-y-4">
        <h3 className="font-display text-xl font-bold text-paper">Questions fréquentes</h3>
        <p>
          <strong className="text-paper">Quelle différence entre les offres ?</strong> L'Argumentaire Éclair donne l'essentiel ;
          le Kit, le dossier complet ; l'Agent Recruteur IA t'entraîne face à un manager IA jusqu'à ce que ta demande soit parfaitement rodée.
        </p>
        <p>
          <strong className="text-paper">Est-ce adapté à mon métier ?</strong> Tout est généré à partir de ton analyse (poste,
          secteur, séniorité, région) : chiffres et arguments sont les tiens.
        </p>
        <p>
          <strong className="text-paper">Garantie.</strong> Satisfait ou remboursé sous 30 jours, sans justification.
        </p>
      </div>
    </Layout>
  );
}
