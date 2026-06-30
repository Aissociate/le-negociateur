// Agent "Rapport d'écart" : reçoit le questionnaire, capture le lead (consentement
// horodaté + variante A/B), calcule l'écart à partir de `salary_benchmarks`,
// AGRÈGE des données externes multi-sources par prospect (France Travail,
// calculer-salaire, moicombien), les sauve dans `salary_intel`, génère l'analyse
// IA enrichie + factuelle, programme la séquence d'emails, renvoie l'id du rapport.

import { serviceClient } from '../_shared/db.ts';
import { handleOptions, json } from '../_shared/cors.ts';
import { callLLM } from '../_shared/llm.ts';
import { aggregateSalaryIntel } from '../_shared/salary_sources.ts';
import { fetchLiveOffers } from '../_shared/live_offers.ts';

interface Input {
  poste: string;
  secteur: string;
  seniorite: string;
  localisation: string;
  remuneration_actuelle: number;
  email: string;
  consent: boolean;
  ab_variant?: string;
}

function stripAccents(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;

  try {
    const input = (await req.json()) as Input;
    if (
      !input.email?.includes('@') ||
      !input.poste?.trim() ||
      !input.consent ||
      !Number.isFinite(input.remuneration_actuelle) ||
      input.remuneration_actuelle < 10000 ||
      input.remuneration_actuelle > 1000000
    ) {
      return json({ error: 'Formulaire invalide.' }, 400);
    }

    const db = serviceClient();

    // 1. Benchmark le plus proche (même séniorité + région, meilleur recoupement de mots)
    const { data: benchmarks } = await db
      .from('salary_benchmarks')
      .select('*')
      .eq('seniorite', input.seniorite)
      .eq('localisation', input.localisation);
    if (!benchmarks?.length) return json({ error: 'Référentiel indisponible.' }, 500);

    const words = stripAccents(input.poste)
      .split(/\W+/)
      .filter((w) => w.length > 2);
    const scored = benchmarks.map((b) => {
      const target = stripAccents(b.intitule);
      const score = words.filter((w) => target.includes(w)).length;
      return { b, score };
    });
    scored.sort((a, z) => z.score - a.score);
    const match =
      scored[0].score > 0
        ? scored[0].b
        : benchmarks.find((b) => b.intitule.includes('généraliste')) ?? scored[0].b;

    // 2. Coefficient sectoriel
    const { data: coefRow } = await db
      .from('sector_coefficients')
      .select('coef')
      .eq('secteur', input.secteur)
      .maybeSingle();
    const coef = coefRow?.coef ?? 1.0;

    const baseLow = Math.round(match.salaire_bas * coef);
    const baseMedian = Math.round(match.salaire_median * coef);
    const baseHigh = Math.round(match.salaire_haut * coef);
    const tension = !!match.metier_en_tension;

    // 3. Enrichissements best-effort EN PARALLÈLE : sources externes + offres réelles
    //    (Perplexity Sonar). Aucun ne bloque ni ne ralentit l'autre ; le rapport
    //    se génère même si les deux échouent.
    const [intelRes, live] = await Promise.all([
      aggregateSalaryIntel({
        poste: input.poste,
        secteur: input.secteur,
        seniorite: input.seniorite,
        localisation: input.localisation,
        remuneration_actuelle: input.remuneration_actuelle,
        code_rome: match.code_rome ?? null,
        market_median: baseMedian,
      }).catch(() => null),
      fetchLiveOffers(db, {
        poste: input.poste,
        secteur: input.secteur,
        seniorite: input.seniorite,
        localisation: input.localisation,
        market_median: baseMedian,
      }),
    ]);
    const intel = intelRes ?? { sources: {}, normalized: { providers_ok: [] as string[] } as Record<string, unknown> };

    // Fourchette affinée par les offres réelles : on élargit la bande et on recale
    // la médiane (pondérée 60 % réf. interne / 40 % offres) pour éviter les à-coups.
    let marketLow = baseLow;
    let marketMedian = baseMedian;
    let marketHigh = baseHigh;
    if (live?.found) {
      if (live.low) marketLow = Math.min(marketLow, live.low);
      if (live.high) marketHigh = Math.max(marketHigh, live.high);
      if (live.median) marketMedian = Math.round(baseMedian * 0.6 + live.median * 0.4);
      marketMedian = Math.min(Math.max(marketMedian, marketLow), marketHigh);
    }

    const gapAnnual = marketMedian - input.remuneration_actuelle;
    const gapPercent = Math.round((gapAnnual / marketMedian) * 100);

    const segment =
      gapPercent >= 15 ? 'sous-payé fort' : gapPercent >= 5 ? 'sous-payé léger' : gapPercent >= -5 ? 'aligné' : 'au-dessus';
    const position =
      gapPercent >= 5 ? 'en dessous de la médiane' : gapPercent <= -5 ? 'au-dessus de la médiane' : 'aligné sur la médiane';

    // Projections chiffrées (factuelles, calculées serveur)
    const gap5y = gapAnnual > 0 ? gapAnnual * 5 : 0;
    const upsideToHigh = Math.max(0, marketHigh - input.remuneration_actuelle);
    const offresFourchette =
      live?.found && (live.low || live.high)
        ? `${(live.low ?? live.median ?? marketLow).toLocaleString('fr-FR')} – ${(
            live.high ?? live.median ?? marketHigh
          ).toLocaleString('fr-FR')} € bruts/an (${live.count} offres)`
        : 'n/c';
    const offresLive = live?.found && live.synthese ? live.synthese : 'n/c';
    const reportIntel = {
      ...intel.normalized,
      gap_5y: gap5y,
      upside_to_high: upsideToHigh,
      live_offers: live?.found ? live : null,
    };

    // 4. Lead (upsert par email) + programmation du premier email
    const { data: firstEmail } = await db.from('email_sequences').select('delay_hours').eq('step', 1).single();
    const nextEmailAt = new Date(Date.now() + (firstEmail?.delay_hours ?? 1) * 3600 * 1000).toISOString();

    const { data: lead, error: leadError } = await db
      .from('leads')
      .upsert(
        {
          email: input.email.toLowerCase().trim(),
          poste: input.poste.trim(),
          secteur: input.secteur,
          seniorite: input.seniorite,
          localisation: input.localisation,
          remuneration_actuelle: input.remuneration_actuelle,
          segment,
          gap_annual: gapAnnual,
          gap_percent: gapPercent,
          statut: 'lead',
          sequence_step: 0,
          next_email_at: nextEmailAt,
          ab_variant: input.ab_variant ?? null,
          consent_at: new Date().toISOString(),
        },
        { onConflict: 'email' }
      )
      .select()
      .single();
    if (leadError) throw leadError;

    // 5. Analyse IA enrichie (repli sur un texte standard si l'agent échoue)
    const n = intel.normalized;
    const fmt = (v: unknown): string | number => (v === undefined || v === null ? 'n/c' : (v as string | number));
    const vars = {
      poste: input.poste,
      secteur: input.secteur,
      seniorite: input.seniorite,
      localisation: input.localisation,
      remuneration: input.remuneration_actuelle,
      market_low: marketLow,
      market_median: marketMedian,
      market_high: marketHigh,
      gap_annual: gapAnnual,
      gap_percent: gapPercent,
      segment,
      position,
      tension: tension ? 'oui' : 'non',
      net_monthly: fmt(n.net_monthly),
      net_annual: fmt(n.net_annual),
      percentile: fmt(n.percentile),
      insee_verdict: fmt(n.insee_verdict),
      ft_tension: fmt(n.ft_tension),
      ft_offres: fmt(n.ft_offres),
      borrowing_current: fmt(n.borrowing_current),
      borrowing_target: fmt(n.borrowing_target),
      borrowing_uplift: fmt(n.borrowing_uplift),
      gap_5y: gap5y,
      upside_to_high: upsideToHigh,
      providers: (n.providers_ok as string[] | undefined)?.join(', ') || 'référentiel interne',
      offres_fourchette: offresFourchette,
      offres_live: offresLive,
    };
    let analysis = '';
    try {
      analysis = (await callLLM(db, 'analyse_ecart', vars)).text;
    } catch (_) {
      analysis = fallbackAnalysis(vars);
    }

    // 6. Rapport (avec données factuelles agrégées attachées)
    const { data: report, error: reportError } = await db
      .from('gap_reports')
      .insert({
        lead_id: lead.id,
        poste: input.poste.trim(),
        secteur: input.secteur,
        seniorite: input.seniorite,
        localisation: input.localisation,
        remuneration_actuelle: input.remuneration_actuelle,
        market_low: marketLow,
        market_median: marketMedian,
        market_high: marketHigh,
        gap_annual: gapAnnual,
        gap_percent: gapPercent,
        segment,
        analysis_md: analysis,
        source: match.source,
        annee: match.annee,
        metier_en_tension: tension,
        intel: reportIntel,
      })
      .select()
      .single();
    if (reportError) throw reportError;

    await db.from('leads').update({ last_report_id: report.id }).eq('id', lead.id);

    // 7. Sauvegarde de la collecte multi-sources par prospect (audit + réutilisation)
    await db.from('salary_intel').insert({
      lead_id: lead.id,
      report_id: report.id,
      poste: input.poste.trim(),
      secteur: input.secteur,
      seniorite: input.seniorite,
      localisation: input.localisation,
      code_rome: match.code_rome ?? null,
      remuneration_actuelle: input.remuneration_actuelle,
      sources: { ...intel.sources, live_offers: live?.found ? live : null },
      normalized: reportIntel,
    });

    return json({ report_id: report.id });
  } catch (err) {
    console.error(err);
    return json({ error: 'Erreur interne, merci de réessayer.' }, 500);
  }
});

