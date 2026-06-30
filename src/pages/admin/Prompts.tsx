import { useEffect, useState } from 'react';
import { supabase, callAdminFunction } from '../../lib/supabase';
import type { AgentConfig } from '../../types';

interface TestResult {
  ok: boolean;
  text?: string;
  error?: string;
  model?: string;
  tokens_out?: number;
  ms?: number;
}

/**
 * Gestion des IA : pour chaque agent, modèle LLM (slug OpenRouter), prompts,
 * température, plafond de tokens, interrupteur on/off. Sans redéploiement.
 */
export default function Prompts() {
  const [configs, setConfigs] = useState<AgentConfig[]>([]);
  const [saved, setSaved] = useState('');
  const [testing, setTesting] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, TestResult>>({});

  async function test(config: AgentConfig) {
    setTesting(config.id);
    try {
      const r = await callAdminFunction<TestResult>('agent-test', { agent: config.agent });
      setResults((m) => ({ ...m, [config.id]: r }));
    } catch (e) {
      setResults((m) => ({ ...m, [config.id]: { ok: false, error: e instanceof Error ? e.message : 'Erreur' } }));
    }
    setTesting(null);
  }

  useEffect(() => {
    supabase.from('agent_config').select('*').order('agent').then(({ data }) => setConfigs((data as AgentConfig[]) ?? []));
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
      <h1 className="font-display text-3xl font-bold mb-2">IA &amp; Prompts</h1>
      <p className="text-paper/60 mb-8 text-sm">
        Chaque agent appelle OpenRouter avec le modèle et les prompts ci-dessous. Les variables entre{' '}
        <code className="text-gold">{'{{...}}'}</code> (poste, secteur, marché, écart, tension…) sont remplacées
        automatiquement à l'exécution.
      </p>
      {saved && <p className="mb-4 text-gold font-semibold">{saved}</p>}

      <div className="space-y-8">
        {configs.map((c) => (
          <div key={c.id} className="bg-paper/5 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">{c.label}</h2>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={c.enabled} onChange={(e) => update(c.id, { enabled: e.target.checked })} />
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
            <div className="flex items-center gap-3">
              <button onClick={() => save(c)} className="bg-gold text-ink font-bold px-5 py-2 rounded-lg text-sm">
                Enregistrer
              </button>
              <button
                onClick={() => test(c)}
                disabled={testing === c.id}
                className="border border-gold/50 text-gold px-5 py-2 rounded-lg text-sm disabled:opacity-50"
                title="Lance un vrai appel LLM avec des valeurs d'exemple"
              >
                {testing === c.id ? 'Test en cours…' : 'Tester'}
              </button>
            </div>
            {results[c.id] && (
              <div
                className={`rounded-lg p-3 text-sm ${
                  results[c.id].ok ? 'bg-paper/5 border border-paper/10' : 'bg-ember/10 border border-ember/40'
                }`}
              >
                {results[c.id].ok ? (
                  <>
                    <p className="text-xs text-paper/50 mb-2">
                      ✅ {results[c.id].model} · {results[c.id].tokens_out} tokens · {results[c.id].ms} ms
                    </p>
                    <pre className="whitespace-pre-wrap break-words font-sans text-paper/80 max-h-72 overflow-auto">
                      {results[c.id].text}
                    </pre>
                  </>
                ) : (
                  <p className="text-ember">❌ {results[c.id].error}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
