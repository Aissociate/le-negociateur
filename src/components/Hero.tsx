import { ArrowRight } from 'lucide-react';

const videoUrl = import.meta.env.VITE_HERO_VIDEO_URL as string | undefined;
const posterUrl = import.meta.env.VITE_HERO_POSTER_URL as string | undefined;

/**
 * Hero plein écran avec vidéo de fond (configurable via VITE_HERO_VIDEO_URL).
 * Repli sur un dégradé si aucune vidéo n'est fournie. Le CTA défile vers le
 * questionnaire (ancre #questionnaire).
 */
export default function Hero() {
  const scrollToForm = () =>
    document.getElementById('questionnaire')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <section className="relative overflow-hidden border-b border-white/10">
      {videoUrl ? (
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
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink to-black" />
      )}
      {/* Voile pour la lisibilité */}
      <div className="absolute inset-0 bg-ink/70" />

      <div className="relative max-w-3xl mx-auto px-4 py-20 sm:py-28 text-center">
        <p className="text-gold uppercase tracking-widest text-xs mb-4">Cadres &amp; métiers en tension</p>
        <h1 className="font-display text-3xl sm:text-5xl font-bold leading-tight">
          Êtes-vous assez payé pour ce que vous savez faire&nbsp;?
        </h1>
        <p className="mt-4 text-paper/80 text-lg max-w-xl mx-auto">
          Votre patron, lui, dirait oui. Découvrez en 30 secondes l'écart réel entre votre salaire et le marché.
        </p>
        <button
          onClick={scrollToForm}
          className="mt-8 bg-gold text-ink font-bold px-8 py-4 rounded-xl hover:brightness-105 transition inline-flex items-center gap-2"
        >
          Tester ma rémunération <ArrowRight className="w-5 h-5" />
        </button>
        <p className="mt-3 text-xs text-paper/50">Gratuit · données sourcées · sans engagement</p>
      </div>
    </section>
  );
}
