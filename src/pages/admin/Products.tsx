import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Product } from '../../types';

/**
 * Gestion des produits & prix (Kit + upsell). Les prix sont en centimes en base
 * mais édités en euros ici. La page de vente lit ces produits actifs.
 */
export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [saved, setSaved] = useState('');

  const load = useCallback(() => {
    supabase.from('products').select('*').order('position').then(({ data }) => setProducts((data as Product[]) ?? []));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const update = (id: string, patch: Partial<Product>) =>
    setProducts((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  async function save(p: Product) {
    const { error } = await supabase
      .from('products')
      .update({
        name: p.name,
        kind: p.kind,
        price_cents: p.price_cents,
        compare_at_cents: p.compare_at_cents,
        currency: p.currency,
        stripe_price_id: p.stripe_price_id,
        description_md: p.description_md,
        active: p.active,
        position: p.position,
        updated_at: new Date().toISOString(),
      })
      .eq('id', p.id);
    setSaved(error ? `Erreur : ${error.message}` : `« ${p.name} » enregistré.`);
    setTimeout(() => setSaved(''), 4000);
  }

  async function add() {
    await supabase.from('products').insert({
      slug: 'produit-' + Math.random().toString(36).slice(2, 8),
      name: 'Nouveau produit',
      kind: 'upsell',
      price_cents: 0,
      description_md: '',
      active: false,
      position: products.length + 1,
    });
    load();
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-display text-3xl font-bold">Produits &amp; prix</h1>
        <button onClick={add} className="bg-paper/10 hover:bg-paper/20 px-4 py-2 rounded-lg text-sm">
          + Ajouter
        </button>
      </div>
      <p className="text-paper/60 text-sm mb-8">
        Le produit <code className="text-gold">kit</code> et l'<code className="text-gold">upsell</code> alimentent la
        page de vente et le checkout Stripe. Les prix sont en euros (stockés en centimes).
      </p>
      {saved && <p className="mb-4 text-gold font-semibold">{saved}</p>}

      <div className="space-y-6">
        {products.map((p) => (
          <div key={p.id} className="bg-paper/5 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl font-bold">{p.name}</h2>
                <p className="text-xs text-paper/40">slug : {p.slug}</p>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={p.active} onChange={(e) => update(p.id, { active: e.target.checked })} />
                Actif
              </label>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-paper/50 mb-1">Nom</label>
                <input
                  value={p.name}
                  onChange={(e) => update(p.id, { name: e.target.value })}
                  className="w-full rounded-lg bg-ink border border-paper/20 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-paper/50 mb-1">Type</label>
                <select
                  value={p.kind}
                  onChange={(e) => update(p.id, { kind: e.target.value as Product['kind'] })}
                  className="w-full rounded-lg bg-ink border border-paper/20 px-3 py-2 text-sm"
                >
                  <option value="kit">kit</option>
                  <option value="upsell">upsell</option>
                  <option value="subscription">subscription</option>
                  <option value="downsell">downsell</option>
                  <option value="bundle">bundle</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-paper/50 mb-1">Prix (€)</label>
                <input
                  type="number"
                  step={1}
                  value={p.price_cents / 100}
                  onChange={(e) => update(p.id, { price_cents: Math.round(Number(e.target.value) * 100) })}
                  className="w-full rounded-lg bg-ink border border-paper/20 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-paper/50 mb-1">Prix barré (€, optionnel)</label>
                <input
                  type="number"
                  step={1}
                  value={p.compare_at_cents != null ? p.compare_at_cents / 100 : ''}
                  onChange={(e) =>
                    update(p.id, {
                      compare_at_cents: e.target.value === '' ? null : Math.round(Number(e.target.value) * 100),
                    })
                  }
                  className="w-full rounded-lg bg-ink border border-paper/20 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-paper/50 mb-1">Stripe price ID (optionnel)</label>
                <input
                  value={p.stripe_price_id ?? ''}
                  onChange={(e) => update(p.id, { stripe_price_id: e.target.value || null })}
                  className="w-full rounded-lg bg-ink border border-paper/20 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-paper/50 mb-1">Position</label>
                <input
                  type="number"
                  value={p.position}
                  onChange={(e) => update(p.id, { position: Number(e.target.value) })}
                  className="w-full rounded-lg bg-ink border border-paper/20 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-paper/50 mb-1">Description (markdown)</label>
              <textarea
                rows={3}
                value={p.description_md}
                onChange={(e) => update(p.id, { description_md: e.target.value })}
                className="w-full rounded-lg bg-ink border border-paper/20 px-3 py-2 text-sm"
              />
            </div>

            <button onClick={() => save(p)} className="bg-gold text-ink font-bold px-5 py-2 rounded-lg text-sm">
              Enregistrer
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
