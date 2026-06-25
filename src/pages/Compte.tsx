import { ReactNode, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Receipt, Bot, Repeat, LogOut, Loader2 } from 'lucide-react';
import Layout from '../components/Layout';
import { supabase, callAuthFunction } from '../lib/supabase';

interface AccountData {
  email: string;
  orders: { id: string; amount: number; product_slugs: string[]; status: string; created_at: string; paid_at: string | null }[];
  deliverables: { id: string; type: string; access_token: string; created_at: string }[];
  entitlements: { kit: boolean; simulator: boolean; bouclier: boolean; slugs: string[] };
}

export default function Compte() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [session, setSession] = useState<any>(null);
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [data, setData] = useState<AccountData | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setData(null);
      return;
    }
    callAuthFunction<AccountData>('account-data', {})
      .then(setData)
      .catch((e) => setErr(e instanceof Error ? e.message : 'Erreur'));
  }, [session]);

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + '/compte' },
    });
    if (error) setErr(error.message);
    else setSent(true);
  }

  if (!ready) return <Layout narrow><p className="text-center py-16 text-paper/40">…</p></Layout>;

  if (!session) {
    return (
      <Layout narrow>
        <div className="max-w-sm mx-auto py-12">
          <h1 className="font-display text-2xl font-bold text-center mb-2">Mon espace</h1>
          <p className="text-paper/60 text-sm text-center mb-6">
            Connectez-vous avec l'email de votre achat — on vous envoie un lien magique, sans mot de passe.
          </p>
          {sent ? (
            <p className="text-gold text-center">Lien envoyé ✦ vérifiez votre boîte mail.</p>
          ) : (
            <form onSubmit={sendLink} className="space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.fr"
                className="w-full rounded-lg bg-ink border border-white/15 px-4 py-3 focus:border-gold focus:outline-none"
              />
              {err && <p className="text-ember text-sm">{err}</p>}
              <button className="w-full bg-gold text-ink font-bold py-3 rounded-lg hover:brightness-105 transition">
                Recevoir mon lien de connexion
              </button>
            </form>
          )}
        </div>
      </Layout>
    );
  }

  return (
    <Layout narrow>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Mon espace</h1>
          <p className="text-paper/50 text-sm">{data?.email ?? session.user?.email}</p>
        </div>
        <button onClick={() => supabase.auth.signOut()} className="text-sm text-paper/50 flex items-center gap-1 hover:text-paper">
          <LogOut className="w-4 h-4" /> Déconnexion
        </button>
      </div>

      {err && <p className="text-ember text-sm mb-4">{err}</p>}

      {!data ? (
        <p className="text-paper/50 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Chargement…</p>
      ) : (
        <div className="space-y-5">
          <Section icon={<Bot className="w-5 h-5 text-gold" />} title="Simulateur d'entretien">
            {data.entitlements.simulator ? (
              <Link to="/simulateur" className="inline-block bg-gold text-ink font-bold px-5 py-2.5 rounded-lg hover:brightness-105 transition">
                Lancer le simulateur →
              </Link>
            ) : (
              <p className="text-paper/60 text-sm">
                Accès inactif. <Link to="/kit" className="text-gold underline">Ajoutez le Simulateur</Link> pour vous entraîner en illimité.
              </p>
            )}
          </Section>

          <Section icon={<Repeat className="w-5 h-5 text-gold" />} title="Abonnement Bouclier">
            {data.entitlements.bouclier ? (
              <p className="text-sm text-emerald-400">
                Actif. <span className="text-paper/40">Gestion (portail Stripe) bientôt disponible.</span>
              </p>
            ) : (
              <p className="text-paper/60 text-sm">
                Inactif. <Link to="/kit" className="text-gold underline">Découvrir le Bouclier</Link>.
              </p>
            )}
          </Section>

          <Section icon={<FileText className="w-5 h-5 text-gold" />} title="Mes documents">
            {data.deliverables.length ? (
              <ul className="space-y-2">
                {data.deliverables.map((d) => (
                  <li key={d.id} className="flex items-center justify-between text-sm">
                    <span className="text-paper/80">Kit de Négociation · {new Date(d.created_at).toLocaleDateString('fr-FR')}</span>
                    <Link to={`/kit/document/${d.access_token}`} className="text-gold font-semibold">Ouvrir →</Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-paper/50 text-sm">Aucun document pour l'instant.</p>
            )}
          </Section>

          <Section icon={<Receipt className="w-5 h-5 text-gold" />} title="Mes factures">
            {data.orders.length ? (
              <table className="w-full text-sm">
                <tbody>
                  {data.orders.map((o) => (
                    <tr key={o.id} className="border-b border-white/5">
                      <td className="py-2 text-paper/60 whitespace-nowrap">{new Date(o.created_at).toLocaleDateString('fr-FR')}</td>
                      <td className="py-2 text-paper/80">{o.product_slugs?.join(', ')}</td>
                      <td className="py-2 text-right">{(o.amount / 100).toLocaleString('fr-FR')} €</td>
                      <td className={`py-2 text-right ${o.status === 'paid' ? 'text-gold' : 'text-paper/40'}`}>{o.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-paper/50 text-sm">Aucune commande.</p>
            )}
          </Section>
        </div>
      )}
    </Layout>
  );
}

function Section({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
      <h2 className="font-display font-bold flex items-center gap-2 mb-3">{icon}{title}</h2>
      {children}
    </div>
  );
}
