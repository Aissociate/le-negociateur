// Agent "Rapport d'écart" : reçoit le questionnaire, capture le lead (consentement
// horodaté + variante A/B), calcule l'écart salarial à partir de `salary_benchmarks`,
// génère l'analyse IA, programme la séquence d'emails, renvoie l'id du rapport.

import { serviceClient } from '../_shared/db.ts';
import { handleOptions, json } from '../_shared/cors.ts';
import { callLLM } from '../_shared/llm.ts';

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

    const marketLow = Math.round(match.salaire_bas * coef);
    const marketMedian = Math.round(match.salaire_median * coef);
    const marketHigh = Math.round(match.salaire_haut * coef);
    const gapAnnual = marketMedian - input.remuneration_actuelle;
    const gapPercent = Math.round((gapAnnual / marketMedian) * 100);
    const tension = !!match.metier_en_tension;

    const segment =
      gapPercent >= 15
        ? 'sous-payé fort'
        : gapPercent >= 5
          ? 'sous-payé léger'
          : gapPercent >= -5
            ? 'aligné'
            : 'au-dessus';

    // 3. Lead (upsert par email) + programmation du premier email
    const { data: firstEmail } = await db
      .from('email_sequences')
      .select('delay_hours')
      .eq('step', 1)
      .single();
    const nextEmailAt = new Date(
      Date.now() + (firstEmail?.delay_hours ?? 1) * 3600 * 1000
    ).toISOString();

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

    // 4. Analyse IA (repli sur un texte standard si l'agent échoue)
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
      tension: tension ? 'oui' : 'non',
    };
    let analysis = '';
    try {
      analysis = (await callLLM(db, 'analyse_ecart', vars)).text;
    } catch (_) {
      analysis = fallbackAnalysis(vars);
    }

    // 5. Rapport
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
      })
      .select()
      .single();
    if (reportError) throw reportError;

    await db.from('leads').update({ last_report_id: report.id }).eq('id', lead.id);

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
      ? `Pour un profil **${v.poste}** (${v.seniorite}) en ${v.localisation}, la médiane du marché se situe à **${Number(v.market_median).toLocaleString('fr-FR')} €** bruts annuels. Votre rémunération actuelle se trouve **${Math.abs(Number(v.gap_percent))}% en dessous** de cette médiane, soit un manque à gagner estimé de **${Number(v.gap_annual).toLocaleString('fr-FR')} € par an**.${tension ? ' Votre métier est par ailleurs **en tension** : le rapport de force vous est favorable, le marché bouge vite.' : ''}`
      : `Pour un profil **${v.poste}** (${v.seniorite}) en ${v.localisation}, vous vous situez au-dessus de la médiane du marché (**${Number(v.market_median).toLocaleString('fr-FR')} €**). L'enjeu n'est plus de rattraper le marché mais de **sécuriser et valoriser** cette position.`,
    `## Ce que cela signifie concrètement`,
    under
      ? `- Sur 5 ans sans correction, l'écart cumulé dépasse **${(Number(v.gap_annual) * 5).toLocaleString('fr-FR')} €**, sans compter l'effet sur vos cotisations retraite et vos futures négociations (chaque salaire sert de base au suivant).\n- Cet écart est un **argument**, pas une fatalité : il se négocie, à condition d'arriver préparé, chiffres en main.`
      : `- Votre position favorable est un atout dans toute discussion : mobilité interne, promotion, ou négociation externe.\n- Le risque principal est l'érosion : sans réévaluation régulière, l'inflation et l'évolution du marché grignotent votre avance.`,
    `## La prochaine étape`,
    `La différence entre les cadres qui obtiennent une augmentation et les autres tient rarement à la valeur — elle tient à la **méthode de négociation**. C'est exactement ce que prépare Le Négociateur.`,
  ].join('\n\n');
}
