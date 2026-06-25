// Agrégation salariale multi-sources, best-effort (chaque source peut échouer
// sans bloquer les autres ni le rapport). Sources :
//  - calculer-salaire.com (public)  : brut->net + comparaison percentile INSEE
//  - moicombien.fr (public)         : capacité d'emprunt (projection bénéfice)
//  - France Travail (OAuth2, opt.)  : tension, offres, salaires proposés par ROME
//
// Rien n'est inventé : on stocke les réponses brutes (audit) et un objet
// "normalized" avec les seuls chiffres effectivement récupérés.

export interface SalaryInput {
  poste: string;
  secteur: string;
  seniorite: string;
  localisation: string;
  remuneration_actuelle: number;
  code_rome: string | null;
  market_median: number;
}

// deno-lint-ignore no-explicit-any
export interface SalaryIntel {
  sources: Record<string, any>;
  // deno-lint-ignore no-explicit-any
  normalized: Record<string, any>;
}

const TIMEOUT_MS = 8000;

function num(v: unknown): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}
function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// Recherche défensive d'une clé (les schémas des API varient / sont peu documentés).
// deno-lint-ignore no-explicit-any
function deepFind(obj: any, keys: string[], depth = 3): unknown {
  if (!obj || typeof obj !== 'object' || depth < 0) return undefined;
  for (const k of keys) if (obj[k] !== undefined && obj[k] !== null) return obj[k];
  for (const v of Object.values(obj)) {
    if (v && typeof v === 'object') {
      const found = deepFind(v, keys, depth - 1);
      if (found !== undefined) return found;
    }
  }
  return undefined;
}

// deno-lint-ignore no-explicit-any
async function fetchJson(url: string, init: RequestInit = {}, ms = TIMEOUT_MS): Promise<any> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    const text = await res.text();
    let json: unknown = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = { _raw: text.slice(0, 500) };
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return json;
  } finally {
    clearTimeout(t);
  }
}

async function safe<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (_) {
    return null;
  }
}

// --- calculer-salaire.com : brut->net + percentile INSEE -------------------
async function calculerSalaire(input: SalaryInput) {
  const monthlyGross = Math.max(1, Math.round(input.remuneration_actuelle / 12));
  // deno-lint-ignore no-explicit-any
  const raw: any = {};
  // deno-lint-ignore no-explicit-any
  const norm: any = {};

  try {
    const calc = await fetchJson('https://calculer-salaire.com/api/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: monthlyGross, type: 'gross_to_net', status: 'cadre', year: 2026 }),
    });
    raw.calculate = calc;
    norm.net_monthly = num(calc?.monthly?.net);
    norm.net_annual = num(calc?.annual?.net);
    if (norm.net_annual && input.remuneration_actuelle) {
      norm.net_ratio = round2(norm.net_annual / input.remuneration_actuelle);
    }
  } catch (e) {
    raw.calculate_error = String(e);
  }

  if (norm.net_monthly) {
    try {
      const cmp = await fetchJson('https://calculer-salaire.com/api/compare-salary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: norm.net_monthly, salaire: norm.net_monthly, status: 'cadre', csp: 'cadre' }),
      });
      raw.compare = cmp;
      norm.percentile = num(deepFind(cmp, ['percentile', 'percentile_net', 'centile']));
      norm.insee_verdict = str(deepFind(cmp, ['verdict', 'message', 'position']));
    } catch (e) {
      raw.compare_error = String(e);
    }
  }

  return { raw, norm, ok: norm.net_monthly !== undefined };
}

