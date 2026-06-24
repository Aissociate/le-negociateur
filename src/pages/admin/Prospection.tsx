import { useCallback, useEffect, useState } from 'react';
import { ShieldAlert, RefreshCw, Sparkles, Download } from 'lucide-react';
import { supabase, callAdminFunction } from '../../lib/supabase';
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

export default function Prospection() {
  const [lists, setLists] = useState<ProspectList[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  // Formulaire d'import
  const [listName, setListName] = useState('');
  const [searchUrl, setSearchUrl] = useState('');
  const [maxResults, setMaxResults] = useState(50);
  const [actorId, setActorId] = useState('');
  const [override, setOverride] = useState('');

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

      {/* Listes */}
      <h2 className="font-display text-xl font-bold mb-3">Listes ({lists.length})</h2>
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
                <th className="py-2">Angle IA</th>
              </tr>
            </thead>
            <tbody>
              {prospects.map((p) => (
                <tr key={p.id} className="border-b border-paper/5">
                  <td className="py-2 pr-3 font-bold text-gold">{p.score}</td>
                  <td className="py-2 pr-3">
                    {p.linkedin_url ? (
                      <a href={p.linkedin_url} target="_blank" rel="noreferrer" className="underline hover:text-gold">
                        {p.full_name}
                      </a>
                    ) : (
                      p.full_name
                    )}
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
                  <td className="py-2 text-paper/60 max-w-xs truncate">
                    {(p.enrichment?.angle as string) ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
