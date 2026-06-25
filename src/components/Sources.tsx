import { useState } from 'react';

// Bande « sources officielles » sous le CTA. Dépose les logos dans
// public/logos/ (insee.png, apec.png, dares.png, france-travail.png) ;
// en attendant, un repli texte propre s'affiche.
const SOURCES = [
  { slug: 'insee', label: 'INSEE' },
  { slug: 'apec', label: 'APEC' },
  { slug: 'dares', label: 'DARES' },
  { slug: 'france-travail', label: 'France Travail' },
];

export default function Sources() {
  return (
    <div className="mt-6">
      <p className="text-[11px] uppercase tracking-widest text-paper/35 mb-3">Données publiques officielles</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {SOURCES.map((s) => (
          <SourceLogo key={s.slug} slug={s.slug} label={s.label} />
        ))}
      </div>
    </div>
  );
}

function SourceLogo({ slug, label }: { slug: string; label: string }) {
  const [broken, setBroken] = useState(false);
  return (
    <div className="bg-white rounded-lg px-3 flex items-center justify-center h-12 min-w-[92px]">
      {broken ? (
        <span className="text-ink font-bold text-sm">{label}</span>
      ) : (
        <img src={`/logos/${slug}.png`} alt={label} onError={() => setBroken(true)} className="max-h-8 w-auto" />
      )}
    </div>
  );
}
