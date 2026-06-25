// =====================================================================
// A/B testing du copywriting de capture (client-side, best-effort).
// Les variantes par défaut ci-dessous peuvent être surchargées plus tard
// par le back-office (table ab_experiments, lue via la fonction public-data).
// L'assignation est persistée en localStorage pour rester stable par visiteur.
// =====================================================================
import { callFunction } from './supabase';

export interface Variant {
  key: string;
  weight: number;
  content: Record<string, string>;
}

export interface Experiment {
  key: string;
  variants: Variant[];
}

// Variantes par défaut de la capture email. Pitch central : « Ton patron dirait oui ».
export const CAPTURE_EXPERIMENT: Experiment = {
  key: 'capture_copy',
  variants: [
    {
      key: 'patron',
      weight: 1,
      content: {
        headline: 'Es-tu assez payé pour ce que tu sais faire ?',
        subhead:
          "Ton patron, lui, dirait oui. Découvre en 30 secondes l'écart réel entre ton salaire et le marché.",
        cta: 'Révéler mon écart de salaire',
        reassurance: 'Gratuit · données sourcées · sans engagement',
      },
    },
    {
      key: 'marche',
      weight: 1,
      content: {
        headline: 'Ton salaire est-il vraiment à la hauteur du marché ?',
        subhead:
          "Des milliers de cadres sont sous-payés sans le savoir. Vois précisément où tu te situes.",
        cta: 'Voir mon positionnement',
        reassurance: 'Analyse gratuite · 30 secondes · données 2025',
      },
    },
    {
      key: 'argent',
      weight: 1,
      content: {
        headline: 'Combien laisses-tu sur la table chaque année ?',
        subhead:
          "Un salaire sous le marché se cumule : sur 5 ans, l'écart se chiffre souvent en dizaines de milliers d'euros.",
        cta: 'Calculer mon manque à gagner',
        reassurance: 'Gratuit · chiffré · sans engagement',
      },
    },
    {
      key: 'tension',
      weight: 1,
      content: {
        headline: 'Ton métier est en tension. Ton salaire le reflète-t-il ?',
        subhead:
          'Quand le marché manque de profils comme le tien, le rapport de force change. Vois ce que tu vaux vraiment.',
        cta: 'Voir ce que vaut mon profil',
        reassurance: 'Données France Travail / INSEE · 30 secondes',
      },
    },
    {
      key: 'preparation',
      weight: 1,
      content: {
        headline: 'Prépare ta prochaine augmentation avec les bons chiffres.',
        subhead:
          'La différence entre ceux qui obtiennent une hausse et les autres ? La méthode et les données. Commence par les tiennes.',
        cta: 'Obtenir mes chiffres',
        reassurance: 'Gratuit · sourcé · sans engagement',
      },
    },
  ],
};

function storageKey(experiment: string): string {
  return `ln_ab_${experiment}`;
}

/** Tirage pondéré déterministe-par-visiteur : on persiste le 1er tirage. */
export function assignVariant(experiment: Experiment): Variant {
  const stored =
    typeof localStorage !== 'undefined' ? localStorage.getItem(storageKey(experiment.key)) : null;
  if (stored) {
    const found = experiment.variants.find((v) => v.key === stored);
    if (found) return found;
  }
  const total = experiment.variants.reduce((s, v) => s + v.weight, 0);
  let r = Math.random() * total;
  let chosen = experiment.variants[0];
  for (const v of experiment.variants) {
    r -= v.weight;
    if (r <= 0) {
      chosen = v;
      break;
    }
  }
  try {
    localStorage.setItem(storageKey(experiment.key), chosen.key);
  } catch {
    /* localStorage indisponible : on continue sans persistance */
  }
  return chosen;
}

export type ABEvent = 'view' | 'capture' | 'purchase';

/** Envoi best-effort d'un évènement A/B (n'interrompt jamais le funnel). */
export function trackAB(
  experimentKey: string,
  variantKey: string,
  event: ABEvent
): void {
  callFunction('ab-track', { experiment_key: experimentKey, variant_key: variantKey, event }).catch(
    () => {
      /* tracking best-effort : on ignore les erreurs */
    }
  );
}
