import { useEffect, useState } from 'react';
import { TrendingUp } from 'lucide-react';

// Notification de preuve sociale (CRO). ⚠️ ILLUSTRATIF : les notifications doivent
// refléter une activité RÉELLE avant mise en production (honnêteté publicitaire,
// cf. CONFORMITE.md). Volontairement formulé sur la génération d'analyse (gratuite,
// plausible) et non sur un achat.
const VILLES = ['Lyon', 'Paris', 'Nantes', 'Bordeaux', 'Lille', 'Toulouse', 'Rennes', 'Strasbourg', 'Marseille', 'Nice', 'Montpellier', 'Grenoble'];
const PRENOMS = ['Camille', 'Thomas', 'Sarah', 'Julien', 'Léa', 'Marc', 'Inès', 'Nicolas', 'Chloé', 'Karim', 'Sophie', 'Antoine'];
const DELAIS = ['à l’instant', 'il y a 2 min', 'il y a 4 min', 'il y a 7 min'];

export default function SocialProofToaster() {
  const [item, setItem] = useState<{ name: string; city: string; when: string } | null>(null);

  useEffect(() => {
    let i = 2;
    const tick = () => {
      const name = PRENOMS[(i * 5) % PRENOMS.length];
      const city = VILLES[(i * 3) % VILLES.length];
      const when = DELAIS[i % DELAIS.length];
      i++;
      setItem({ name, city, when });
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
            <strong>{item.name}</strong> à {item.city} vient de générer son analyse de salaire.
          </p>
          <p className="text-xs text-paper/40">{item.when}</p>
        </div>
      </div>
    </div>
  );
}
