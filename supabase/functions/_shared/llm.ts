// Couche d'abstraction LLM : un seul point d'appel, route vers OpenRouter.
// Le modele, les prompts et les parametres viennent de la table `agent_config`
// (modifiables dans /admin sans redeploiement).

import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

export interface LLMResult {
  text: string;
  tokensIn: number;
  tokensOut: number;
}

/** Remplace les variables {{cle}} dans un template. */
export function renderTemplate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    key in vars ? String(vars[key]) : `{{${key}}}`
  );
}

/**
 * Appelle le LLM configure pour `agent`. Journalise le run dans `agent_runs`.
 * Lance une erreur si l'agent est desactive ou si l'appel echoue.
 */
export async function callLLM(
  db: SupabaseClient,
  agent: string,
  vars: Record<string, string | number>,
  options: { jsonMode?: boolean; timeoutMs?: number } = {}
): Promise<LLMResult> {
  const { data: config, error } = await db
    .from('agent_config')
    .select('*')
    .eq('agent', agent)
    .single();
  if (error || !config) throw new Error(`Config agent introuvable : ${agent}`);
  if (!config.enabled) throw new Error(`Agent désactivé : ${agent}`);

  const start = Date.now();
  let result: LLMResult | null = null;
  let detail = '';
  // Borne optionnelle (ex. Perplexity Sonar qui fait de la recherche web).
  const ctrl = options.timeoutMs ? new AbortController() : undefined;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), options.timeoutMs) : undefined;

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('OPENROUTER_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      signal: ctrl?.signal,
      body: JSON.stringify({
        model: config.model,
        temperature: config.temperature,
        max_tokens: config.max_tokens,
        ...(options.jsonMode ? { response_format: { type: 'json_object' } } : {}),
        messages: [
          { role: 'system', content: renderTemplate(config.system_prompt, vars) },
          { role: 'user', content: renderTemplate(config.user_prompt_template, vars) },
        ],
      }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error?.message ?? `OpenRouter HTTP ${res.status}`);

    result = {
      text: body.choices?.[0]?.message?.content ?? '',
      tokensIn: body.usage?.prompt_tokens ?? 0,
      tokensOut: body.usage?.completion_tokens ?? 0,
    };
    detail = `model=${config.model}`;
    return result;
  } catch (err) {
    detail = err instanceof Error ? err.message : String(err);
    throw err;
  } finally {
    if (timer) clearTimeout(timer);
    await db.from('agent_runs').insert({
      agent,
      status: result ? 'ok' : 'error',
      tokens_in: result?.tokensIn ?? 0,
      tokens_out: result?.tokensOut ?? 0,
      duration_ms: Date.now() - start,
      detail,
    });
  }
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Variante multi-tours (chat) : le system_prompt de `agent` (rendu avec `vars`)
 * précède l'historique de conversation. Utilisé par le simulateur d'entretien.
 */
export async function callLLMChat(
  db: SupabaseClient,
  agent: string,
  messages: ChatMessage[],
  vars: Record<string, string | number>
): Promise<LLMResult> {
  const { data: config, error } = await db.from('agent_config').select('*').eq('agent', agent).single();
  if (error || !config) throw new Error(`Config agent introuvable : ${agent}`);
  if (!config.enabled) throw new Error(`Agent désactivé : ${agent}`);

  const start = Date.now();
  let result: LLMResult | null = null;
  let detail = '';

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('OPENROUTER_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        temperature: config.temperature,
        max_tokens: config.max_tokens,
        messages: [{ role: 'system', content: renderTemplate(config.system_prompt, vars) }, ...messages],
      }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error?.message ?? `OpenRouter HTTP ${res.status}`);
    result = {
      text: body.choices?.[0]?.message?.content ?? '',
      tokensIn: body.usage?.prompt_tokens ?? 0,
      tokensOut: body.usage?.completion_tokens ?? 0,
    };
    detail = `model=${config.model} chat`;
    return result;
  } catch (err) {
    detail = err instanceof Error ? err.message : String(err);
    throw err;
  } finally {
    await db.from('agent_runs').insert({
      agent,
      status: result ? 'ok' : 'error',
      tokens_in: result?.tokensIn ?? 0,
      tokens_out: result?.tokensOut ?? 0,
      duration_ms: Date.now() - start,
      detail,
    });
  }
}
