// Construction des variables du Kit, factorisée entre le webhook (Kit baseline
// à l'achat) et personalize-kit (Kit enrichi avec le profil détaillé post-achat).

// deno-lint-ignore no-explicit-any
export function baseKitVars(report: any, lead: any): Record<string, string | number> {
  const gp = report?.gap_percent ?? 0;
  const position =
    gp >= 5 ? 'en dessous de la médiane' : gp <= -5 ? 'au-dessus de la médiane' : 'aligné sur la médiane';
  const intel = (report?.intel ?? {}) as Record<string, unknown>;
  const fmt = (v: unknown): string | number => (v === undefined || v === null ? 'n/c' : (v as string | number));
  return {
    poste: report?.poste ?? lead?.poste ?? 'Cadre',
    secteur: report?.secteur ?? lead?.secteur ?? 'Tous secteurs',
    seniorite: report?.seniorite ?? lead?.seniorite ?? 'Confirmé (3-8 ans)',
    localisation: report?.localisation ?? lead?.localisation ?? 'France',
    remuneration: report?.remuneration_actuelle ?? lead?.remuneration_actuelle ?? 0,
    market_low: report?.market_low ?? 0,
    market_median: report?.market_median ?? 0,
    market_high: report?.market_high ?? 0,
    gap_annual: report?.gap_annual ?? 0,
    gap_percent: gp,
    segment: report?.segment ?? 'inconnu',
    position,
    tension: report?.metier_en_tension ? 'oui' : 'non',
    net_monthly: fmt(intel.net_monthly),
    net_annual: fmt(intel.net_annual),
    percentile: fmt(intel.percentile),
    insee_verdict: fmt(intel.insee_verdict),
    ft_tension: fmt(intel.ft_tension),
    ft_offres: fmt(intel.ft_offres),
    ft_salaire_min: fmt(intel.ft_salaire_min),
    ft_salaire_max: fmt(intel.ft_salaire_max),
    borrowing_current: fmt(intel.borrowing_current),
    borrowing_target: fmt(intel.borrowing_target),
    borrowing_uplift: fmt(intel.borrowing_uplift),
    gap_5y: fmt(intel.gap_5y),
    upside_to_high: fmt(intel.upside_to_high),
    providers: (intel.providers_ok as string[] | undefined)?.join(', ') || 'référentiel interne',
  };
}

const REM_LABELS: Record<string, string> = {
  prime_conventionnelle: 'primes/13e mois',
  titres_resto: 'titres restaurant',
  transport: 'frais de transport',
  heures_sup: 'heures supplémentaires',
  bonus: 'primes/bonus',
  commissions: 'commissions',
  ppv: 'PPV',
  interessement: 'intéressement',
  participation: 'participation',
  pee: 'abondement PEE',
  actions_gratuites: 'actions gratuites',
  stock_options: 'stock-options',
  lti_cash: 'LTI cash',
};
const NATURE_LABELS: Record<string, string> = {
  vehicule: 'véhicule de fonction',
  logement: 'logement de fonction',
  retraite_supp: 'retraite supplémentaire',
  mutuelle: 'mutuelle',
  prevoyance: 'prévoyance',
  cet: 'abondement CET',
  autres: 'autres avantages en nature',
};
const AUTRES_LABELS: Record<string, string> = {
  gratifications: 'gratifications spéciales',
  mobile: 'téléphone mobile',
  ordinateur: 'ordinateur portable',
  remises: 'remises produits/services',
  aides: 'aides diverses',
  cse: 'avantages CSE',
  prets: 'prêts spéciaux',
  formation: 'formation diplômante',
};

/** Met le profil détaillé en texte lisible pour le prompt (ignore le vide). */
// deno-lint-ignore no-explicit-any
export function profileToText(profile: any): string {
  if (!profile) return 'n/c';
  const e = profile.emploi ?? {};
  const c = profile.entreprise ?? {};
  const r = profile.remuneration ?? {};
  const a = profile.avantages ?? {};
  const lines: string[] = [];

  lines.push(
    `Emploi : ${e.intitule_exact || e.metier || 'n/c'} | statut ${e.statut ?? 'n/c'} | niveau ${e.niveau_expertise ?? 'n/c'} | ancienneté pro ${e.anciennete_totale ?? '?'} ans (dont société ${e.anciennete_societe ?? '?'} ans) | contrat ${e.type_contrat ?? 'n/c'}${e.temps_partiel ? ` (temps partiel ${e.quotite ?? ''}%)` : ''}`
  );
  lines.push(
    `Responsabilités : ${e.nature_responsabilites ?? 'n/c'} sur ${e.perimetre ?? 'n/c'} | ${e.effectif_encadre ?? '0'} personne(s) encadrée(s)${e.codir_comex ? ' | membre CODIR/COMEX' : ''} | congés ${e.conges_payes ?? '?'}j + ${e.conges_complementaires ?? 0}j compl.`
  );
  lines.push(
    `Entreprise : ${c.nom || 'n/c'} | ${c.structure ?? 'n/c'} | NAF ${c.naf ?? 'n/c'} | situation ${c.situation ?? 'n/c'} | effectif ${c.effectif ?? 'n/c'} | CA ${c.ca ?? 'n/c'} | actionnariat ${c.actionnariat ?? 'n/c'} | étendue ${c.etendue ?? 'n/c'} | dpt ${c.departement ?? 'n/c'}`
  );

  const els = r.elements ?? {};
  const active: string[] = [];
  for (const [k, label] of Object.entries(REM_LABELS)) {
    const el = els[k];
    if (el?.on) active.push(`${label}${el.montant ? ` ~${el.montant} €/an` : ''}`);
  }
  lines.push(
    `Rémunération : base ${r.mensuel_brut ?? '?'} €/mois × ${r.mois ?? 12} mois${active.length ? ' | éléments : ' + active.join(', ') : ''}`
  );

  const nat = a.nature ?? {};
  const aut = a.autres ?? {};
  const avActive: string[] = [];
  for (const [k, l] of Object.entries(NATURE_LABELS)) if (nat[k]) avActive.push(l);
  for (const [k, l] of Object.entries(AUTRES_LABELS)) if (aut[k]) avActive.push(l);
  if (avActive.length || a.total_autres_annuel) {
    lines.push(
      `Avantages : ${avActive.join(', ') || 'aucun déclaré'}${a.total_autres_annuel ? ` | total autres ~${a.total_autres_annuel} €/an` : ''}`
    );
  }

  return lines.join('\n');
}

/** Variables du Kit enrichi : base + profil détaillé + réalisations. */
// deno-lint-ignore no-explicit-any
export function detailedKitVars(report: any, lead: any, profile: any): Record<string, string | number> {
  const re = profile?.realisations ?? {};
  const parts = [
    re.reussites && `Réussites : ${re.reussites}`,
    re.evolutions && `Évolutions/promotions : ${re.evolutions}`,
    re.competences && `Compétences différenciantes : ${re.competences}`,
    re.objectif && `Objectif : ${re.objectif}`,
    re.confiance && `Confiance pour négocier : ${re.confiance}/5`,
    re.contexte && `Contexte : ${re.contexte}`,
  ].filter(Boolean);
  return {
    ...baseKitVars(report, lead),
    profil_detaille: profileToText(profile),
    realisations: parts.length ? parts.join(' | ') : 'n/c',
  };
}
