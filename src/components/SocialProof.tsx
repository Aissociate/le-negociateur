import { Star } from 'lucide-react';
import { SOCIAL_PROOF } from '../lib/cro';

/** Bandeau de preuve sociale compact : note + un témoignage. */
export default function SocialProof({ index = 0 }: { index?: number }) {
  const t = SOCIAL_PROOF.testimonials[index % SOCIAL_PROOF.testimonials.length];
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1 text-gold">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} className="w-3.5 h-3.5 fill-current" />
        ))}
        <span className="text-xs text-paper/50 ml-1">
          {SOCIAL_PROOF.rating} · {SOCIAL_PROOF.stat}
        </span>
      </div>
      <blockquote className="text-sm text-paper/75 italic mt-2">« {t.quote} »</blockquote>
      <p className="text-xs text-paper/40 mt-0.5">— {t.author}</p>
    </div>
  );
}
