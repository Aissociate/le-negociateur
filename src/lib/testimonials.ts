// =====================================================================
// Témoignages du carrousel d'accueil.
// ⚠️ Avis ILLUSTRATIFS (gains indicatifs) — à remplacer par de VRAIS avis
// avant la mise en production (honnêteté publicitaire, voir CONFORMITE.md).
// Équilibre hommes/femmes et accords grammaticaux respectés.
// =====================================================================

export interface Testimonial {
  name: string; // prénom + initiale, ex. "Paul K."
  role: string;
  quote: string;
  gain: string; // badge mis en avant
}

export const TESTIMONIALS: Testimonial[] = [
  { name: 'Paul K.', role: 'Directeur commercial', gain: '+12 %', quote: "Arrivé avec l'argumentaire chiffré du Kit, j'ai obtenu +12 % en un seul entretien." },
  { name: 'Camille K.', role: 'Directrice marketing', gain: '+9 %', quote: "+9 % en arrivant préparée, sans stress — merci les scripts mot à mot." },
  { name: 'Karim B.', role: 'Ingénieur DevOps', gain: '+8 000 € net', quote: "J'étais 14 % sous le marché sans le savoir. Résultat : +8 000 € net par an." },
  { name: 'Sophie L.', role: 'Responsable RH', gain: '+7 200 € net', quote: "J'étais sous-payée de 16 %. J'ai récupéré +7 200 € net." },
  { name: 'Thomas L.', role: 'Chef de projet IT', gain: 'Télétravail + 9 %', quote: "Le simulateur d'entretien m'a mis en confiance : +9 % et 3 jours de télétravail." },
  { name: 'Laura B.', role: 'Cheffe de produit', gain: '+13 %', quote: "L'entraînement face au « manager IA » a changé ma posture : +13 % validés." },
  { name: 'Mehdi R.', role: 'Data scientist', gain: '+6 500 € net', quote: "Préparé, chiffres en main : +6 500 € net dès la première demande." },
  { name: 'Inès M.', role: "Juriste d'entreprise", gain: '+5 % + clause', quote: "+5 % la première année, puis une clause de revoyure datée. Le plan B du Kit, parfait." },
  { name: 'Antoine D.', role: 'Responsable supply chain', gain: '+7 % + prime', quote: "Je n'osais pas négocier. Avec la méthode : +7 % et une prime de 4 000 €." },
  { name: 'Marie D.', role: 'Auditrice financière', gain: '+10 500 € net', quote: "Chiffres du marché à l'appui : +10 500 € net obtenus, calmement." },
  { name: 'Julien P.', role: 'Ingénieur cybersécurité', gain: '+24 %', quote: "Métier en tension, le rapport l'a prouvé noir sur blanc : +24 % sur mon salaire." },
  { name: 'Chloé P.', role: 'Responsable communication', gain: 'Voiture + 8 %', quote: "Je négociais à l'aveugle. +8 % et la voiture de fonction en prime." },
  { name: 'Nicolas V.', role: 'Contrôleur de gestion', gain: '+5 000 € net', quote: "Les scripts ont géré toutes les objections de mon manager : +5 000 € net." },
  { name: 'Émilie R.', role: 'Ingénieure qualité', gain: '+6 % + formation', quote: "+6 % et une formation certifiante financée, grâce aux leviers hors salaire du Kit." },
  { name: 'Hugo M.', role: 'Product manager', gain: 'Promotion + 11 %', quote: "L'IA d'entraînement, bluffante : passage cadre confirmé et +11 %." },
  { name: 'Sarah V.', role: 'Acheteuse', gain: '+11 000 € net', quote: "Entraînée face au recruteur IA, j'ai tenu mon chiffre jusqu'au bout : +11 000 € net." },
  { name: 'Sébastien T.', role: 'Responsable commercial', gain: '+18 %', quote: "Arrivé serein et factuel, j'ai décroché +18 % et un bonus annuel négocié." },
  { name: 'Manon T.', role: "Responsable d'agence", gain: '+42 %', quote: "+42 % en changeant de poste, mon dossier de positionnement chiffré sous le bras." },
  { name: 'Romain G.', role: 'Ingénieur R&D', gain: '+4 800 € net', quote: "+4 800 € net et 8 jours de congés en plus, sans aucun bras de fer." },
  { name: 'Léa G.', role: 'Responsable comptabilité', gain: '4 jours/sem + 7 %', quote: "+7 % et le passage à la semaine de 4 jours, sans culpabiliser une seconde." },
];
