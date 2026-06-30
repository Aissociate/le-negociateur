// Test d'un agent IA depuis l'admin : lance un vrai appel LLM (via callLLM) avec
// des valeurs d'exemple pour les variables {{...}} du prompt, et renvoie le texte
// produit + tokens + durée. Admin-only. Diagnostic direct (clé/ modèle / crédit).

import { serviceClient } from '../_shared/db.ts';
import { handleOptions, json } from '../_shared/cors.ts';
import { requireAdmin } from '../_shared/auth.ts';
import { callLLM } from '../_shared/llm.ts';

// Valeurs d'exemple par variable connue (sinon « exemple »).
const SAMPLES: Record<string, string | number> = {
  poste: 'Chef de projet',
  secteur: 'Tech / Numérique',
  seniorite: 'Senior (8-15 ans)',
  seniority: 'Senior',
  localisation: 'Île-de-France',
  remuneration: 45000,
  remuneration_actuelle: 45000,
  market_low: 42000,
  market_median: 52000,
  market_high: 62000,
  gap_annual: 7000,
  gap_percent: 13,
  segment: 'sous-payé léger',
  position: 'en dessous de la médiane',
  tension: 'oui',
  net_monthly: 2800,
  net_annual: 33600,
  percentile: '40e',
  insee_verdict: 'sous la médiane',
  ft_tension: 'forte',
  ft_offres: 1200,
  borrowing_current: 210000,
  borrowing_target: 245000,
  borrowing_uplift: 35000,
  gap_5y: 35000,
  upside_to_high: 17000,
  providers: 'INSEE, France Travail',
  offres_fourchette: '48 000 – 60 000 € (12 offres)',
  offres_live: 'Plusieurs offres récentes paient au-dessus de la médiane.',
  full_name: 'Camille Martin',
  first_name: 'Camille',
  title: 'Directrice Marketing',
  company: 'Acme SAS',
  company_domain: 'acme.fr',
  linkedin_url: 'https://www.linkedin.com/in/exemple',
  signals: '{}',
  research:
    'Synthèse : Acme SAS, PME tech en croissance.\nSociété : levée de fonds récente, recrutements actifs.\nRôle : poste à responsabilités, marché tendu.',
  hooks: 'Levée de fonds récente | recrutements actifs sur des profils similaires',
  angle: 'Votre secteur recrute fort en ce moment, le marché tire les salaires vers le haut.',
  cta_url: 'https://exemple.fr/',
  realisations: 'A piloté un projet stratégique à 2 M€ et encadré 6 personnes.',
  profil_detaille: 'Cadre confirmé, ~10 ans d’expérience, périmètre national.',
};

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;
  if (!(await requireAdmin(req))) return json({ error: 'Réservé à l’administration.' }, 403);

  try {
    const { agent, vars: overrides } = (await req.json()) as {
      agent: string;
      vars?: Record<string, string | number>;
    };
    if (!agent) return json({ error: 'Agent manquant.' }, 400);

    const db = serviceClient();
    const { data: config } = await db
      .from('agent_config')
      .select('system_prompt, user_prompt_template, model')
      .eq('agent', agent)
      .maybeSingle();
    if (!config) return json({ error: `Agent introuvable : ${agent}` }, 404);

    // Variables {{...}} présentes dans les prompts -> valeurs d'exemple (ou override).
    const text = `${config.system_prompt}\n${config.user_prompt_template}`;
    const names = new Set<string>();
    for (const m of text.matchAll(/\{\{(\w+)\}\}/g)) names.add(m[1]);
    const vars: Record<string, string | number> = {};
    for (const n of names) vars[n] = overrides?.[n] ?? SAMPLES[n] ?? 'exemple';

    const start = Date.now();
    try {
      const out = await callLLM(db, agent, vars);
      return json({
        ok: true,
        model: config.model,
        text: out.text,
        tokens_in: out.tokensIn,
        tokens_out: out.tokensOut,
        ms: Date.now() - start,
        vars,
      });
    } catch (err) {
      // Échec de l'appel LLM (clé, modèle, crédit…) : on renvoie la cause exacte.
      return json({ ok: false, model: config.model, error: err instanceof Error ? err.message : String(err) }, 200);
    }
  } catch (err) {
    console.error(err);
    return json({ error: 'Erreur interne.' }, 500);
  }
});
