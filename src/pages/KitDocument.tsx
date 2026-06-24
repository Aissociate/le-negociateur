import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Printer } from 'lucide-react';
import { getFunction } from '../lib/supabase';
import Markdown from '../components/Markdown';

interface Deliverable {
  content_md: string;
  type?: string;
  created_at: string;
}

/**
 * Affiche le Kit généré. Le bouton « Télécharger en PDF » utilise l'impression
 * navigateur (CSS print) — pas de dépendance PDF côté client.
 */
export default function KitDocument() {
  const { token } = useParams();
  const [doc, setDoc] = useState<Deliverable | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    getFunction<Deliverable>('public-data', { kit: token })
      .then(setDoc)
      .catch(() => setError('Document introuvable. Vérifiez le lien reçu par email.'));
  }, [token]);

  if (error) {
    return <div className="min-h-screen flex items-center justify-center px-6 text-center">{error}</div>;
  }
  if (!doc) {
    return <div className="min-h-screen flex items-center justify-center text-paper/60">Chargement…</div>;
  }

  return (
    <div className="min-h-screen bg-white text-ink">
      <div className="no-print sticky top-0 bg-ink text-paper px-6 py-3 flex items-center justify-between">
        <span className="font-display font-bold">Le Négociateur — Kit de Négociation</span>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-gold text-ink font-bold px-4 py-2 rounded-lg"
        >
          <Printer size={16} /> Télécharger en PDF
        </button>
      </div>
      <div className="max-w-3xl mx-auto px-6 sm:px-8 py-12">
        <Markdown>{doc.content_md}</Markdown>
        <p className="mt-12 text-xs text-ink/40 border-t pt-4">
          Document personnel généré le {new Date(doc.created_at).toLocaleDateString('fr-FR')} — estimations
          indicatives, ne constitue pas un conseil juridique ou financier.
        </p>
      </div>
    </div>
  );
}
