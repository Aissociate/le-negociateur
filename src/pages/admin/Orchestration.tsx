import { useCallback, useEffect, useState } from 'react';
import { Play, RefreshCw } from 'lucide-react';
import { supabase, callFunction } from '../../lib/supabase';
import type { AgentJob } from '../../types';

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-paper/60',
  running: 'text-blue-300',
  done: 'text-emerald-400',
  failed: 'text-ember',
};

export default function Orchestration() {
  const [jobs, setJobs] = useState<AgentJob[]>([]);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    supabase
      .from('agent_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => setJobs((data as AgentJob[]) ?? []));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = jobs.reduce<Record<string, number>>((acc, j) => {
    acc[j.status] = (acc[j.status] ?? 0) + 1;
    return acc;
  }, {});

  async function tick() {
    setBusy(true);
    try {
      const r = await callFunction<{ processed: number; done: number; rescheduled: number; failed: number }>(
        'orchestrator',
        {}
      );
      setMsg(`Tick : ${r.processed} traités · ${r.done} done · ${r.rescheduled} reprogrammés · ${r.failed} échecs.`);
      load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Erreur.');
    }
    setBusy(false);
    setTimeout(() => setMsg(''), 6000);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-display text-3xl font-bold">Orchestration</h1>
        <div className="flex gap-2">
          <button onClick={load} className="text-sm flex items-center gap-1 bg-paper/10 px-3 py-2 rounded-lg">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <button
            onClick={tick}
            disabled={busy}
            className="text-sm flex items-center gap-1 bg-gold text-ink font-bold px-3 py-2 rounded-lg disabled:opacity-50"
          >
            <Play className="w-4 h-4" /> Traiter la file
          </button>
        </div>
      </div>
      <p className="text-paper/60 text-sm mb-6">
        File <code className="text-gold">agent_jobs</code> consommée par l'orchestrateur (cron toutes les 2 min). Jobs
        courts, idempotents, repris avec backoff. Types : <code>apollo_ingest</code>, <code>apollo_enrich</code>.
      </p>

      {msg && <p className="mb-4 text-gold font-semibold text-sm">{msg}</p>}

      <div className="flex gap-3 mb-8">
        {(['pending', 'running', 'done', 'failed'] as const).map((s) => (
          <div key={s} className="bg-paper/5 rounded-xl px-5 py-3">
            <p className="text-xs uppercase tracking-wide text-paper/50">{s}</p>
            <p className={`font-display text-2xl font-bold ${STATUS_COLORS[s]}`}>{counts[s] ?? 0}</p>
          </div>
        ))}
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-paper/50 border-b border-paper/10">
            <th className="py-2 pr-3">Créé</th>
            <th className="py-2 pr-3">Agent</th>
            <th className="py-2 pr-3">Statut</th>
            <th className="py-2 pr-3">Tentatives</th>
            <th className="py-2 pr-3">Prochaine exéc.</th>
            <th className="py-2">Dernière erreur</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((j) => (
            <tr key={j.id} className="border-b border-paper/5">
              <td className="py-2 pr-3 whitespace-nowrap text-paper/60">{new Date(j.created_at).toLocaleString('fr-FR')}</td>
              <td className="py-2 pr-3">{j.agent}</td>
              <td className={`py-2 pr-3 font-semibold ${STATUS_COLORS[j.status] ?? ''}`}>{j.status}</td>
              <td className="py-2 pr-3 text-center">{j.attempts}</td>
              <td className="py-2 pr-3 text-paper/60 whitespace-nowrap">{new Date(j.run_after).toLocaleString('fr-FR')}</td>
              <td className="py-2 text-paper/50 max-w-xs truncate">{j.last_error ?? '—'}</td>
            </tr>
          ))}
          {jobs.length === 0 && (
            <tr>
              <td colSpan={6} className="py-6 text-paper/40 text-center">Aucun job en file.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
