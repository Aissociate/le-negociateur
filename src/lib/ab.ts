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
      weight: 0, // parkée : remplacée par 'centime' (même angle asymétrie, plus incisif)
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
      weight: 0, // parkée : remplacée par 'voiture' (même angle manque à gagner, plus incisif)
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
      weight: 0, // parkée : remplacée par 'tension_force' (même angle, plus incisif)
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
    // --- Hooks direct-response ajoutés (charte réécriture, juillet 2026) ---
    {
      key: 'centime',
      weight: 1,
      content: {
        headline: 'Ton employeur connaît ta valeur au centime près. Toi, tu la devines.',
        subhead:
          "En 30 secondes, découvre l'écart exact entre ton salaire et le marché. Chiffré, sourcé, impossible à balayer d'un « ce n'est pas le moment ».",
        cta: 'Révéler mon écart de salaire',
        reassurance: 'Gratuit · sans inscription · INSEE / France Travail',
      },
    },
    {
      key: 'voiture',
      weight: 1,
      content: {
        headline: "Un salaire sous le marché, sur 5 ans, c'est une voiture. Neuve.",
        subhead:
          "Ton écart ne dort pas : il se cumule chaque année. Mesure-le en 30 secondes, données publiques à l'appui.",
        cta: 'Calculer mon manque à gagner',
        reassurance: 'Gratuit · chiffré · sans engagement',
      },
    },
    {
      key: 'an_prochain',
      weight: 1,
      content: {
        headline: "« Je demanderai l'an prochain » : l'erreur qui coûte le plus cher.",
        subhead:
          "Chaque année d'attente, l'écart grossit. Commence par le seul chiffre qui compte vraiment : le tien.",
        cta: 'Voir mon écart maintenant',
        reassurance: 'Gratuit · 30 secondes · sans inscription',
      },
    },
    {
      key: 'verite',
      weight: 1,
      content: {
        headline: 'Une entreprise ne te paie pas ce que tu vaux. Ce que tu acceptes.',
        subhead:
          'Tant que tu ne poses aucun chiffre sur la table, tu restes la variable la moins chère. Change de camp en 30 secondes.',
        cta: 'Poser mon chiffre sur la table',
        reassurance: 'Gratuit · sourcé INSEE / DARES / APEC · sans engagement',
      },
    },
    {
      key: 'dernier_arrive',
      weight: 1,
      content: {
        headline: "Le dernier arrivé gagne plus que toi ? Ce n'est peut-être pas un hasard.",
        subhead:
          'À poste égal, beaucoup de cadres ignorent où ils se situent face au marché. Sors du flou — il se paie.',
        cta: 'Voir mon positionnement',
        reassurance: 'Gratuit · 30 secondes · données publiques',
      },
    },
    {
      key: 'tension_force',
      weight: 1,
      content: {
        headline: "Ton métier est en tension. Ton salaire, lui, l'a-t-il remarqué ?",
        subhead:
          "Quand le marché s'arrache ton profil, le rapport de force change de camp. Encore faut-il pouvoir le chiffrer.",
        cta: 'Voir ce que vaut mon profil',
        reassurance: 'Données France Travail / DARES · 30 secondes',
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