// --- moicombien.fr : capacité d'emprunt (projection bénéfice) ---------------
async function moiCombien(input: SalaryInput, netMonthly?: number, netRatio?: number) {
  // deno-lint-ignore no-explicit-any
  const raw: any = {};
  // deno-lint-ignore no-explicit-any
  const norm: any = {};
  const taux = 3.5;
  const duree = 25;
  const ratio = netRatio ?? 0.77;
  const incCurrent = netMonthly ?? Math.round((input.remuneration_actuelle * ratio) / 12);

  try {
    const cur = await fetchJson(
      `https://moicombien.fr/api/v1/calcul/capacite-emprunt?revenus=${incCurrent}&charges=0&taux=${taux}&duree=${duree}`
    );
    raw.capacite_current = cur;
    norm.borrowing_current = num(deepFind(cur, ['capacite', 'capaciteEmprunt', 'capacite_emprunt', 'montant', 'capital']));
  } catch (e) {
    raw.capacite_current_error = String(e);
  }

  if (input.market_median > input.remuneration_actuelle) {
    const targetNetMonthly = Math.round((input.market_median * ratio) / 12);
    try {
      const tgt = await fetchJson(
        `https://moicombien.fr/api/v1/calcul/capacite-emprunt?revenus=${targetNetMonthly}&charges=0&taux=${taux}&duree=${duree}`
      );
      raw.capacite_target = tgt;
      norm.borrowing_target = num(deepFind(tgt, ['capacite', 'capaciteEmprunt', 'capacite_emprunt', 'montant', 'capital']));
    } catch (e) {
      raw.capacite_target_error = String(e);
    }
  }

  if (norm.borrowing_current && norm.borrowing_target) {
    norm.borrowing_uplift = Math.round(norm.borrowing_target - norm.borrowing_current);
  }

  return { raw, norm, ok: norm.borrowing_current !== undefined };
}

// --- France Travail : marché du travail (OAuth2, optionnel) -----------------
async function franceTravail(input: SalaryInput) {
  const id = Deno.env.get('FT_CLIENT_ID');
  const secret = Deno.env.get('FT_CLIENT_SECRET');
  const scope = Deno.env.get('FT_SCOPE');
  const endpoint = Deno.env.get('FT_MARCHE_TRAVAIL_URL'); // gabarit avec {rome} et {zone}
  if (!id || !secret || !scope || !endpoint) return null; // non configuré -> on saute

  const tokenUrl =
    Deno.env.get('FT_TOKEN_URL') ??
    'https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=/partenaire';
  // deno-lint-ignore no-explicit-any
  const raw: any = {};
  // deno-lint-ignore no-explicit-any
  const norm: any = {};

  try {
    const form = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: id,
      client_secret: secret,
      scope,
    });
    const tok = await fetchJson(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });
    const access = tok?.access_token;
    if (!access) throw new Error('pas de token FT');

    const zone = input.localisation?.includes('Île') ? '11' : '';
    const url = endpoint
      .replaceAll('{rome}', encodeURIComponent(input.code_rome ?? ''))
      .replaceAll('{zone}', encodeURIComponent(zone));
    const data = await fetchJson(url, { headers: { Authorization: `Bearer ${access}` } });
    raw.marche_travail = data;
    norm.ft_offres = num(deepFind(data, ['nbOffres', 'nombreOffres', 'offres']));
    norm.ft_tension = str(deepFind(data, ['tension', 'indicateurTension', 'difficulteRecrutement']));
    norm.ft_salaire_min = num(deepFind(data, ['salaireMin', 'salaireMinimum', 'borneInf']));
    norm.ft_salaire_max = num(deepFind(data, ['salaireMax', 'salaireMaximum', 'borneSup']));
    return { raw, norm, ok: true };
  } catch (e) {
    raw.ft_error = String(e);
    return { raw, norm, ok: false };
  }
}

/** Agrège les 3 sources pour un prospect. Ne lève jamais : best-effort. */
export async function aggregateSalaryIntel(input: SalaryInput): Promise<SalaryIntel> {
  // deno-lint-ignore no-explicit-any
  const sources: Record<string, any> = {};
  // deno-lint-ignore no-explicit-any
  const normalized: Record<string, any> = { providers_ok: [] as string[] };

  // 1. calculer-salaire d'abord (fournit net + ratio nécessaires à moicombien)
  const cs = await safe(() => calculerSalaire(input));
  if (cs) {
    sources.calculer_salaire = cs.raw;
    Object.assign(normalized, cs.norm);
    if (cs.ok) normalized.providers_ok.push('calculer-salaire.com');
  }

  // 2. moicombien + France Travail en parallèle
  const [mc, ft] = await Promise.all([
    safe(() => moiCombien(input, normalized.net_monthly, normalized.net_ratio)),
    safe(() => franceTravail(input)),
  ]);
  if (mc) {
    sources.moicombien = mc.raw;
    Object.assign(normalized, mc.norm);
    if (mc.ok) normalized.providers_ok.push('moicombien.fr');
  }
  if (ft) {
    sources.france_travail = ft.raw;
    Object.assign(normalized, ft.norm);
    if (ft.ok) normalized.providers_ok.push('France Travail');
  }

  return { sources, normalized };
}
