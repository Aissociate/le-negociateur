import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { OtoStep, Product } from '../../types';

/** Configuration du tunnel OTO (upsell/downsell post-achat, façon ClickFunnels). */
export default function OtoConfig() {
  const [steps, setSteps] = useState<OtoStep[]>([]);
  const [products, setProducts] = useState<Pick<Product, 'slug' | 'name'>[]>([]);
  const [saved, setSaved] = useState('');

  const load = useCallback(() => {
    supabase.from('oto_steps').select('*').order('position').then(({ data }) => setSteps((data as OtoStep[]) ?? []));
    supabase.from('products').select('slug, name').then(({ data }) => setProducts((data as Product[]) ?? []));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const update = (id: string, patch: Partial<OtoStep>) =>
    setSteps((s) => s.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  async function save(s: OtoStep) {
    const { error } = await supabase
      .from('oto_steps')
      .update({
        position: s.position,
        headline: s.headline,
        subhead: s.subhead,
        upsell_slug: s.upsell_slug,
        downsell_slug: s.downsell_slug || null,
        active: s.active,
      })
      .eq('id', s.id);
    setSaved(error ? `Erreur : ${error.message}` : 'Étape enregistrée.');
    setTimeout(() => setSaved(''), 3000);
  }

  async function add() {
    await supabase
      .from('oto_steps')
      .insert({ position: steps.length + 1, upsell_slug: 'simulateur', headline: 'Offre spéciale', subhead: '', active: false });
    load();
  }
  async function del(id: string) {
    await supabase.from('oto_steps').delete().eq('id', id);
    load();
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-display text-3xl font-bold">Tunnel OTO</h1>
        <button onClick={add} className="bg-paper/10 hover:bg-paper/20 px-4 py-2 rounded-lg text-sm">+ Ajouter une étape</button>
      </div>
      <p className="text-paper/60 text-sm mb-8">
        Séquence d'offres uniques après l'achat (et la personnalisation). Pour chaque étape : un <strong>upsell</strong> 1-clic ;
        en cas de refus, un <strong>downsell</strong> optionnel. Les abonnements passent par une redirection Stripe (carte réutilisée).
      </p>
      {saved && <p className="mb-4 text-gold font-semibold">{saved}</p>}

      <div className="space-y-6">
        {steps.map((s) => (
          <div key={s.id} className="bg-paper/5 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Étape {s.position}</h2>
              <div className="flex items-center gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={s.active} onChange={(e) => update(s.id, { active: e.target.checked })} /> Active
                </label>
                <button onClick={() => del(s.id)} className="text-ember text-xs">Supprimer</button>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-paper/50 mb-1">Position</label>
                <input type="number" value={s.position} onChange={(e) => update(s.id, { position: Number(e.target.value) })} className="w-full rounded-lg bg-ink border border-paper/20 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-paper/50 mb-1">Upsell</label>
                <select value={s.upsell_slug} onChange={(e) => update(s.id, { upsell_slug: e.target.value })} className="w-full rounded-lg bg-ink border border-paper/20 px-3 py-2 text-sm">
                  {products.map((p) => (
                    <option key={p.slug} value={p.slug}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-paper/50 mb-1">Downsell (si refus)</label>
                <select value={s.downsell_slug ?? ''} onChange={(e) => update(s.id, { downsell_slug: e.target.value || null })} className="w-full rounded-lg bg-ink border border-paper/20 px-3 py-2 text-sm">
                  <option value="">— aucun —</option>
                  {products.map((p) => (
                    <option key={p.slug} value={p.slug}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-paper/50 mb-1">Titre (upsell)</label>
              <input value={s.headline} onChange={(e) => update(s.id, { headline: e.target.value })} className="w-full rounded-lg bg-ink border border-paper/20 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-paper/50 mb-1">Sous-titre (upsell)</label>
              <textarea rows={2} value={s.subhead} onChange={(e) => update(s.id, { subhead: e.target.value })} className="w-full rounded-lg bg-ink border border-paper/20 px-3 py-2 text-sm" />
            </div>

            <button onClick={() => save(s)} className="bg-gold text-ink font-bold px-5 py-2 rounded-lg text-sm">Enregistrer</button>
          </div>
        ))}
        {steps.length === 0 && <p className="text-paper/40 text-sm">Aucune étape OTO. Ajoutez-en une.</p>}
      </div>
    </div>
  );
}
