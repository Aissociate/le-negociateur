import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Lead } from '../../types';

const SEGMENT_COLORS: Record<string, string> = {
  'sous-payé fort': 'bg-ember/20 text-ember',
  'sous-payé léger': 'bg-gold/20 text-gold',
  aligné: 'bg-paper/10 text-paper/70',
  'au-dessus': 'bg-emerald-500/20 text-emerald-400',
};

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(300)
      .then(({ data }) => setLeads((data as Lead[]) ?? []));
  }, []);

  const filtered = leads.filter((l) =>
    `${l.email} ${l.poste} ${l.secteur} ${l.segment ?? ''} ${l.statut}`.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-6">Leads — CRM ({leads.length})</h1>
      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filtrer (email, poste, secteur, segment, statut)…"
        className="w-full max-w-md rounded-lg bg-ink border border-paper/20 px-4 py-2 mb-4 text-sm"
      />
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-paper/50 border-b border-paper/10">
            <th className="py-2 pr-3">Date</th>
            <th className="py-2 pr-3">Email</th>
            <th className="py-2 pr-3">Poste</th>
            <th className="py-2 pr-3">Secteur</th>
            <th className="py-2 pr-3">Rému (€)</th>
            <th className="py-2 pr-3">Écart</th>
            <th className="py-2 pr-3">Segment</th>
            <th className="py-2 pr-3">Statut</th>
            <th className="py-2 pr-3">A/B</th>
            <th className="py-2 pr-3">Email n°</th>
            <th className="py-2">Prochain envoi</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((l) => (
            <tr key={l.id} className="border-b border-paper/5">
              <td className="py-2 pr-3 whitespace-nowrap text-paper/60">{new Date(l.created_at).toLocaleDateString('fr-FR')}</td>
              <td className="py-2 pr-3">{l.email}</td>
              <td className="py-2 pr-3">{l.poste}</td>
              <td className="py-2 pr-3 text-paper/70">{l.secteur}</td>
              <td className="py-2 pr-3">{l.remuneration_actuelle?.toLocaleString('fr-FR')}</td>
              <td className="py-2 pr-3 text-paper/70">{l.gap_annual != null ? `${l.gap_annual.toLocaleString('fr-FR')} €` : '—'}</td>
              <td className="py-2 pr-3">
                {l.segment && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${SEGMENT_COLORS[l.segment] ?? 'bg-paper/10'}`}>
                    {l.segment}
                  </span>
                )}
              </td>
              <td className={`py-2 pr-3 ${l.statut === 'client' ? 'text-gold font-semibold' : 'text-paper/60'}`}>{l.statut}</td>
              <td className="py-2 pr-3 text-paper/50">{l.ab_variant ?? '—'}</td>
              <td className="py-2 pr-3 text-center">{l.sequence_step}/4</td>
              <td className="py-2 text-paper/60 whitespace-nowrap">
                {l.next_email_at ? new Date(l.next_email_at).toLocaleString('fr-FR') : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
