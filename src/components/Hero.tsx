import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star } from 'lucide-react';
import { SOCIAL_PROOF, SOCIAL_PROOF_MIN_COUNT } from '../lib/cro';
import { useAnalysesCount } from '../lib/useAnalysesCount';
import Testimonials from './Testimonials';
import Sources from './Sources';

const videoUrl = import.meta.env.VITE_HERO_VIDEO_URL as string | undefined;
const posterUrl = import.meta.env.VITE_HERO_POSTER_URL as string | undefined;
// Film HTML animé (export claude.ai/design) en iframe, ACTIVÉ PAR DÉFAUT.
// VITE_HERO_FILM_URL=off pour le désactiver, ou une URL pour le personnaliser.
const filmEnv = import.meta.env.VITE_HERO_FILM_URL as string | undefined;
const filmUrl = filmEnv === 'off' ? undefined : filmEnv || '/hero-film/index.html';

/**
 * Hero plein écran avec vidéo de fond (configurable via VITE_HERO_VIDEO_URL).
 * Repli sur un dégradé si aucune vidéo n'est fournie. Le CTA mène au
 * questionnaire de capture (/analyse).
 */
export default function Hero() {
  const count = useAnalysesCount();
  const statText =
    count != null && count >= SOCIAL_PROOF_MIN_COUNT
      ? `${count.toLocaleString('fr-FR')} analyses réalisées`
      : SOCIAL_PROOF.stat;

  // Chargement différé du film : le Hero (texte + CTA) s'affiche d'abord.
  const [showFilm, setShowFilm] = useState(false);
  useEffect(() => {
    if (!filmUrl) return;
    let cancelled = false;
    const w = window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const start = () => {
      if (!cancelled) setShowFilm(true);
    };
    const id = w.requestIdleCallback ? w.requestIdleCallback(start, { timeout: 1500 }) : window.setTimeout(start, 700);
    return () => {
      cancelled = true;
      if (w.requestIdleCallback && w.cancelIdleCallback) w.cancelIdleCallback(id);
      else clearTimeout(id);
    };
  }, []);

  return (
    <section className="border-b border-white/10">
      {/* 1) Titre + accroche */}
      <div className="max-w-3xl mx-auto px-4 pt-12 sm:pt-16 text-center">
        <p className="text-gold uppercase tracking-widest text-xs mb-4">Cadres &amp; métiers en tension</p>
        <h1 className="font-display text-3xl sm:text-5xl font-bold leading-tight">
          Es-tu assez payé pour ce que tu sais faire&nbsp;?
        </h1>
        <p className="mt-4 text-paper/80 text-lg max-w-xl mx-auto">
          Ton patron, lui, dirait oui. Découvre en 30 secondes l'écart réel entre ton salaire et le marché.
        </p>
      </div>

      {/* 2) La vidéo / le film, sous l'accroche */}
      <div className="relative w-full max-w-5xl mx-auto aspect-video bg-black overflow-hidden mt-8">
        <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink to-black" />
        {filmUrl && showFilm ? (
          <iframe
            src={filmUrl}
            title="Le Négociateur — film"
            className="absolute inset-0 w-full h-full border-0 pointer-events-none"
          />
        ) : !filmUrl && videoUrl ? (
          <video
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            poster={posterUrl}
          >
            <source src={videoUrl} />
          </video>
        ) : null}
      </div>

      {/* 3) CTA + réassurance + sources + note, après la vidéo */}
      <div className="max-w-3xl mx-auto px-4 pt-8 pb-12 sm:pb-16 text-center">
        <Link
          to="/analyse"
          className="bg-gold text-ink font-bold px-8 py-4 rounded-xl hover:brightness-105 transition inline-flex items-center gap-2"
        >
          Tester ma rémunération <ArrowRight className="w-5 h-5" />
        </Link>
        <p className="mt-3 text-xs text-paper/50">Gratuit · données sourcées · sans engagement</p>
        <Sources />
        <div className="mt-6 flex items-center justify-center gap-1 text-gold">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} className="w-4 h-4 fill-current" />
          ))}
          <span className="text-xs text-paper/60 ml-2">
            {SOCIAL_PROOF.rating} · {statText}
          </span>
        </div>
      </div>

      {/* 4) Bandeau de témoignages défilant — pleine largeur */}
      <Testimonials />
    </section>
  );
}