function fallbackAnalysis(v: Record<string, string | number>): string {
  const under = Number(v.gap_annual) > 0;
  const tension = String(v.tension) === 'oui';
  return [
    `## Votre lecture du marché`,
    under
      ? `Pour un profil **${v.poste}** (${v.seniorite}) en ${v.localisation}, la médiane du marché se situe à **${Number(v.market_median).toLocaleString('fr-FR')} €** bruts annuels. Votre rémunération actuelle se trouve **${Math.abs(Number(v.gap_percent))}% en dessous** de cette médiane, soit un manque à gagner estimé de **${Number(v.gap_annual).toLocaleString('fr-FR')} € par an**.${tension ? ' Votre métier est par ailleurs **en tension** : le rapport de force vous est favorable.' : ''}`
      : `Pour un profil **${v.poste}** (${v.seniorite}) en ${v.localisation}, vous vous situez au niveau ou au-dessus de la médiane du marché (**${Number(v.market_median).toLocaleString('fr-FR')} €**). L'enjeu est de **sécuriser et viser le haut de fourchette** (jusqu'à ${Number(v.market_high).toLocaleString('fr-FR')} €).`,
    `## Ce que cela signifie concrètement`,
    under
      ? `- Sur 5 ans sans correction, l'écart cumulé dépasse **${(Number(v.gap_annual) * 5).toLocaleString('fr-FR')} €**, sans compter l'effet sur vos cotisations retraite et vos futures négociations.\n- Cet écart est un **argument**, pas une fatalité : il se négocie, chiffres en main.`
      : `- Votre position est un atout : elle se défend et se fait fructifier (promotion, mobilité, haut de fourchette).\n- Le risque est l'érosion : sans réévaluation régulière, l'inflation grignote votre avance.`,
    `## La prochaine étape`,
    `La différence entre les cadres qui obtiennent une augmentation et les autres tient à la **méthode**. C'est exactement ce que prépare Le Négociateur.`,
  ].join('\n\n');
}
