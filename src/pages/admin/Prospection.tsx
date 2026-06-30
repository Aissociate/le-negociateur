import { useCallback, useEffect, useState } from 'react';
import { ShieldAlert, RefreshCw, Sparkles, Download, Upload, Mail, Send } from 'lucide-react';
import { supabase, callAdminFunction } from '../../lib/supabase';
import { parseCSV, guessMapping } from '../../lib/csv';
import type { Prospect, ProspectList } from '../../types';

const STAGE_COLORS: Record<string, string> = {
  new: 'bg-paper/10 text-paper/70',
  enriched: 'bg-gold/20 text-gold',
  queued: 'bg-blue-500/20 text-blue-300',
  contacted: 'bg-blue-500/20 text-blue-300',
  replied: 'bg-emerald-500/20 text-emerald-400',
  won: 'bg-emerald-500/20 text-emerald-400',
  lost: 'bg-ember/20 text-ember',
  unsubscribed: 'bg-ember/20 text-ember',
};

// Champs cibles de l'import CSV + synonymes pour le mapping automatique.
const FIELDS: { key: string; label: string }[] = [
  { key: 'email', label: 'Email' },
  { key: 'full_name', label: 'Nom complet' },
  { key: 'first_name', label: 'Prénom' },
  { key: 'last_name', label: 'Nom' },
  { key: 'title', label: 'Poste / titre' },
  { key: 'company', label: 'Entreprise' },
  { key: 'company_domain', label: 'Domaine / site' },
  { key: 'linkedin_url', label: 'LinkedIn' },
  { key: 'secteur', label: 'Secteur' },
  { key: 'localisation', label: 'Localisation' },
  { key: 'seniority', label: 'Séniorité' },
];
const SYNONYMS: Record<string, string[]> = {
  email: ['email', 'mail', 'e-mail', 'courriel', 'adresse email', 'work email'],
  full_name: ['full name', 'nom complet', 'name', 'nom', 'contact'],
  first_name: ['first name', 'prénom', 'prenom', 'firstname'],
  last_name: ['last name', 'nom de famille', 'lastname', 'surname'],
  title: ['title', 'poste', 'titre', 'fonction', 'job title', 'headline'],
  company: ['company', 'entreprise', 'société', 'societe', 'organization', 'organisation'],
  company_domain: ['domain', 'domaine', 'website', 'site', 'company domain'],
  linkedin_url: ['linkedin', 'linkedin url', 'profil linkedin'],
  secteur: ['secteur', 'industry', 'industrie'],
  localisation: ['localisation', 'location', 'ville', 'city', 'pays', 'country', 'région', 'region'],
  seniority: ['seniority', 'séniorité', 'seniorité', 'niveau', 'level'],
};

