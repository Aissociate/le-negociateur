import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

// Tableau KPI du funnel de conversion (B2C tunnel + prospection B2B).
// Lecture seule, agrégée depuis ab_stats / leads / gap_reports / email_events /
// orders / prospects. Les % se recalculent à chaque chargement.

interface AbRow {
  experiment_key: string;
  variant_key: string;
  views: number;
  captures: number;
  purchases: number;
}
interface ProductRow {
  slug: string;
  name: string;
  price_cents: number;
  kind: string;
}
interface OrderRow {
  amount: number;
  product_slugs: string[] | null;
}

const PROSPECT_STAGES = ['new', 'enriched', 'contacted', 'replied', 'won', 'lost', 'unsubscribed'] as const;

const pct = (num: number, den: number): string =>
  den > 0 ? `${((num / den) * 100).toFixed(num / den < 0.1 ? 2 : 1)} %` : '—';
const eur = (cents: number): string => (cents / 100).toLocaleString('fr-FR', { maximumFractionDigits: 0 });

export default function Funnel() {
  const [loading, setLoading] = useState(true);
  const [ab, setAb] = useState<AbRow[]>([]);
  const [leads, setLeads] = useState(0);
  const [clients, setClients] = useState(0);
  const [desinscrits, setDesinscrits] = useState(0);
  const [reports, setReports] = useState(0);
  const [emailsSent, setEmailsSent] = useState(0);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [prospectStages, setProspectStages] = useState<Record<string, number>>({});
  const [prospectEmails, setProspectEmails] = useState(0);
  const [cpfInterested, setCpfInterested] = useState(0);
  const [cpfTotal, setCpfTotal] = useState(0);
  const [emailOpened, setEmailOpened] = useState(0);
  const [emailClicked, setEmailClicked] = useState(0);
  const [emailBounced, setEmailBounced] = useState(0);
  const [adSpend, setAdSpend] = useState<number>(() => Number(localStorage.getItem('ln_ad_spend') || 0));

  useEffect(() => {
    (async () => {
      const head = { count: 'exact' as const, head: true };
      const [
        abRes,
        leadsRes,
        clientsRes,
        desRes,
        reportsRes,
        emailsRes,
        ordersRes,
        productsRes,
        prospectsRes,
        prospectEmailsRes,
      ] = await Promise.all([
        supabase.from('ab_stats').select('*'),
        supabase.from('leads').select('id', head),
        supabase.from('leads').select('id', head).eq('statut', 'client'),
        supabase.from('leads').select('id', head).eq('statut', 'desinscrit'),
        supabase.from('gap_reports').select('id', head),
        supabase.from('email_events').select('id', head).eq('status', 'sent'),
        supabase.from('orders').select('amount, product_slugs').eq('status', 'paid'),
        supabase.from('products').select('slug, name, price_cents, kind'),
        supabase.from('prospects').select('stage').limit(5000),
        supabase.from('prospect_events').select('id', head).eq('type', 'email').eq('status', 'sent'),
      ]);

      setAb((abRes.data as AbRow[]) ?? []);
      setLeads(leadsRes.count ?? 0);
      setClients(clientsRes.count ?? 0);
      setDesinscrits(desRes.count ?? 0);
      setReports(reportsRes.count ?? 0);
      setEmailsSent(emailsRes.count ?? 0);
      setOrders((ordersRes.data as OrderRow[]) ?? []);
      setProducts((productsRes.data as ProductRow[]) ?? []);
      const stages: Record<string, number> = {};
      for (const r of (prospectsRes.data as { stage: string }[]) ?? [])
        stages[r.stage] = (stages[r.stage] ?? 0) + 1;
      setProspectStages(stages);
      setProspectEmails(prospectEmailsRes.count ?? 0);

      // Back-end (intérêt CPF) + engagement email (webhook Resend → email_events).
      const [interestsRes, openedRes, clickedRes, bouncedRes] = await Promise.all([
        supabase.from('lead_interests').select('interested'),
        supabase.from('email_events').select('id', head).eq('status', 'opened'),
        supabase.from('email_events').select('id', head).eq('status', 'clicked'),
        supabase.from('email_events').select('id', head).eq('status', 'bounced'),
      ]);
      const interests = (interestsRes.data as { interested: boolean }[]) ?? [];
      setCpfTotal(interests.length);
      setCpfInterested(interests.filter((x) => x.interested).length);
      setEmailOpened(openedRes.count ?? 0);
      setEmailClicked(clickedRes.count ?? 0);
      setEmailBounced(bouncedRes.count ?? 0);
      setLoading(false);
    })();
  }, []);

  if (loading) return <p className="text-paper/60">Chargement des KPI…</p>;

  // --- Funnel B2C ---
  const capture = ab.filter((r) => r.experiment_key === 'capture_copy');
  const visitors = capture.reduce((s, r) => s + r.views, 0);
  const ordersPaid = orders.length;
  const revenueCents = orders.reduce((s, o) => s + (o.amount ?? 0), 0);
  const aov = ordersPaid > 0 ? revenueCents / ordersPaid : 0;
  const cpl = leads > 0 ? adSpend / leads : 0;
  const cac = ordersPaid > 0 ? adSpend / ordersPaid : 0;
  const roas = adSpend > 0 ? revenueCents / 100 / adSpend : 0;

  const steps = [
    { label: 'Visiteurs', value: visitors, hint: 'vues page de capture (A/B)' },
    { label: 'Leads capturés', value: leads, hint: 'email + consentement' },
    { label: 'Analyses générées', value: reports, hint: 'rapports d’écart' },
    { label: 'Relances envoyées', value: emailsSent, hint: 'séquence email' },
    { label: 'Clients payants', value: ordersPaid, hint: 'commandes payées' },
  ];
  const top = steps[0].value || 1;

  // Revenu par produit (prix × commandes contenant le slug).
  const productRevenue = products
    .map((p) => {
      const n = orders.filter((o) => (o.product_slugs ?? []).includes(p.slug)).length;
      return { ...p, count: n, revenue: n * p.price_cents };
    })
    .filter((p) => p.count > 0)
    .sort((a, b) => b.revenue - a.revenue);

  const kitOrders = orders.filter((o) => (o.product_slugs ?? []).includes('kit')).length;
  const upsellOrders = orders.filter((o) => (o.product_slugs ?? []).includes('simulateur')).length;

  return (
    <div className="max-w-5xl">
      <h1 className="font-display text-3xl font-bold mb-2">Funnel &amp; KPI</h1>
      <p className="text-paper/60 mb-8 text-sm">
        Conversion du tunnel B2C (visiteur → client) et de la prospection B2B. Les vues proviennent du tracking A/B
        (<code className="text-gold">capture_copy</code>) ; les ventes des commandes payées.
      </p>

      {/* KPI clés */}
      <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
        <Kpi label="Taux de capture" value={pct(leads, visitors)} sub="lead / visiteur" />
        <Kpi label="Conv. lead→client" value={pct(ordersPaid, leads)} sub="client / lead" />
        <Kpi label="Conv. visiteur→client" value={pct(ordersPaid, visitors)} sub="global" />
        <Kpi label="Panier moyen" value={`${eur(aov)} €`} sub="par commande" />
        <Kpi label="Revenu / visiteur" value={visitors ? `${(revenueCents / 100 / visitors).toFixed(2)} €` : '—'} sub="EPC" />
        <Kpi label="CA total" value={`${eur(revenueCents)} €`} sub={`${ordersPaid} commande(s)`} highlight />
      </div>

      {/* Acquisition — dépense pub saisie manuellement */}
      <div className="mb-10 rounded-xl border border-paper/10 bg-paper/5 p-5">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h2 className="font-display text-xl font-bold">Acquisition</h2>
          <label className="text-sm text-paper/60 flex items-center gap-2">
            Dépense pub cumulée (€)
            <input
              type="number"
              value={adSpend || ''}
              onChange={(e) => {
                const v = Math.max(0, Number(e.target.value));
                setAdSpend(v);
                localStorage.setItem('ln_ad_spend', String(v));
              }}
              placeholder="0"
              className="w-28 rounded-lg bg-ink border border-paper/20 px-3 py-1.5 text-sm"
            />
          </label>
        </div>
        <div className="grid md:grid-cols-4 gap-4">
          <Kpi label="CPL" value={adSpend && leads ? `${cpl.toFixed(2)} €` : '—'} sub="coût / lead" />
          <Kpi label="CAC" value={adSpend && ordersPaid ? `${cac.toFixed(2)} €` : '—'} sub="coût / client" />
          <Kpi label="ROAS" value={adSpend ? `${roas.toFixed(2)}×` : '—'} sub="CA / dépense" highlight={roas >= 1} />
          <Kpi
            label="Revenu / visiteur"
            value={visitors ? `${(revenueCents / 100 / visitors).toFixed(2)} €` : '—'}
            sub="EPC"
          />
        </div>
        <p className="text-paper/40 text-xs mt-3">
          Saisis ta dépense pub totale (Meta + Google…) pour le CPL, le CAC et le ROAS. Stocké localement (ce navigateur).
        </p>
      </div>

      {/* Funnel en barres */}
      <h2 className="font-display text-xl font-bold mb-4">Tunnel B2C</h2>
      <div className="space-y-2 mb-10">
        {steps.map((s, i) => {
          const prev = i > 0 ? steps[i - 1].value : null;
          const widthPct = Math.max(2, (s.value / top) * 100);
          return (
            <div key={s.label} className="flex items-center gap-4">
              <div className="w-40 shrink-0 text-sm text-paper/70">
                {s.label}
                <div className="text-xs text-paper/40">{s.hint}</div>
              </div>
              <div className="flex-1 bg-paper/5 rounded-lg overflow-hidden">
                <div
                  className="bg-gold/30 border-l-2 border-gold py-2 px-3 rounded-lg"
                  style={{ width: `${widthPct}%` }}
                >
                  <span className="font-display font-bold">{s.value.toLocaleString('fr-FR')}</span>
                </div>
              </div>
              <div className="w-24 shrink-0 text-right text-sm">
                {prev != null ? (
                  <span className="text-gold">{pct(s.value, prev)}</span>
                ) : (
                  <span className="text-paper/30">—</span>
                )}
                <div className="text-xs text-paper/40">vs étape préc.</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* A/B variantes */}
      <h2 className="font-display text-xl font-bold mb-4">Performance des variantes de capture (A/B)</h2>
      <table className="w-full text-sm mb-10">
        <thead>
          <tr className="text-left text-paper/50 border-b border-paper/10">
            <th className="py-2 pr-3">Variante</th>
            <th className="py-2 pr-3">Vues</th>
            <th className="py-2 pr-3">Captures</th>
            <th className="py-2 pr-3">Taux capture</th>
            <th className="py-2 pr-3">Achats</th>
            <th className="py-2">Taux achat</th>
          </tr>
        </thead>
        <tbody>
          {capture
            .slice()
            .sort((a, b) => b.views - a.views)
            .map((v) => (
              <tr key={v.variant_key} className="border-b border-paper/5">
                <td className="py-2 pr-3 font-semibold">{v.variant_key}</td>
                <td className="py-2 pr-3">{v.views}</td>
                <td className="py-2 pr-3">{v.captures}</td>
                <td className="py-2 pr-3 text-gold">{pct(v.captures, v.views)}</td>
                <td className="py-2 pr-3">{v.purchases}</td>
                <td className="py-2 text-gold">{pct(v.purchases, v.captures)}</td>
              </tr>
            ))}
          {capture.length === 0 && (
            <tr>
              <td colSpan={6} className="py-6 text-paper/40 text-center">Aucune donnée A/B.</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Revenu par produit + upsell */}
      <h2 className="font-display text-xl font-bold mb-4">Revenu par produit</h2>
      <div className="grid lg:grid-cols-2 gap-6 mb-10">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-paper/50 border-b border-paper/10">
              <th className="py-2 pr-3">Produit</th>
              <th className="py-2 pr-3">Ventes</th>
              <th className="py-2">Revenu</th>
            </tr>
          </thead>
          <tbody>
            {productRevenue.map((p) => (
              <tr key={p.slug} className="border-b border-paper/5">
                <td className="py-2 pr-3">{p.name}</td>
                <td className="py-2 pr-3">{p.count}</td>
                <td className="py-2 text-gold">{eur(p.revenue)} €</td>
              </tr>
            ))}
            {productRevenue.length === 0 && (
              <tr>
                <td colSpan={3} className="py-6 text-paper/40 text-center">Aucune vente.</td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="bg-paper/5 rounded-xl p-5 self-start">
          <p className="text-paper/50 text-xs uppercase tracking-wide">Taux de prise d’upsell (OTO)</p>
          <p className="font-display text-3xl font-bold mt-1">{pct(upsellOrders, kitOrders)}</p>
          <p className="text-paper/40 text-xs mt-1">
            {upsellOrders} simulateur(s) sur {kitOrders} kit(s) vendu(s)
          </p>
        </div>
      </div>

      {/* Back-end (intérêt CPF) & engagement email */}
      <h2 className="font-display text-xl font-bold mb-4">Back-end &amp; engagement email</h2>
      <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
        <Kpi
          label="Intérêt formation CPF"
          value={pct(cpfInterested, cpfTotal)}
          sub={`${cpfInterested} / ${cpfTotal} réponses`}
          highlight
        />
        <Kpi
          label="Ouvertures email"
          value={String(emailOpened)}
          sub={emailsSent ? `≈ ${pct(emailOpened, emailsSent)} des envois` : 'webhook Resend'}
        />
        <Kpi label="Clics email" value={String(emailClicked)} sub="webhook Resend" />
        <Kpi label="Bounces" value={String(emailBounced)} sub="webhook Resend" />
        <Kpi label="Relances envoyées" value={String(emailsSent)} sub="email_events" />
      </div>

      {/* Prospection B2B */}
      <h2 className="font-display text-xl font-bold mb-4">Prospection B2B</h2>
      <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
        {PROSPECT_STAGES.map((st) => (
          <Kpi key={st} label={st} value={String(prospectStages[st] ?? 0)} sub="prospects" />
        ))}
        <Kpi label="Emails envoyés" value={String(prospectEmails)} sub="prospect_events" />
        <Kpi
          label="Taux de réponse"
          value={pct(prospectStages['replied'] ?? 0, prospectEmails)}
          sub="réponses / envoyés"
        />
        <Kpi label="Désinscriptions (B2C)" value={String(desinscrits)} sub="leads opt-out" />
        <Kpi label="Clients (leads)" value={String(clients)} sub="statut = client" />
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-xl p-5 ${highlight ? 'bg-gold/15 border border-gold/40' : 'bg-paper/5'}`}>
      <p className="text-paper/50 text-xs uppercase tracking-wide">{label}</p>
      <p className="font-display text-2xl font-bold mt-1">{value}</p>
      {sub && <p className="text-paper/40 text-xs mt-1">{sub}</p>}
    </div>
  );
}
