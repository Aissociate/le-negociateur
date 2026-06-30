// Veille temps réel : interroge Perplexity Sonar (via OpenRouter, agent
// `offres_salaires`) pour trouver de VRAIES offres d'emploi récentes avec salaire,
// afin d'affiner la fourchette du marché. Best-effort : ne lève jamais, borné en
// temps. Désactivable depuis l'admin (agent_config.enabled).

import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { callLLM } from './llm.ts';

export interface OfferSample {
  intitule?: string;
  entreprise?: string;
  salaire?: string;
  source?: string;
}
export interface LiveOffers {
  found: boolean;
  low: number | null;
  median: number | null;
  high: number | null;
  count: number;
  sample: OfferSample[];
  synthese: string;
}

const TIMEOUT_MS = 18000;

// deno-lint-ignore no-explicit-any
function extractJson(text: string): any | null {
  try {
    return JSON.parse(text);
  } catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        return JSON.parse(m[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

const numOrNull = (v: unknown): number | null => {
  const n = Number(typeof v === 'string' ? v.replace(/[^\d.]/g, '') : v);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
};

export interface LiveOffersInput {
  poste: string;
  secteur: string;
  seniorite: string;
  localisation: string;
  market_median: number;
}

/** Recherche d'offres réelles (Sonar). Renvoie null si désactivé / échec / timeout. */
export async function fetchLiveOffers(db: SupabaseClient, input: LiveOffersInput): Promise<LiveOffers | null> {
  try {
    const out = await callLLM(db, 'offres_salaires', input, { timeoutMs: TIMEOUT_MS });
    const parsed = extractJson(out.text);
    if (!parsed || typeof parsed !== 'object') return null;
    const sample: OfferSample[] = Array.isArray(parsed.sample) ? parsed.sample.slice(0, 5) : [];
    return {
      found: !!parsed.found,
      low: numOrNull(parsed.low),
      median: numOrNull(parsed.median),
      high: numOrNull(parsed.high),
      count: numOrNull(parsed.count) ?? sample.length,
      sample,
      synthese: typeof parsed.synthese === 'string' ? parsed.synthese : '',
    };
  } catch (_) {
    return null;
  }
}