export default function Prospection() {
  const [lists, setLists] = useState<ProspectList[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [detail, setDetail] = useState<Prospect | null>(null);

  // Formulaire d'import
  const [listName, setListName] = useState('');
  const [searchUrl, setSearchUrl] = useState('');
  const [maxResults, setMaxResults] = useState(50);
  const [actorId, setActorId] = useState('');
  const [override, setOverride] = useState('');

  // Import CSV (ta base) + mapping
  const [csvName, setCsvName] = useState('');
  const [csvListName, setCsvListName] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [dataRows, setDataRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, number>>({});

  const loadLists = useCallback(() => {
    supabase
      .from('prospect_lists')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => setLists((data as ProspectList[]) ?? []));
  }, []);

  useEffect(() => {
    loadLists();
  }, [loadLists]);

  useEffect(() => {
    if (!selected) {
      setProspects([]);
      return;
    }
    supabase
      .from('prospects')
      .select('*')
      .eq('list_id', selected)
      .order('score', { ascending: false })
      .limit(500)
      .then(({ data }) => setProspects((data as Prospect[]) ?? []));
  }, [selected, msg]);

  function flash(m: string) {
    setMsg(m);
    setTimeout(() => setMsg(''), 5000);
  }

  async function startImport() {
    setBusy(true);
    try {
      let parsedOverride: Record<string, unknown> | undefined;
      if (override.trim()) {
        try {
          parsedOverride = JSON.parse(override);
        } catch {
          setBusy(false);
          flash('Override JSON invalide.');
          return;
        }
      }
      const res = await callAdminFunction<{ list_id: string }>('prospect-import', {
        list_name: listName,
        criteria: { apollo_search_url: searchUrl || undefined, override: parsedOverride },
        actor_id: actorId || undefined,
        max_results: maxResults,
      });
      flash(`Import lancé (liste ${res.list_id.slice(0, 8)}…). Cliquez « Ingérer » quand le run Apify est terminé.`);
      setListName('');
      setSearchUrl('');
      loadLists();
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Erreur import.');
    }
    setBusy(false);
  }

  async function ingest(listId: string) {
    setBusy(true);
    try {
      const res = await callAdminFunction<{ status: string; inserted: number; total?: number }>('prospect-ingest', {
        list_id: listId,
      });
      flash(`Ingestion : ${res.inserted} ajoutés (run ${res.status}).`);
      loadLists();
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Erreur ingestion.');
    }
    setBusy(false);
  }

  async function enrich(listId: string) {
    setBusy(true);
    try {
      const res = await callAdminFunction<{ enriched: number }>('prospect-enrich', { list_id: listId, limit: 10 });
      flash(`${res.enriched} prospects enrichis + scorés. Relancez pour traiter le lot suivant.`);
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Erreur enrichissement.');
    }
    setBusy(false);
  }

  function onCsvFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvName(file.name);
    setCsvListName(file.name.replace(/\.csv$/i, ''));
    const reader = new FileReader();
    reader.onload = () => {
      const all = parseCSV(String(reader.result ?? ''));
      if (all.length < 2) {
        flash('CSV vide ou sans données.');
        return;
      }
      const hdr = all[0];
      setHeaders(hdr);
      setDataRows(all.slice(1));
      setMapping(guessMapping(hdr, SYNONYMS));
    };
    reader.readAsText(file);
  }

  async function importCsv() {
    if (!dataRows.length) {
      flash('Charge un CSV d’abord.');
      return;
    }
    setBusy(true);
    try {
      const rows = dataRows.map((r) => {
        const obj: Record<string, string> = {};
        FIELDS.forEach((f) => {
          const idx = mapping[f.key];
          if (idx != null && idx >= 0 && r[idx] != null && r[idx].trim()) obj[f.key] = r[idx].trim();
        });
        return obj;
      });
      const res = await callAdminFunction<{ inserted: number }>('prospect-import-csv', {
        list_name: csvListName,
        rows,
      });
      flash(`${res.inserted} prospects importés. Enrichissement (score + angle IA) lancé en arrière-plan.`);
      setHeaders([]);
      setDataRows([]);
      setCsvName('');
      setMapping({});
      loadLists();
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Erreur import CSV.');
    }
    setBusy(false);
  }

  async function toggleOutreach(list: ProspectList) {
    setBusy(true);
    const { error } = await supabase
      .from('prospect_lists')
      .update({ outreach_active: !list.outreach_active })
      .eq('id', list.id);
    if (error) flash(error.message);
    else {
      flash(list.outreach_active ? 'Envoi mis en pause.' : 'Envoi activé — le cron enverra par lots de 25 (toutes les 10 min).');
      loadLists();
    }
    setBusy(false);
  }

  async function sendBatch() {
    setBusy(true);
    try {
      const res = await callAdminFunction<{ sent: number; errors?: number }>('prospect-outreach', {});
      flash(`Lot envoyé : ${res.sent} email(s)${res.errors ? `, ${res.errors} erreur(s)` : ''}.`);
      loadLists();
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Erreur envoi.');
    }
    setBusy(false);
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-2">Prospection — agent commercial</h1>

      <div className="flex items-start gap-2 text-xs text-paper/70 bg-paper/5 border border-paper/10 rounded-lg p-3 mb-8">
        <ShieldAlert className="w-4 h-4 text-gold shrink-0 mt-0.5" />
        <p>
          <strong>Conformité RGPD/CNIL :</strong> prospection <strong>B2B uniquement</strong> (intérêt légitime
          documenté), pas d'achat de bases B2C, pas de données sensibles. Chaque envoi doit proposer une désinscription
          ; un prospect « unsubscribed » n'est jamais recontacté. L'enrichissement passe par <strong>Apify</strong>{' '}
          (scraper Apollo) et l'IA OpenRouter.
        </p>
      </div>

      {msg && <p className="mb-4 text-gold font-semibold text-sm">{msg}</p>}

      {/* Import */}
      <div className="bg-paper/5 rounded-xl p-6 mb-10 max-w-3xl">
        <h2 className="font-display text-xl font-bold mb-4">Nouvelle liste (Apollo via Apify)</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs text-paper/50 mb-1">Nom de la liste</label>
            <input
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              placeholder="Ex. DSI Tech Île-de-France"
              className="w-full rounded-lg bg-ink border border-paper/20 px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs text-paper/50 mb-1">URL de recherche Apollo</label>
            <input
              value={searchUrl}
              onChange={(e) => setSearchUrl(e.target.value)}
              placeholder="https://app.apollo.io/#/people?..."
              className="w-full rounded-lg bg-ink border border-paper/20 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-paper/50 mb-1">Nombre max de prospects</label>
            <input
              type="number"
              value={maxResults}
              onChange={(e) => setMaxResults(Number(e.target.value))}
              className="w-full rounded-lg bg-ink border border-paper/20 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-paper/50 mb-1">Actor Apify (optionnel, sinon défaut)</label>
            <input
              value={actorId}
              onChange={(e) => setActorId(e.target.value)}
              placeholder="ex. code_crafter~apollo-io-scraper"
              className="w-full rounded-lg bg-ink border border-paper/20 px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs text-paper/50 mb-1">Override input actor (JSON, optionnel)</label>
            <textarea
              rows={3}
              value={override}
              onChange={(e) => setOverride(e.target.value)}
              placeholder='{"fileName": "...", "..." : "..."}'
              className="w-full rounded-lg bg-ink border border-paper/20 px-3 py-2 text-sm font-mono"
            />
          </div>
        </div>
        <button
          onClick={startImport}
          disabled={busy}
          className="mt-4 bg-gold text-ink font-bold px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50"
        >
          <Download className="w-4 h-4" /> Lancer l'import
        </button>
      </div>

      {/* Import CSV (ta base) */}
      <div className="bg-paper/5 rounded-xl p-6 mb-10 max-w-3xl">
        <h2 className="font-display text-xl font-bold mb-1">Importer ta base (CSV)</h2>
        <p className="text-xs text-paper/50 mb-4">
          Charge un fichier CSV, associe tes colonnes aux champs, puis importe. Délimiteur (<code>,</code> ou{' '}
          <code>;</code>) détecté automatiquement. Prospection <strong>B2B</strong> uniquement.
        </p>
        <input type="file" accept=".csv,text/csv" onChange={onCsvFile} className="text-sm text-paper/70" />

        {headers.length > 0 && (
          <div className="mt-5">
            <div className="mb-4">
              <label className="block text-xs text-paper/50 mb-1">Nom de la liste</label>
              <input
                value={csvListName}
                onChange={(e) => setCsvListName(e.target.value)}
                className="w-full max-w-sm rounded-lg bg-ink border border-paper/20 px-3 py-2 text-sm"
              />
            </div>
            <p className="text-xs text-paper/50 mb-2 uppercase tracking-wide">Associe tes colonnes</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {FIELDS.map((f) => (
                <div key={f.key}>
                  <label className="block text-xs text-paper/50 mb-1">
                    {f.label}
                    {f.key === 'email' && <span className="text-gold"> *</span>}
                  </label>
                  <select
                    value={mapping[f.key] ?? -1}
                    onChange={(e) => setMapping((m) => ({ ...m, [f.key]: Number(e.target.value) }))}
                    className="w-full rounded-lg bg-ink border border-paper/20 px-3 py-2 text-sm"
                  >
                    <option value={-1}>— ignorer —</option>
                    {headers.map((h, i) => (
                      <option key={i} value={i}>
                        {h || `Colonne ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <p className="text-xs text-paper/40 mt-3">
              {dataRows.length} ligne(s) détectée(s) dans « {csvName} ».
            </p>
            <button
              onClick={importCsv}
              disabled={busy}
              className="mt-4 bg-gold text-ink font-bold px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50"
            >
              <Upload className="w-4 h-4" /> Importer {dataRows.length} prospect(s)
            </button>
          </div>
        )}
      </div>

      {/* Listes */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-xl font-bold">Listes ({lists.length})</h2>
        <button
          onClick={sendBatch}
          disabled={busy}
          className="text-xs flex items-center gap-1 bg-gold/20 text-gold px-3 py-1.5 rounded disabled:opacity-50"
          title="Envoie immédiatement un lot aux listes dont l'envoi est activé"
        >
          <Send className="w-3 h-3" /> Envoyer un lot maintenant
        </button>
      </div>
      <table className="w-full text-sm mb-10">
        <thead>
          <tr className="text-left text-paper/50 border-b border-paper/10">
            <th className="py-2 pr-3">Nom</th>
            <th className="py-2 pr-3">Source</th>
            <th className="py-2 pr-3">Statut</th>
            <th className="py-2 pr-3">Prospects</th>
            <th className="py-2 pr-3">Créée</th>
            <th className="py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {lists.map((l) => (
            <tr key={l.id} className="border-b border-paper/5">
              <td className="py-2 pr-3 font-semibold">{l.name}</td>
              <td className="py-2 pr-3 text-paper/70">{l.source}</td>
              <td className="py-2 pr-3 text-paper/70">{l.status}</td>
              <td className="py-2 pr-3">{l.count}</td>
              <td className="py-2 pr-3 text-paper/50 whitespace-nowrap">{new Date(l.created_at).toLocaleDateString('fr-FR')}</td>
              <td className="py-2 flex flex-wrap gap-2">
                <button onClick={() => ingest(l.id)} disabled={busy} className="text-xs flex items-center gap-1 bg-paper/10 px-2.5 py-1 rounded disabled:opacity-50">
                  <RefreshCw className="w-3 h-3" /> Ingérer
                </button>
                <button onClick={() => enrich(l.id)} disabled={busy} className="text-xs flex items-center gap-1 bg-paper/10 px-2.5 py-1 rounded disabled:opacity-50">
                  <Sparkles className="w-3 h-3" /> Enrichir
                </button>
                <button
                  onClick={() => toggleOutreach(l)}
                  disabled={busy}
                  className={`text-xs flex items-center gap-1 px-2.5 py-1 rounded disabled:opacity-50 ${
                    l.outreach_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-paper/10'
                  }`}
                >
                  <Mail className="w-3 h-3" /> {l.outreach_active ? 'Envoi ON' : "Activer l'envoi"}
                </button>
                <button onClick={() => setSelected(l.id)} className="text-xs text-gold font-bold px-2.5 py-1">
                  Voir
                </button>
              </td>
            </tr>
          ))}
          {lists.length === 0 && (
            <tr>
              <td colSpan={6} className="py-6 text-paper/40 text-center">Aucune liste pour l'instant.</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Prospects de la liste sélectionnée */}
      {selected && (
        <div>
          <h2 className="font-display text-xl font-bold mb-3">Prospects ({prospects.length})</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-paper/50 border-b border-paper/10">
                <th className="py-2 pr-3">Score</th>
                <th className="py-2 pr-3">Nom</th>
                <th className="py-2 pr-3">Titre</th>
                <th className="py-2 pr-3">Entreprise</th>
                <th className="py-2 pr-3">Email</th>
                <th className="py-2 pr-3">Stage</th>
                <th className="py-2 pr-3">Angle IA</th>
                <th className="py-2">Recherche web</th>
              </tr>
            </thead>
            <tbody>
              {prospects.map((p) => (
                <tr key={p.id} className="border-b border-paper/5">
                  <td className="py-2 pr-3 font-bold text-gold">{p.score}</td>
                  <td className="py-2 pr-3">
                    <button
                      onClick={() => setDetail(p)}
                      className="underline hover:text-gold text-left"
                      title="Voir la fiche complète"
                    >
                      {p.full_name}
                    </button>
                  </td>
                  <td className="py-2 pr-3 text-paper/70">{p.title ?? '—'}</td>
                  <td className="py-2 pr-3 text-paper/70">{p.company ?? '—'}</td>
                  <td className="py-2 pr-3 text-paper/60">
                    {p.email ?? '—'}
                    {p.email && <span className="ml-1 text-xs text-paper/40">({p.email_status})</span>}
                  </td>
                  <td className="py-2 pr-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${STAGE_COLORS[p.stage] ?? 'bg-paper/10'}`}>
                      {p.stage}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-paper/60 max-w-xs truncate">
                    {(p.enrichment?.angle as string) ?? '—'}
                  </td>
                  <td className="py-2 text-paper/60 max-w-sm">
                    {(() => {
                      const r = p.enrichment?.research as
                        | { summary?: string; sources?: string[] }
                        | null
                        | undefined;
                      if (!r?.summary) return <span className="text-paper/30">—</span>;
                      return (
                        <div className="space-y-1">
                          <p className="line-clamp-2" title={r.summary}>
                            {r.summary}
                          </p>
                          {!!r.sources?.length && (
                            <div className="flex flex-wrap gap-1.5 text-xs">
                              {r.sources.slice(0, 3).map((s, i) => (
                                <a
                                  key={i}
                                  href={s}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-gold/80 underline hover:text-gold"
                                >
                                  source {i + 1}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Fiche prospect détaillée */}
      {detail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setDetail(null)}
        >
          <div
            className="bg-ink border border-paper/15 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const r = detail.enrichment?.research as
                | {
                    summary?: string;
                    company_context?: string;
                    role_context?: string;
                    hooks?: string[];
                    sources?: string[];
                  }
                | null
                | undefined;
              return (
                <>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-display text-2xl font-bold">{detail.full_name}</h3>
                      <p className="text-paper/60 text-sm">
                        {[detail.title, detail.company].filter(Boolean).join(' · ') || '—'}
                      </p>
                    </div>
                    <button
                      onClick={() => setDetail(null)}
                      className="text-paper/50 hover:text-paper text-3xl leading-none"
                    >
                      ×
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-5 text-xs">
                    <span className="px-2 py-0.5 rounded-full bg-gold/20 text-gold font-bold">Score {detail.score}</span>
                    <span className={`px-2 py-0.5 rounded-full ${STAGE_COLORS[detail.stage] ?? 'bg-paper/10'}`}>
                      {detail.stage}
                    </span>
                    {detail.secteur && <span className="px-2 py-0.5 rounded-full bg-paper/10">{detail.secteur}</span>}
                    {detail.localisation && (
                      <span className="px-2 py-0.5 rounded-full bg-paper/10">{detail.localisation}</span>
                    )}
                    {detail.seniority && <span className="px-2 py-0.5 rounded-full bg-paper/10">{detail.seniority}</span>}
                  </div>

                  <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm mb-5">
                    <Field label="Email">{detail.email ? `${detail.email} (${detail.email_status})` : '—'}</Field>
                    <Field label="LinkedIn">
                      {detail.linkedin_url ? (
                        <a className="text-gold underline" href={detail.linkedin_url} target="_blank" rel="noreferrer">
                          profil
                        </a>
                      ) : (
                        '—'
                      )}
                    </Field>
                    <Field label="Domaine">{detail.company_domain ?? '—'}</Field>
                    <Field label="Contacté le">
                      {detail.contacted_at ? new Date(detail.contacted_at).toLocaleString('fr-FR') : '—'}
                    </Field>
                    <Field label="Base légale (RGPD)">{detail.consent_basis ?? '—'}</Field>
                    <Field label="Créé le">{new Date(detail.created_at).toLocaleDateString('fr-FR')}</Field>
                  </dl>

                  {(detail.enrichment?.angle as string) && (
                    <Section title="Angle d'approche IA">
                      <p>{detail.enrichment?.angle as string}</p>
                      {(detail.enrichment?.rationale as string) && (
                        <p className="text-paper/50 text-xs mt-1">{detail.enrichment?.rationale as string}</p>
                      )}
                    </Section>
                  )}

                  <Section title="Recherche web (Perplexity)">
                    {r?.summary ? (
                      <>
                        <p>{r.summary}</p>
                        {r.company_context && (
                          <p className="mt-2">
                            <span className="text-paper/50">Société : </span>
                            {r.company_context}
                          </p>
                        )}
                        {r.role_context && (
                          <p className="mt-1">
                            <span className="text-paper/50">Rôle : </span>
                            {r.role_context}
                          </p>
                        )}
                        {!!r.hooks?.length && (
                          <ul className="mt-2 list-disc list-inside text-paper/80">
                            {r.hooks.map((h, i) => (
                              <li key={i}>{h}</li>
                            ))}
                          </ul>
                        )}
                        {!!r.sources?.length && (
                          <div className="mt-2 flex flex-wrap gap-2 text-xs">
                            {r.sources.map((s, i) => (
                              <a key={i} href={s} target="_blank" rel="noreferrer" className="text-gold/80 underline">
                                source {i + 1}
                              </a>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-paper/40">Pas encore enrichi — lance « Enrichir » sur la liste.</p>
                    )}
                  </Section>

                  {detail.notes && (
                    <Section title="Notes">
                      <p>{detail.notes}</p>
                    </Section>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-paper/50 text-xs">{label}</dt>
      <dd className="text-paper/85">{children}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 bg-paper/5 rounded-lg p-3 text-sm text-paper/85">
      <p className="text-xs uppercase tracking-wide text-paper/40 mb-1">{title}</p>
      {children}
    </div>
  );
}
