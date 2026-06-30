// Agent commercial — IMPORT CSV : crée une liste 'manual' et insère les
// prospects déjà normalisés (le mapping des colonnes est fait côté admin).
// Conformité : prospection B2B uniquement, opt-out garanti à l'envoi.

import { serviceClient } from '../_shared/db.ts';
import { handleOptions, json } from '../_shared/cors.ts';
import { requireAdmin } from '../_shared/auth.ts';

interface Row {
  full_name?: string;
  first_name?: string;
  last_name?: string;
  title?: string;
  company?: string;
  company_domain?: string;
  email?: string;
  linkedin_url?: string;
  secteur?: string;
  localisation?: string;
  seniority?: string;
}
interface Input {
  list_name: string;
  rows: Row[];
}

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;
  if (!(await requireAdmin(req))) return json({ error: 'Réservé à l’administration.' }, 403);

  try {
    const { list_name, rows } = (await req.json()) as Input;
    if (!Array.isArray(rows) || rows.length === 0) return json({ error: 'Aucune ligne à importer.' }, 400);
    if (rows.length > 5000) return json({ error: 'Maximum 5000 lignes par import.' }, 400);

    const db = serviceClient();

    const { data: list, error } = await db
      .from('prospect_lists')
      .insert({ name: list_name?.trim() || 'Import CSV', source: 'manual', status: 'ready', count: 0 })
      .select()
      .single();
    if (error) throw error;

    const consentBasis = 'Intérêt légitime B2B (prospection professionnelle) — opt-out respecté';
    const clean = (s?: string) => (typeof s === 'string' && s.trim() ? s.trim() : null);

    const seen = new Set<string>();
    const mapped = rows
      .map((r) => {
        const first = clean(r.first_name);
        const last = clean(r.last_name);
        const full = clean(r.full_name) || [first, last].filter(Boolean).join(' ');
        const email = clean(r.email);
        return {
          list_id: list.id,
          full_name: full || email || 'Contact',
          first_name: first,
          last_name: last,
          title: clean(r.title),
          company: clean(r.company),
          company_domain: clean(r.company_domain),
          email,
          email_status: email ? 'guessed' : 'unknown',
          linkedin_url: clean(r.linkedin_url),
          secteur: clean(r.secteur),
          localisation: clean(r.localisation),
          seniority: clean(r.seniority),
          consent_basis: consentBasis,
          stage: 'new' as const,
        };
      })
      .filter((r) => {
        if (!r.email) return true; // on garde aussi les lignes sans email
        const k = r.email.toLowerCase();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });

    let inserted = 0;
    for (let i = 0; i < mapped.length; i += 200) {
      const batch = mapped.slice(i, i + 200);
      const { error: e } = await db.from('prospects').insert(batch);
      if (!e) inserted += batch.length;
    }
    await db.from('prospect_lists').update({ count: inserted }).eq('id', list.id);

    // Enchaîne l'enrichissement (score + angle IA) via l'orchestrateur.
    await db.from('agent_jobs').insert({ agent: 'apollo_enrich', payload: { list_id: list.id } });

    return json({ list_id: list.id, inserted });
  } catch (err) {
    console.error(err);
    return json({ error: 'Import CSV impossible.' }, 500);
  }
});
