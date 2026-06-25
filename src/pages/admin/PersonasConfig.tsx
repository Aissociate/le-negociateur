import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { SimulatorPersona } from '../../types';

/** Gestion des personas du Simulateur d'entretien (profils de recruteur). */
export default function PersonasConfig() {
  const [items, setItems] = useState<SimulatorPersona[]>([]);
  const [saved, setSaved] = useState('');

  const load = useCallback(() => {
    supabase.from('simulator_personas').select('*').order('position').then(({ data }) => setItems((data as SimulatorPersona[]) ?? []));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const update = (id: string, patch: Partial<SimulatorPersona>) =>
    setItems((s) => s.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  async function save(p: SimulatorPersona) {
    const { error } = await supabase
      .from('simulator_personas')
      .update({ label: p.label, prompt: p.prompt, position: p.position, active: p.active })
      .eq('id', p.id);
    setSaved(error ? `Erreur : ${error.message}` : `« ${p.label} » enregistré.`);
    setTimeout(() => setSaved(''), 3000);
  }
  async function add() {
    await supabase.from('simulator_personas').insert({
      key: 'persona-' + Math.random().toString(36).slice(2, 7),
      label: 'Nouveau persona',
      prompt: '',
      position: items.length + 1,
      active: false,
    });
    load();
  }
  async function del(id: string) {
    await supabase.from('simulator_personas').delete().eq('id', id);
    load();
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-display text-3xl font-bold">Personas du simulateur</h1>
        <button onClick={add} className="bg-paper/10 hover:bg-paper/20 px-4 py-2 rounded-lg text-sm">+ Ajouter</button>
      </div>
      <p className="text-paper/60 text-sm mb-8">
        Chaque persona définit le profil de recruteur incarné par l'IA (injecté dans <code className="text-gold">{'{{persona}}'}</code>).
        Le poste et le contexte du client sont ajoutés automatiquement. Le comportement global est éditable dans{' '}
        <code className="text-gold">IA &amp; Prompts</code> (agent <code className="text-gold">simulateur_entretien</code>).
      </p>
      {saved && <p className="mb-4 text-gold font-semibold">{saved}</p>}

      <div className="space-y-6">
        {items.map((p) => (
          <div key={p.id} className="bg-paper/5 rounded-xl p-6 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <input
                value={p.label}
                onChange={(e) => update(p.id, { label: e.target.value })}
                className="font-display text-lg font-bold bg-transparent border-b border-paper/20 focus:border-gold focus:outline-none flex-1"
              />
              <div className="flex items-center gap-4 text-sm shrink-0">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={p.active} onChange={(e) => update(p.id, { active: e.target.checked })} /> Actif
                </label>
                <button onClick={() => del(p.id)} className="text-ember text-xs">Supprimer</button>
              </div>
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-3 items-start">
              <textarea
                rows={3}
                value={p.prompt}
                onChange={(e) => update(p.id, { prompt: e.target.value })}
                placeholder="Décrivez le comportement du recruteur…"
                className="w-full rounded-lg bg-ink border border-paper/20 px-3 py-2 text-sm"
              />
              <div className="w-24">
                <label className="block text-xs text-paper/50 mb-1">Position</label>
                <input
                  type="number"
                  value={p.position}
                  onChange={(e) => update(p.id, { position: Number(e.target.value) })}
                  className="w-full rounded-lg bg-ink border border-paper/20 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <button onClick={() => save(p)} className="bg-gold text-ink font-bold px-5 py-2 rounded-lg text-sm">Enregistrer</button>
          </div>
        ))}
        {items.length === 0 && <p className="text-paper/40 text-sm">Aucun persona. Ajoutez-en un.</p>}
      </div>
    </div>
  );
}
