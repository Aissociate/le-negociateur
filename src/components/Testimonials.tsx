import { useEffect, useState } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { TESTIMONIALS } from '../lib/testimonials';

function initials(name: string): string {
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase();
}

/** Carrousel de témoignages auto-défilant (pause au survol). */
export default function Testimonials() {
  const n = TESTIMONIALS.length;
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setI((x) => (x + 1) % n), 4500);
    return () => clearInterval(id);
  }, [paused, n]);

  const go = (d: number) => setI((x) => (x + d + n) % n);
  const t = TESTIMONIALS[i];

  return (
    <div className="mt-10" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <p className="text-xs uppercase tracking-widest text-paper/40 mb-3">Ils ont négocié — et gagné</p>

      <div className="relative max-w-xl mx-auto">
        <div key={i} className="ln-fade bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-6 text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gold/15 text-gold font-bold flex items-center justify-center shrink-0">
              {initials(t.name)}
            </div>
            <div className="min-w-0">
              <div className="flex gap-0.5 text-gold">
                {[0, 1, 2, 3, 4].map((k) => (
                  <Star key={k} className="w-3.5 h-3.5 fill-current" />
                ))}
              </div>
              <p className="text-sm font-semibold truncate">
                {t.name} · <span className="text-paper/55 font-normal">{t.role}</span>
              </p>
            </div>
            <span className="ml-auto shrink-0 bg-gold text-ink text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap">
              {t.gain}
            </span>
          </div>
          <blockquote className="mt-3 text-paper/85 text-[15px] leading-relaxed">« {t.quote} »</blockquote>
        </div>

        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Précédent"
          className="absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-ink border border-white/15 text-paper/60 hover:text-paper flex items-center justify-center"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Suivant"
          className="absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-ink border border-white/15 text-paper/60 hover:text-paper flex items-center justify-center"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-wrap justify-center gap-1.5 mt-4 max-w-xs mx-auto">
        {TESTIMONIALS.map((_, k) => (
          <button
            key={k}
            type="button"
            aria-label={`Témoignage ${k + 1}`}
            onClick={() => setI(k)}
            className={`h-1.5 rounded-full transition-all ${k === i ? 'w-4 bg-gold' : 'w-1.5 bg-white/20 hover:bg-white/40'}`}
          />
        ))}
      </div>
    </div>
  );
}
