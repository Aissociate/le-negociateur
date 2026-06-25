// Options et configurations du questionnaire détaillé de personnalisation du Kit.

export const ANNEES_NAISSANCE = Array.from({ length: 2008 - 1950 + 1 }, (_, i) => String(2008 - i));

export const TYPES_CONTRAT = [
  'CDI',
  'CDD',
  'Intérim',
  'Freelance / Indépendant',
  'Alternance',
  'Fonction publique',
  'Autre',
];

export const METIERS = [
  'Ingénieur logiciel / Développeur',
  'Data scientist / Data analyst',
  'Ingénieur DevOps / Cloud',
  'Ingénieur cybersécurité',
  'Chef de projet informatique',
  'Product manager',
  'Responsable des systèmes d’information',
  'Ingénieur d’affaires / Commercial B2B',
  'Responsable commercial',
  'Responsable marketing',
  'Chef de produit marketing',
  'Responsable communication',
  'Contrôleur de gestion',
  'Responsable comptabilité',
  'Auditeur / Consultant financier',
  'Responsable ressources humaines',
  'Juriste d’entreprise',
  'Ingénieur qualité',
  'Ingénieur production / Méthodes',
  'Ingénieur R&D',
  'Responsable supply chain / Logistique',
  'Acheteur / Responsable achats',
  'Responsable d’agence / Centre de profit',
  'Autre',
];

export const STATUTS = ['Cadre', 'Cadre dirigeant', 'Agent de maîtrise', 'Employé', 'Ouvrier'];

export const NATURES_RESPONSABILITES = [
  'Contributeur individuel / opérationnel',
  'Encadrement d’équipe',
  'Management de managers',
  'Expertise / référent technique',
  'Direction de business unit',
  'Direction générale',
  'Gestion de projet transverse',
];

export const PERIMETRES = [
  'Une équipe / un service',
  'Un site / établissement',
  'Une région',
  'National',
  'International',
  'Le groupe entier',
];

export const NIVEAUX_EXPERTISE = ['Junior', 'Confirmé', 'Senior', 'Expert'];

export const EFFECTIFS_ENCADRES = ['0', '1 à 5', '6 à 10', '11 à 20', '21 à 50', 'Plus de 50'];

export const SITUATIONS_SOCIETE = [
  'En forte croissance',
  'En croissance',
  'Stable',
  'En difficulté',
  'En restructuration',
  'Récemment créée (startup)',
];

export const STRUCTURES = [
  'TPE (< 10 salariés)',
  'PME',
  'ETI',
  'Grand groupe',
  'Startup',
  'Association / ESS',
  'Administration / secteur public',
  'Profession libérale',
  'Autre',
];

export const NAF_SECTEURS = [
  'Agriculture, sylviculture, pêche',
  'Industrie manufacturière',
  'Énergie',
  'Eau, déchets, dépollution',
  'Construction / BTP',
  'Commerce, réparation automobile',
  'Transports, entreposage',
  'Hébergement, restauration',
  'Information et communication',
  'Activités financières et d’assurance',
  'Activités immobilières',
  'Activités spécialisées, scientifiques et techniques',
  'Services administratifs et de soutien',
  'Administration publique',
  'Enseignement',
  'Santé humaine et action sociale',
  'Arts, spectacles, loisirs',
  'Autres activités de services',
];

export const TRANCHES_CA = ['< 2 M€', '2 à 10 M€', '10 à 50 M€', '50 à 250 M€', '250 M€ à 1 Md€', '> 1 Md€', 'Ne sais pas'];

export const EFFECTIFS_SOCIETE = ['< 10', '10 à 49', '50 à 249', '250 à 999', '1 000 à 4 999', '5 000 et plus', 'Ne sais pas'];

export const ACTIONNARIATS = [
  'Indépendante / familiale',
  'Filiale de groupe français',
  'Filiale de groupe étranger',
  'Société cotée en bourse',
  'Détenue par un fonds d’investissement',
  'Secteur public / parapublic',
  'Autre',
];

export const ETENDUES = ['Locale', 'Régionale', 'Nationale', 'Internationale'];

export interface RemItem {
  key: string;
  label: string;
  money: boolean;
}

export const REM_GARANTIS: RemItem[] = [
  { key: 'prime_conventionnelle', label: 'Primes / éléments conventionnels (13e mois…)', money: true },
  { key: 'titres_resto', label: 'Titres restaurant / restaurant d’entreprise', money: true },
  { key: 'transport', label: 'Frais de transport pris en charge', money: false },
];
export const REM_VARIABLE: RemItem[] = [
  { key: 'heures_sup', label: 'Heures supplémentaires', money: true },
  { key: 'bonus', label: 'Primes et / ou bonus', money: true },
  { key: 'commissions', label: 'Commissions sur chiffre d’affaires', money: true },
  { key: 'ppv', label: 'Prime de Partage de la Valeur (PPV)', money: true },
];
export const REM_EPARGNE: RemItem[] = [
  { key: 'interessement', label: 'Accord d’intéressement', money: true },
  { key: 'participation', label: 'Accord de participation', money: true },
  { key: 'pee', label: 'Abondement au PEE', money: true },
];
export const REM_LONG_TERME: RemItem[] = [
  { key: 'actions_gratuites', label: 'Actions gratuites / de performance', money: true },
  { key: 'stock_options', label: 'Options d’actions (stock-options)', money: true },
  { key: 'lti_cash', label: 'Variable / bonus long terme (LTI “Cash”)', money: true },
];

export const AVANTAGES_NATURE = [
  { key: 'vehicule', label: 'Véhicule de fonction' },
  { key: 'logement', label: 'Logement de fonction' },
  { key: 'retraite_supp', label: 'Retraite supplémentaire (art.83 / PER / PERCO)' },
  { key: 'mutuelle', label: 'Complémentaire santé (mutuelle)' },
  { key: 'prevoyance', label: 'Prévoyance (invalidité / décès)' },
  { key: 'cet', label: 'Abondement au Compte Épargne Temps (CET)' },
  { key: 'autres', label: 'Autres avantages valorisables' },
];
export const AVANTAGES_AUTRES = [
  { key: 'gratifications', label: 'Gratifications spéciales (dividendes, jetons…)' },
  { key: 'mobile', label: 'Téléphone mobile' },
  { key: 'ordinateur', label: 'Ordinateur portable' },
  { key: 'remises', label: 'Remises produits / services' },
  { key: 'aides', label: 'Aides diverses (logement, garde d’enfants…)' },
  { key: 'cse', label: 'Avantages CSE / loisirs' },
  { key: 'prets', label: 'Prêts spéciaux' },
  { key: 'formation', label: 'Conseils / formation diplômante' },
];
