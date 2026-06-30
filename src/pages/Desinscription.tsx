import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import Layout from '../components/Layout';
import { callFunction } from '../lib/supabase';

export default function Desinscription() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [state, setState] = useState<'loading' | 'done' | 'error'>('loading');

  useEffect(() => {
    if (!token) {
      setState('error');
      return;
    }
    callFunction('prospect-unsubscribe', { token })
      .then(() => setState('done'))
      .catch(() => setState('error'));
  }, [token]);

  return (
    <Layout narrow>
      <div className="text-center py-20">
        {state === 'loading' && <Loader2 className="w-8 h-8 animate-spin mx-auto text-paper/40" />}
        {state === 'done' && (
          <>
            <CheckCircle2 className="w-12 h-12 text-gold mx-auto mb-4" />
            <h1 className="font-display text-2xl font-bold">Tu es bien désinscrit·e</h1>
            <p className="text-paper/60 mt-2">
              Tu ne recevras plus aucun email de notre part. Désolé pour le dérangement.
            </p>
          </>
        )}
        {state === 'error' && (
          <>
            <AlertTriangle className="w-10 h-10 text-ember mx-auto mb-4" />
            <p className="text-paper/60">Lien de désinscription invalide ou expiré.</p>
          </>
        )}
      </div>
    </Layout>
  );
}
