// Garde "admin" pour les Edge Functions sensibles (prospection, etc.).
// Le front passe l'access_token de l'admin connecté (callAdminFunction).
// On vérifie que ce JWT correspond à un profil role='admin'.

import { createClient } from 'npm:@supabase/supabase-js@2';

export async function requireAdmin(req: Request): Promise<boolean> {
  const auth = req.headers.get('Authorization') ?? '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  if (!token) return false;

  const client = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } }
  );

  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return false;

  const { data: profile } = await client.from('profiles').select('role').eq('id', user.id).single();
  return profile?.role === 'admin';
}

/** Email vérifié de l'utilisateur connecté (espace client), ou null. */
export async function getUserEmail(req: Request): Promise<string | null> {
  const auth = req.headers.get('Authorization') ?? '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;

  const client = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } }
  );

  const {
    data: { user },
  } = await client.auth.getUser();
  return user?.email ? user.email.toLowerCase() : null;
}
