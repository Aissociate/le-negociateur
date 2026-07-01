// Simulateur d'entretien IA : jeu de rôle de négociation salariale. L'IA joue le
// recruteur/manager, mène l'entretien selon un persona, avec tout le contexte du
// client (positionnement + profil détaillé). Réservé aux clients ayant l'accès.

import { serviceClient } from '../_shared/db.ts';
import { handleOptions, json } from '../_shared/cors.ts';
import { getUserEmail } from '../_shared/auth.ts';
import { getEntitlements } from '../_shared/entitlements.ts';
import { emailFromToken } from '../_shared/access.ts';
import { callLLMChat, ChatMessage } from '../_shared/llm.ts';
import { profileToText } from '../_shared/kit.ts';

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;

  const db = serviceClient();

  // deno-lint-ignore no-explicit-any
  const { messages, persona, token } = (await req.json()) as { messages: any[]; persona?: string; token?: string };
  if (!Array.isArray(messages)) return json({ error: 'messages requis.' }, 400);

  // Accès par token de capacité (lien direct) OU par session auth.
  const email = token ? await emailFromToken(db, token) : await getUserEmail(req);
  if (!email) return json({ error: 'Non authentifié.' }, 401);

  const ent = await getEntitlements(db, email);
  if (!ent.simulator) return json({ error: 'Accès au simulateur inactif.' }, 403);

  // Contexte client : dernier rapport + dernier profil détaillé
  const { data: lead } = await db.from('leads').select('*').eq('email', email).maybeSingle();
  const { data: report } = lead?.last_report_id
    ? await db.from('gap_reports').select('*').eq('id', lead.last_report_id).maybeSingle()
    : { data: null };
  const { data: kp } = lead
    ? await db
        .from('kit_profiles')
        .select('profile')
        .eq('lead_id', lead.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };

  const intel = (report?.intel ?? {}) as Record<string, unknown>;
  const contexte = [
    report
      ? `Poste : ${report.poste} | secteur ${report.secteur} | ${report.seniorite} | rému actuelle ${report.remuneration_actuelle} € | médiane marché ${report.market_median} € (haut ${report.market_high} €) | écart ${report.gap_annual} € (${report.gap_percent} %)${report.metier_en_tension ? ' | métier en tension' : ''}`
      : '',
    intel.percentile ? `Percentile INSEE : ${intel.percentile}` : '',
    kp?.profile ? profileToText(kp.profile) : '',
  ]
    .filter(Boolean)
    .join('\n');

  const vars = {
    persona: persona || 'Manager direct et factuel, attaché au budget, ouvert mais exigeant.',
    contexte: contexte || 'Profil non renseigné — mène un entretien générique de négociation salariale.',
    poste: report?.poste ?? 'cadre',
  };

  const trimmed: ChatMessage[] = messages.slice(-20).map((m) => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: String(m.content ?? '').slice(0, 4000),
  }));

  try {
    const out = await callLLMChat(db, 'simulateur_entretien', trimmed, vars);
    return json({ reply: out.text });
  } catch (err) {
    console.error(err);
    return json({ error: 'Le simulateur est momentanément indisponible.' }, 500);
  }
});
