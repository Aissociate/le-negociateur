import { Star } from 'lucide-react';
import { TESTIMONIALS, Testimonial } from '../lib/testimonials';

function initials(name: string): string {
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase();
}

/** Bandeau de témoignages défilant en continu (pause au survol). */
export default function Testimonials() {
  // Doublé pour une boucle sans couture (translateX -50% = une série).
  const loop = [...TESTIMONIALS, ...TESTIMONIALS];
  return (
    <div className="py-8 border-t border-white/10">
      <p className="text-xs uppercase tracking-widest text-paper/40 mb-4 text-center">Ils ont négocié — et gagné</p>
      <div className="overflow-hidden marquee-mask">
        <div className="marquee-track gap-4 px-2">
          {loop.map((t, idx) => (
            <Card key={idx} t={t} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Card({ t }: { t: Testimonial }) {
  return (
    <figure className="w-[300px] sm:w-[330px] shrink-0 bg-white/[0.03] border border-white/10 rounded-2xl p-4">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-full bg-gold/15 text-gold text-sm font-bold flex items-center justify-center shrink-0">
          {initials(t.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex gap-0.5 text-gold">
            {[0, 1, 2, 3, 4].map((k) => (
              <Star key={k} className="w-3 h-3 fill-current" />
            ))}
          </div>
          <p className="text-xs font-semibold truncate">
            {t.name} · <span className="text-paper/55 font-normal">{t.role}</span>
          </p>
        </div>
        <span className="bg-gold text-ink text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
          {t.gain}
        </span>
      </div>
      <blockquote className="mt-2.5 text-paper/80 text-sm leading-snug line-clamp-3">« {t.quote} »</blockquote>
    </figure>
  );
}
