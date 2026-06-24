import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Order } from '../../types';

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
      .then(({ data }) => setOrders((data as Order[]) ?? []));
  }, []);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-8">Commandes</h1>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-paper/50 border-b border-paper/10">
            <th className="py-2 pr-4">Date</th>
            <th className="py-2 pr-4">Email</th>
            <th className="py-2 pr-4">Produits</th>
            <th className="py-2 pr-4">Montant</th>
            <th className="py-2 pr-4">Statut</th>
            <th className="py-2">Payée le</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-b border-paper/5">
              <td className="py-2 pr-4">{new Date(o.created_at).toLocaleString('fr-FR')}</td>
              <td className="py-2 pr-4">{o.email}</td>
              <td className="py-2 pr-4 text-paper/70">{o.product_slugs?.join(', ') ?? 'kit'}</td>
              <td className="py-2 pr-4">{(o.amount / 100).toLocaleString('fr-FR')} €</td>
              <td className={`py-2 pr-4 ${o.status === 'paid' ? 'text-gold' : 'text-paper/50'}`}>{o.status}</td>
              <td className="py-2 text-paper/60">{o.paid_at ? new Date(o.paid_at).toLocaleString('fr-FR') : '—'}</td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr>
              <td colSpan={6} className="py-6 text-paper/40 text-center">Aucune commande pour l'instant.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
