import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Sparkles } from 'lucide-react';
import Layout from '../components/Layout';
import { getFunction } from '../lib/supabase';
import { CAPTURE_EXPERIMENT, assignVariant, trackAB } from '../lib/ab';

export default function Merci() {
  const [params] = useSearchParams();
  const sessionId = params.get('session_id');
  const [kitUrl, setKitUrl] = useState<string | null>(null);
  const [tries, setTries] = useState(0);

  // La génération du Kit (webhook Stripe -> IA) prend quelques secondes : on poll.
  useEffect(() => {
    if (!sessionId || kitUrl || tries > 20) return;
    const t = setTimeout(async () => {
      try {
        const res = await getFunction<{ token: string | null }>('public-data', {
          order_session: sessionId,
        });
        if (res.token) {
          // Conversion : on attribue l'achat à la variante A/B du visiteur.
          trackAB(CAPTURE_EXPERIMENT.key, assignVariant(CAPTURE_EXPERIMENT).key, 'purchase');
          setKitUrl(`/kit/document/${res.token}`);
          return;
        }
      } catch {
        /* on retente */
      }
      setTries((n) => n + 1);
    }, 3000);
    return () => clearTimeout(t);
  }, [sessionId, kitUrl, tries]);

  return (
    <Layout narrow>
      <div className="text-center py-16">
        <CheckCircle2 className="mx-auto text-gold mb-6" size={56} />
        <h1 className="font-display text-3xl font-bold mb-3">Paiement confirmé 🎉</h1>
        <p className="text-paper/80 mb-8 max-w-lg mx-auto">
          Dernière étape pour un Kit <strong>vraiment sur-mesure</strong> : renseignez votre situation complète et vos
          réussites (3 min). Votre Kit sera régénéré avec tous ces éléments.
        </p>
        {sessionId && (
          <Link
            to={`/personnaliser?session=${sessionId}`}
            className="inline-flex items-center gap-2 bg-gold text-ink font-bold px-8 py-4 rounded-lg hover:brightness-105 transition"
          >
            <Sparkles className="w-5 h-5" /> Personnaliser mon Kit (3 min)
          </Link>
        )}
        <div className="mt-6">
          {kitUrl ? (
            <Link to={kitUrl} className="text-paper/60 text-sm underline hover:text-paper">
              ou accéder directement à mon Kit standard
            </Link>
          ) : (
            <p className="text-paper/40 text-xs">Votre Kit standard se prépare aussi (lien envoyé par email).</p>
          )}
        </div>
      </div>
    </Layout>
  );
}
