import { ReactNode, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FileText, Receipt, Bot, Repeat, LogOut, Loader2 } from 'lucide-react';
import Layout from '../components/Layout';
import { supabase, callAuthFunction, callFunction } from '../lib/supabase';

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
  const [code, setCode] = useState('');
  const [phase, setPhase] = useState<'email' | 'code'>('email');
  const [sending, setSending] = useState(false);
  const [data, setData] = useState<AccountData | null>(null);
  const [err, setErr] = useState('');
  const [params] = useSearchParams();
  const acces = params.get('acces') ?? '';

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // Accès direct par token de capacité (lien reçu par email) — sans login ni code.
  useEffect(() => {
    if (!acces) return;
    callFunction<AccountData>('account-data', { token: acces })
      .then(setData)
      .catch(() => setErr('Lien d’accès invalide ou expiré. Connecte-toi avec ton email ci-dessous.'));
  }, [acces]);

  useEffect(() => {
    if (!session) {
      if (!acces) setData(null); // en accès token, on garde les données chargées
      return;
    }
    callAuthFunction<AccountData>('account-data', {})
      .then(setData)
      .catch((e) => setErr(e instanceof Error ? e.message : 'Erreur'));
  }, [session, acces]);

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    setErr('');
    setSending(true);
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
    setSending(false);
    if (error) setErr(error.message);
    else setPhase('code');
  }

  async function verifyCode(e?: React.FormEvent) {
    e?.preventDefault();
    setErr('');
    setSending(true);
    const { error } = await supabase.auth.verifyOtp({ email, token: code.trim(), type: 'email' });
    setSending(false);
    if (error) setErr('Code invalide ou expiré. Réessaie ou renvoie un code.');
    // Succès : onAuthStateChange met à jour la session automatiquement.
  }

  async function manageSub() {
    setErr('');
    try {
      const { url } = await callAuthFunction<{ url: string }>('billing-portal', {});
      window.location.href = url;
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erreur');
    }
  }

  if (!ready && !acces) return <Layout narrow><p className="text-center py-16 text-paper/40">…</p></Layout>;

  // Ni session ni accès token valide → écran de connexion par code.
  if (!session && !data && (!acces || err)) {
    return (
      <Layout narrow>
        <div className="max-w-sm mx-auto py-12">
          <h1 className="font-display text-2xl font-bold text-center mb-2">Mon espace</h1>
          {phase === 'email' ? (
            <>
              <p className="text-paper/60 text-sm text-center mb-6">
                Connecte-toi avec l'email de ton achat — on t'envoie un <strong className="text-paper">code à 6 chiffres</strong>.
              </p>
              <form onSubmit={sendCode} className="space-y-3">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ton@email.fr"
                  className="w-full rounded-lg bg-ink border border-white/15 px-4 py-3 focus:border-gold focus:outline-none"
                />
                {err && <p className="text-ember text-sm">{err}</p>}
                <button disabled={sending} className="w-full bg-gold text-ink font-bold py-3 rounded-lg hover:brightness-105 transition disabled:opacity-60">
                  {sending ? 'Envoi…' : 'Recevoir mon code'}
                </button>
              </form>
            </>
          ) : (
            <>
              <p className="text-paper/60 text-sm text-center mb-6">
                On a envoyé un code à 6 chiffres à <strong className="text-paper">{email}</strong>. Saisis-le ci-dessous.
              </p>
              <form onSubmit={verifyCode} className="space-y-3">
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="••••••"
                  className="w-full text-center tracking-[0.5em] font-mono text-xl rounded-lg bg-ink border border-white/15 px-4 py-3 focus:border-gold focus:outline-none"
                />
                {err && <p className="text-ember text-sm">{err}</p>}
                <button disabled={sending || code.length < 6} className="w-full bg-gold text-ink font-bold py-3 rounded-lg hover:brightness-105 transition disabled:opacity-60">
                  {sending ? 'Connexion…' : 'Se connecter'}
                </button>
              </form>
              <div className="mt-3 flex justify-between text-xs text-paper/40">
                <button onClick={() => { setPhase('email'); setCode(''); setErr(''); }} className="hover:text-paper">
                  ← Changer d'email
                </button>
                <button onClick={() => sendCode()} disabled={sending} className="hover:text-paper disabled:opacity-50">
                  Renvoyer un code
                </button>
              </div>
            </>
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
          <p className="text-paper/50 text-sm">{data?.email ?? session?.user?.email}</p>
        </div>
        {session && (
          <button onClick={() => supabase.auth.signOut()} className="text-sm text-paper/50 flex items-center gap-1 hover:text-paper">
            <LogOut className="w-4 h-4" /> Déconnexion
          </button>
        )}
      </div>

      {err && <p className="text-ember text-sm mb-4">{err}</p>}

      {!data ? (
        <p className="text-paper/50 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Chargement…</p>
      ) : (
        <div className="space-y-5">
          <Section icon={<Bot className="w-5 h-5 text-gold" />} title="Agent Recruteur IA">
            {data.entitlements.simulator ? (
              <Link to={`/simulateur${acces ? `?acces=${acces}` : ''}`} className="inline-block bg-gold text-ink font-bold px-5 py-2.5 rounded-lg hover:brightness-105 transition">
                Lancer l'entraînement →
              </Link>
            ) : (
              <p className="text-paper/60 text-sm">
                Accès inactif. <Link to="/kit" className="text-gold underline">Ajoute l'Agent Recruteur IA</Link> pour t'entraîner en illimité.
              </p>
            )}
          </Section>

          {/* Gestion d'abonnement conservée pour les abonnés Bouclier historiques (offre arrêtée). */}
          {data.entitlements.bouclier && (
            <Section icon={<Repeat className="w-5 h-5 text-gold" />} title="Abonnement Bouclier">
              <p className="text-sm text-emerald-400 mb-2">Actif ✓</p>
              <button onClick={manageSub} className="text-sm bg-white/10 hover:bg-white/15 px-4 py-2 rounded-lg transition">
                Gérer mon abonnement
              </button>
            </Section>
          )}

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
