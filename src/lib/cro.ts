// =====================================================================
// Contenu de conversion (preuve sociale). ⚠️ IMPORTANT — honnêteté publicitaire :
// remplacez ces avis et chiffres par de VRAIS avis/chiffres avant la mise en
// production (obligation légale, voir CONFORMITE.md). Structure prête à l'emploi.
// =====================================================================

export const SOCIAL_PROOF = {
  rating: '4,8/5',
  // Remplacer par un chiffre réel (ex. nombre d'analyses générées).
  stat: 'des milliers de cadres déjà analysés',
  testimonials: [
    { quote: "Je suis arrivé préparé, chiffres en main — résultat : +9 % obtenus en un entretien.", author: 'Camille, Directrice marketing' },
    { quote: "Le rapport m'a ouvert les yeux sur mon vrai prix de marché. J'étais 14 % sous la médiane.", author: 'Karim, Ingénieur DevOps' },
    { quote: 'Méthode claire, scripts prêts à l’emploi. Je ne négocierai plus jamais sans.', author: 'Sophie, Contrôleuse de gestion' },
  ],
};

// Seuil à partir duquel on affiche le compteur RÉEL d'analyses (en dessous, on
// garde le texte générique pour éviter un chiffre peu flatteur au démarrage).
export const SOCIAL_PROOF_MIN_COUNT = 100;

export const TRUST_BADGES = [
  'Données publiques sourcées (INSEE · DARES · APEC)',
  'Sans spam · désinscription en 1 clic',
  'Tes données ne sont jamais revendues',
];
