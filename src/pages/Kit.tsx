import { useState } from 'react';
import { Check, ShieldCheck } from 'lucide-react';
import { callFunction } from '../lib/supabase';

const INCLUDED = [
  'Rapport de positionnement complet et personnalisé (votre poste, votre marché, vos chiffres)',
  'Stratégie de négociation offensive en 5 étapes, adaptée à votre situation',
  'Scripts mot à mot : demande d’entretien, annonce du chiffre, silence stratégique',
  'Contre-arguments aux 12 objections les plus fréquentes des employeurs français',
  'Plan B : leviers hors salaire (variable, télétravail, formation, clause de revoyure)',
  'Modèle d’email de suivi post-entretien qui verrouille les engagements',
];

export default function Kit() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function checkout(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { url } = await callFunction<{ url: string }>('create-checkout', { email });
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création du paiement.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen max-w-3xl mx-auto px-6 py-14">
      <p className="text-gold tracking-widest uppercase text-sm mb-3 text-center">
        Le Kit de Négociation Offensif
      </p>
      <h1 className="font-display text-4xl md:text-5xl font-bold text-center leading-tight">
        Un entretien de 45 minutes peut valoir
        <span className="text-gold italic"> des dizaines de milliers d'euros</span> sur 5 ans.
      </h1>
      <p className="mt-6 text-center text-paper/80 text-lg max-w-2xl mx-auto">
        La plupart des cadres ne négocient pas, ou négocient mal — par manque de méthode, pas par
        manque de valeur. Le Kit vous donne la méthode, les chiffres et les mots.
      </p>

      <div className="mt-12 bg-paper text-ink rounded-2xl p-8">
        <h2 className="font-display text-2xl font-bold mb-6">Ce que contient votre Kit (PDF personnalisé)</h2>
        <ul className="space-y-3">
          {INCLUDED.map((item) => (
            <li key={item} className="flex gap-3">
              <Check className="text-gold shrink-0 mt-1" size={18} />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <div className="mt-8 border-t border-ink/10 pt-8">
          <div className="text-center mb-6">
            <p className="font-display text-4xl font-bold">79 €</p>
            <p className="text-ink/60 text-sm">
              Paiement unique · Livraison immédiate · Généré pour votre situation
            </p>
          </div>
          <form onSubmit={checkout} className="space-y-3 max-w-md mx-auto">
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Votre email (celui de votre analyse)"
              className="w-full rounded-lg border border-ink/20 px-4 py-3 bg-white"
            />
            {error && <p className="text-ember text-sm font-semibold">{error}</p>}
            <button
              disabled={loading}
              className="w-full bg-ink text-paper font-bold py-4 rounded-lg hover:bg-ink/90 transition disabled:opacity-50"
            >
              {loading ? 'Redirection vers le paiement…' : 'Obtenir mon Kit maintenant →'}
            </button>
            <p className="text-center text-xs text-ink/50 flex items-center justify-center gap-1">
              <ShieldCheck size={13} /> Paiement sécurisé Stripe · Satisfait ou remboursé 30 jours
            </p>
          </form>
        </div>
      </div>

      <div className="mt-10 text-paper/70 text-sm space-y-4">
        <h3 className="font-display text-xl font-bold text-paper">Questions fréquentes</h3>
        <p>
          <strong className="text-paper">Et si ma demande est refusée ?</strong> Le Kit inclut le
          plan B complet : leviers hors salaire et clause de revoyure pour transformer un « non »
          en « pas encore, mais ».
        </p>
        <p>
          <strong className="text-paper">Est-ce adapté à mon métier ?</strong> Le Kit est généré à
          partir de votre analyse (poste, secteur, séniorité, région) : chiffres et arguments sont
          les vôtres, pas des généralités.
        </p>
        <p>
          <strong className="text-paper">Garantie.</strong> Si le Kit ne vous semble pas à la
          hauteur, écrivez-nous sous 30 jours : remboursement intégral, sans justification.
        </p>
      </div>
    </div>
  );
}
