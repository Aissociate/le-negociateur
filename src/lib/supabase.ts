import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(url, anonKey);

/** URL de base des Edge Functions Supabase. */
export const functionsUrl = `${url}/functions/v1`;

/** Appel POST JSON vers une Edge Function (avec la cle anon en Authorization). */
export async function callFunction<T>(name: string, body: unknown): Promise<T> {
  const res = await fetch(`${functionsUrl}/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? `Erreur ${res.status}`);
  return json as T;
}

/** Appel GET vers une Edge Function. */
export async function getFunction<T>(name: string, params: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${functionsUrl}/${name}?${qs}`, {
    headers: { Authorization: `Bearer ${anonKey}` },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? `Erreur ${res.status}`);
  return json as T;
}

/** Appel POST vers une Edge Function authentifiée : passe l'access_token de l'utilisateur connecté. */
export async function callAdminFunction<T>(name: string, body: unknown): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token ?? anonKey;
  const res = await fetch(`${functionsUrl}/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? `Erreur ${res.status}`);
  return json as T;
}

/** Alias sémantique pour l'espace client (utilisateur connecté via magic link). */
export const callAuthFunction = callAdminFunction;
