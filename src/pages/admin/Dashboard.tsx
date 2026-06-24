import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { AgentRun } from '../../types';

interface Stats {
  leads: number;
  reports: number;
  orders: number;
  revenue: number;
  pendingUpdates: number;
  prospects: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [runs, setRuns] = useState<AgentRun[]>([]);

  useEffect(() => {
    (async () => {
      const [leads, reports, orders, updates, prospects, runsRes] = await Promise.all([
        supabase.from('leads').select('id', { count: 'exact', head: true }),
        supabase.from('gap_reports').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('amount, status'),
        supabase.from('benchmark_updates').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('prospects').select('id', { count: 'exact', head: true }),
        supabase.from('agent_runs').select('*').order('created_at', { ascending: false }).limit(15),
      ]);
      const paid = (orders.data ?? []).filter((o) => o.status === 'paid');
      setStats({
        leads: leads.count ?? 0,
        reports: reports.count ?? 0,
        orders: paid.length,
        revenue: paid.reduce((s, o) => s + (o.amount ?? 0), 0) / 100,
        pendingUpdates: updates.count ?? 0,
        prospects: prospects.count ?? 0,
      });
      setRuns((runsRes.data as AgentRun[]) ?? []);
    })();
  }, []);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-8">Tableau de bord</h1>
      <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
        <Card label="Leads capturés" value={stats?.leads} />
        <Card label="Analyses générées" value={stats?.reports} />
        <Card label="Kits vendus" value={stats?.orders} />
        <Card label="CA (€)" value={stats?.revenue} />
        <Card label="Prospects" value={stats?.prospects} />
        <Card label="MAJ à valider" value={stats?.pendingUpdates} highlight={(stats?.pendingUpdates ?? 0) > 0} />
      </div>

      <h2 className="font-display text-xl font-bold mb-4">Derniers runs IA</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-paper/50 border-b border-paper/10">
            <th className="py-2 pr-4">Date</th>
            <th className="py-2 pr-4">Agent</th>
            <th className="py-2 pr-4">Statut</th>
            <th className="py-2 pr-4">Tokens (in/out)</th>
            <th className="py-2 pr-4">Durée</th>
            <th className="py-2">Détail</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((r) => (
            <tr key={r.id} className="border-b border-paper/5">
              <td className="py-2 pr-4 whitespace-nowrap">{new Date(r.created_at).toLocaleString('fr-FR')}</td>
              <td className="py-2 pr-4">{r.agent}</td>
              <td className={`py-2 pr-4 ${r.status === 'error' ? 'text-ember' : 'text-gold'}`}>{r.status}</td>
              <td className="py-2 pr-4">{r.tokens_in} / {r.tokens_out}</td>
              <td className="py-2 pr-4">{r.duration_ms} ms</td>
              <td className="py-2 text-paper/60 max-w-xs truncate">{r.detail}</td>
            </tr>
          ))}
          {runs.length === 0 && (
            <tr>
              <td colSpan={6} className="py-6 text-paper/40 text-center">Aucun run IA pour l'instant.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Card({ label, value, highlight }: { label: string; value?: number; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-5 ${highlight ? 'bg-ember/20 border border-ember' : 'bg-paper/5'}`}>
      <p className="text-paper/50 text-xs uppercase tracking-wide">{label}</p>
      <p className="font-display text-3xl font-bold mt-1">{value ?? '—'}</p>
    </div>
  );
}
