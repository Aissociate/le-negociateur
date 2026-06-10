import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { AgentConfig } from '../../types';

/**
 * Gestion des IA : pour chaque agent, modele LLM (slug OpenRouter), prompts,
 * temperature, plafond de tokens, interrupteur on/off.
 */
export default function Prompts() {
  const [configs, setConfigs] = useState<AgentConfig[]>([]);
  const [saved, setSaved] = useState('');

  useEffect(() => {
    supabase
      .from('agent_config')
      .select('*')
      .order('agent')
      .then(({ data }) => setConfigs((data as AgentConfig[]) ?? []));
  }, []);

  const update = (id: string, patch: Partial<AgentConfig>) =>
    setConfigs((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  async function save(config: AgentConfig) {
    const { error } = await supabase
      .from('agent_config')
      .update({
        model: config.model,
        system_prompt: config.system_prompt,
        user_prompt_template: config.user_prompt_template,
        temperature: config.temperature,
        max_tokens: config.max_tokens,
        enabled: config.enabled,
        updated_at: new Date().toISOString(),
      })
      .eq('id', config.id);
    setSaved(error ? `Erreur : ${error.message}` : `« ${config.label} » enregistré.`);
    setTimeout(() => setSaved(''), 4000);
  }

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-3xl font-bold mb-2">IA & Prompts</h1>
      <p className="text-paper/60 mb-8 text-sm">
        Chaque agent appelle OpenRouter avec le modèle et les prompts ci-dessous. Les variables{' '}
        <code className="text-gold">{'{{poste}}'}</code>, <code className="text-gold">{'{{secteur}}'}</code>,{' '}
        <code className="text-gold">{'{{seniorite}}'}</code>, <code className="text-gold">{'{{localisation}}'}</code>,{' '}
        <code className="text-gold">{'{{remuneration}}'}</code>, <code className="text-gold">{'{{market_low}}'}</code>,{' '}
        <code className="text-gold">{'{{market_median}}'}</code>, <code className="text-gold">{'{{market_high}}'}</code>,{' '}
        <code className="text-gold">{'{{gap_annual}}'}</code>, <code className="text-gold">{'{{gap_percent}}'}</code>{' '}
        sont remplacées automatiquement.
      </p>
      {saved && <p className="mb-4 text-gold font-semibold">{saved}</p>}

      <div className="space-y-8">
        {configs.map((c) => (
          <div key={c.id} className="bg-paper/5 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">{c.label}</h2>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={c.enabled}
                  onChange={(e) => update(c.id, { enabled: e.target.checked })}
                />
                Actif
              </label>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs text-paper/50 mb-1">Modèle (slug OpenRouter)</label>
                <input
                  value={c.model}
                  onChange={(e) => update(c.id, { model: e.target.value })}
                  className="w-full rounded-lg bg-ink border border-paper/20 px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-paper/50 mb-1">Température</label>
                  <input
                    type="number"
                    step={0.1}
                    min={0}
                    max={2}
                    value={c.temperature}
                    onChange={(e) => update(c.id, { temperature: Number(e.target.value) })}
                    className="w-full rounded-lg bg-ink border border-paper/20 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-paper/50 mb-1">Max tokens</label>
                  <input
                    type="number"
                    value={c.max_tokens}
                    onChange={(e) => update(c.id, { max_tokens: Number(e.target.value) })}
                    className="w-full rounded-lg bg-ink border border-paper/20 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs text-paper/50 mb-1">Prompt système</label>
              <textarea
                rows={5}
                value={c.system_prompt}
                onChange={(e) => update(c.id, { system_prompt: e.target.value })}
                className="w-full rounded-lg bg-ink border border-paper/20 px-3 py-2 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-paper/50 mb-1">Template du message utilisateur</label>
              <textarea
                rows={5}
                value={c.user_prompt_template}
                onChange={(e) => update(c.id, { user_prompt_template: e.target.value })}
                className="w-full rounded-lg bg-ink border border-paper/20 px-3 py-2 text-sm font-mono"
              />
            </div>
            <button
              onClick={() => save(c)}
              className="bg-gold text-ink font-bold px-5 py-2 rounded-lg text-sm"
            >
              Enregistrer
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
