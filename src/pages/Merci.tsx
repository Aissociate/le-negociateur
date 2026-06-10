import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { getFunction } from '../lib/supabase';

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
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-lg text-center">
        <CheckCircle2 className="mx-auto text-gold mb-6" size={56} />
        <h1 className="font-display text-3xl font-bold mb-4">Paiement confirmé. Bienvenue.</h1>
        <p className="text-paper/80 mb-8">
          Votre <strong>Kit de Négociation Offensif</strong> est en cours de génération
          personnalisée. Vous recevrez également le lien par email.
        </p>
        {kitUrl ? (
          <Link
            to={kitUrl}
            className="inline-block bg-gold text-ink font-bold px-8 py-4 rounded-lg hover:bg-gold/90 transition"
          >
            Accéder à mon Kit →
          </Link>
        ) : tries > 20 ? (
          <p className="text-paper/60 text-sm">
            La génération prend plus de temps que prévu — le lien arrive par email d'ici quelques
            minutes.
          </p>
        ) : (
          <p className="text-paper/60 animate-pulse">Génération en cours…</p>
        )}
      </div>
    </div>
  );
}
