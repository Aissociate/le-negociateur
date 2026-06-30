// Enrichissement de la fiche prospect par recherche web : interroge Perplexity
// Sonar (via OpenRouter, agent `recherche_contact`) à partir de TOUTES les infos
// connues du contact, pour ramener un contexte factuel + accroches exploitables
// dans le cold email. Best-effort : ne lève jamais, borné en temps, désactivable
// depuis l'admin (agent_config.enabled).

import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { callLLM } from './llm.ts';

export interface ContactResearch {
  summary: string; // synthèse 2-3 phrases
  hooks: string[]; // accroches personnalisées pour l'email
  company_context: string; // actus société, levées, recrutements, taille…
  role_context: string; // ce que le poste implique (rému / négo)
  sources: string[]; // URLs citées par Sonar
}

const TIMEOUT_MS = 20000;

// deno-lint-ignore no-explicit-any
function extractJson(text: string): any | null {
  try {
    return JSON.parse(text);
  } catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
      return JSON.parse(m[0]);
    } catch {
      return null;
    }
  }
}

const strArr = (v: unknown, n: number): string[] =>
  Array.isArray(v) ? v.filter((x) => typeof x === 'string' && x.trim()).slice(0, n) : [];

export interface ResearchInput {
  full_name: string;
  first_name?: string | null;
  title?: string | null;
  company?: string | null;
  company_domain?: string | null;
  linkedin_url?: string | null;
  secteur?: string | null;
  localisation?: string | null;
  seniority?: string | null;
}

/** Recherche web sur le contact (Sonar). Renvoie null si désactivé / échec / timeout. */
export async function researchContact(
  db: SupabaseClient,
  input: ResearchInput
): Promise<ContactResearch | null> {
  try {
    const vars = {
      full_name: input.full_name ?? '',
      first_name: input.first_name ?? '',
      title: input.title ?? '',
      company: input.company ?? '',
      company_domain: input.company_domain ?? '',
      linkedin_url: input.linkedin_url ?? '',
      secteur: input.secteur ?? '',
      localisation: input.localisation ?? '',
      seniority: input.seniority ?? '',
    };
    const out = await callLLM(db, 'recherche_contact', vars, { jsonMode: true, timeoutMs: TIMEOUT_MS });
    const parsed = extractJson(out.text);
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      summary: typeof parsed.summary === 'string' ? parsed.summary : '',
      hooks: strArr(parsed.hooks, 5),
      company_context: typeof parsed.company_context === 'string' ? parsed.company_context : '',
      role_context: typeof parsed.role_context === 'string' ? parsed.role_context : '',
      sources: strArr(parsed.sources, 6),
    };
  } catch (_) {
    return null;
  }
}

/** Aplati la recherche en texte court réutilisable dans les prompts (score / email). */
export function researchToText(r: ContactResearch | null | undefined): string {
  if (!r) return 'n/c';
  const parts = [
    r.summary && `Synthèse : ${r.summary}`,
    r.company_context && `Société : ${r.company_context}`,
    r.role_context && `Rôle : ${r.role_context}`,
    r.hooks.length && `Accroches : ${r.hooks.join(' | ')}`,
  ].filter(Boolean);
  return parts.length ? parts.join('\n') : 'n/c';
}
