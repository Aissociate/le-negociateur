import { useEffect, useState } from 'react';
import { TrendingUp } from 'lucide-react';

// Notification de preuve sociale (CRO). ⚠️ ILLUSTRATIF : les notifications doivent
// refléter une activité RÉELLE avant mise en production (honnêteté publicitaire,
// cf. CONFORMITE.md). Les montants/pourcentages sont des ordres de grandeur indicatifs.
const VILLES = ['Lyon', 'Paris', 'Nantes', 'Bordeaux', 'Lille', 'Toulouse', 'Rennes', 'Strasbourg', 'Marseille', 'Nice', 'Montpellier', 'Grenoble'];
const PRENOMS = ['Camille', 'Thomas', 'Sarah', 'Julien', 'Hélène', 'Marc', 'Inès', 'Nicolas', 'Chloé', 'Karim', 'Sophie', 'Antoine'];
const MONTANTS = [3200, 4800, 5600, 6500, 7800, 9400, 11200, 12600];
const POURCENTS = [6, 8, 9, 11, 12, 14, 15];
const DELAIS = ['à l’instant', 'il y a 2 min', 'il y a 4 min', 'il y a 7 min'];

export default function SocialProofToaster() {
  const [item, setItem] = useState<{ name: string; city: string; figure: string; when: string } | null>(null);

  useEffect(() => {
    let i = 2;
    const tick = () => {
      const name = PRENOMS[(i * 5) % PRENOMS.length];
      const city = VILLES[(i * 3) % VILLES.length];
      const figure =
        i % 2 === 0
          ? `${MONTANTS[(i * 2) % MONTANTS.length].toLocaleString('fr-FR')} €`
          : `${POURCENTS[(i * 2) % POURCENTS.length]} %`;
      const when = DELAIS[i % DELAIS.length];
      i++;
      setItem({ name, city, figure, when });
      window.setTimeout(() => setItem(null), 5500);
    };
    const first = window.setTimeout(tick, 7000);
    const iv = window.setInterval(tick, 19000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(iv);
    };
  }, []);

  if (!item) return null;
  return (
    <div className="fixed bottom-4 left-4 z-30 max-w-[17rem] rounded-xl border border-white/10 bg-ink/95 backdrop-blur px-4 py-3 shadow-xl shadow-black/40">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-gold/20 text-gold">
          <TrendingUp className="h-4 w-4" />
        </span>
        <div className="text-sm">
          <p className="text-paper/90">
            <strong>{item.name}</strong> à {item.city} a généré son Kit pour négocier au moins{' '}
            <strong className="text-gold">{item.figure}</strong> de plus.
          </p>
          <p className="text-xs text-paper/40">{item.when}</p>
        </div>
      </div>
    </div>
  );
}
