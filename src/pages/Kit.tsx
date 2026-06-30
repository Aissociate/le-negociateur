import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, ShieldCheck, Loader as Loader2, ArrowRight, TriangleAlert as AlertTriangle, Quote, Lock, Star, RefreshCw, Target, MessageSquareText, Flame } from 'lucide-react';
import Layout from '../components/Layout';
import SocialProofToaster from '../components/SocialProofToaster';
import { supabase, callFunction, getFunction } from '../lib/supabase';
import { Product } from '../types';
import { TESTIMONIALS } from '../lib/testimonials';
import { SOCIAL_PROOF, SOCIAL_PROOF_MIN_COUNT } from '../lib/cro';
import { useAnalysesCount } from '../lib/useAnalysesCount';

const euros = (cents: number) => (cents / 100).toLocaleString('fr-FR') + ' €';

// Bénéfices du Kit — orientés résultat, pas fonctionnalité.
const KIT_INCLUDED = [
  {
    t: 'Ton argumentaire chiffré, ultra-personnalisé',
    d: 'Le montant exact à demander, calculé pour TON poste, TON marché, TES chiffres — sources publiques à l’appui. Aucun modèle recyclé : ton cas, et lui seul.',
    v: 199,
  },
  {
    t: 'La stratégie de négociation en 5 étapes',
    d: 'De la prise de rendez-vous à la signature : quoi dire, quand le dire, et dans quel ordre pour garder la main.',
    v: 99,
  },
  {
    t: 'Tes scripts mot à mot',
    d: 'La demande, l’annonce du chiffre, le silence qui fait céder, la conclusion. À lire tel quel, même si tu détestes négocier.',
    v: 89,
  },
  {
    t: 'Les réponses aux 12 objections les plus fréquentes',
    d: '« Ce n’est pas le moment », « le budget est gelé », « ça ne dépend pas de moi »… toutes désamorcées d’avance.',
    v: 59,
  },
  {
    t: 'Ton plan B hors salaire + l’email de verrouillage',
    d: 'Télétravail, jours de congés, prime, formation financée… et l’email qui grave l’accord noir sur blanc après l’entretien.',
    v: 53,
  },
];
const KIT_TOTAL_VALUE = KIT_INCLUDED.reduce((s, f) => s + f.v, 0);

const PILIERS = [
  {
    icon: <Target className="w-5 h-5" />,
    t: 'Des chiffres, pas des opinions',
    d: 'Tu n’arrives plus en demandeur. Tu poses la vérité du marché sur la table — INSEE, DARES, APEC, France Travail — et tu négocies un fait, pas une faveur.',
  },
  {
    icon: <MessageSquareText className="w-5 h-5" />,
    t: 'Les mots exacts, prêts à dire',
    d: 'Le problème n’est jamais le fond, c’est le moment où ta voix tremble. Avec les scripts, tu sais quoi répondre à chaque phrase de ton manager.',
  },
  {
    icon: <ShieldCheck className="w-5 h-5" />,
    t: 'Un plan, même si on te dit non',
    d: 'Une négociation ne se joue pas sur un seul « non ». Plan B hors salaire, clause de revoyure datée, email de verrouillage : tu gardes toujours une issue.',
  },
];

const FAQ = [
  {
    q: 'Est-ce adapté à mon métier et à mon entreprise ?',
    a: 'Tout est généré à partir de ton analyse — poste, secteur, séniorité, région. Les chiffres et les arguments sont les tiens, pas des généralités.',
  },
  {
    q: 'Je déteste négocier. Ça va vraiment m’aider ?',
    a: 'C’est précisément pour ça que le Kit existe. Tu n’improvises rien : tu suis une méthode et tu lis des scripts écrits pour toi. La préparation remplace le stress.',
  },
  {
    q: 'Et si mon employeur refuse ?',
    a: 'Le Kit prépare ce scénario : leviers hors salaire, clause de revoyure datée, et un email de verrouillage pour garder la main. Un « non » devient une étape, pas une fin.',
  },
  {
    q: 'Combien de temps avant d’être prêt ?',
    a: 'Ton argumentaire est généré en quelques minutes. Tu peux préparer ton entretien le soir même, à ton rythme.',
  },
  {
    q: 'Et si je ne suis pas convaincu ?',
    a: 'Satisfait ou remboursé sous 30 jours, sans justification. Le risque est pour nous, pas pour toi.',
  },
];

function StatLine() {
  const count = useAnalysesCount();
  const statText =
    count != null && count >= SOCIAL_PROOF_MIN_COUNT
      ? `${count.toLocaleString('fr-FR')} analyses réalisées`
      : SOCIAL_PROOF.stat;
  return (
    <div className="flex items-center justify-center gap-1.5 text-gold">
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} className="w-4 h-4 fill-current" />
      ))}
      <span className="text-xs text-paper/55 ml-1">
        {SOCIAL_PROOF.rating} · {statText}
      </span>
    </div>
  );
}

export default function Kit() {
  const [products, setProducts] = useState<Product[]>([]);
  const [email, setEmail] = useState('');
  const [addSimu, setAddSimu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showBar, setShowBar] = useState(false);
  const [searchParams] = useSearchParams();
  const [gapAnnual, setGapAnnual] = useState(0);

  // Ancrage personnalisé : on récupère l'écart du visiteur via son rapport (?report=).
  useEffect(() => {
    const reportId = searchParams.get('report');
    if (!reportId) return;
    getFunction<{ gap_annual?: number }>('public-data', { report: reportId })
      .then((r) => setGapAnnual(Math.max(0, Number(r?.gap_annual ?? 0))))
      .catch(() => {});
  }, [searchParams]);

  // Quota de lancement du jour (réel) + compte à rebours vers la réinitialisation (minuit UTC).
  const [launch, setLaunch] = useState<{ remaining: number; quota: number } | null>(null);
  const [resetIn, setResetIn] = useState('');
  useEffect(() => {
    getFunction<{ remaining?: number; quota?: number }>('public-data', { stat: 'launch' })
      .then((r) => setLaunch({ remaining: Number(r?.remaining ?? 0), quota: Number(r?.quota ?? 0) }))
      .catch(() => {});
  }, []);
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
      const mins = Math.max(0, Math.floor((next - now.getTime()) / 60000));
      setResetIn(`${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, '0')}m`);
    };
    tick();
    const iv = window.setInterval(tick, 60000);
    return () => window.clearInterval(iv);
  }, []);

  // Exit-intent (desktop) : à la sortie, on propose le downsell (Argumentaire Éclair).
  const [showExit, setShowExit] = useState(false);
  const exitShown = useRef(false);
  useEffect(() => {
    const onLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !exitShown.current && !loading) {
        exitShown.current = true;
        setShowExit(true);
      }
    };
    document.addEventListener('mouseleave', onLeave);
    return () => document.removeEventListener('mouseleave', onLeave);
  }, [loading]);

  useEffect(() => {
    supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('position')
      .then(({ data }) => setProducts((data as Product[]) ?? []));
  }, []);

  // Barre CTA collante : visible après le premier écran, masquée près du footer.
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const nearBottom = window.innerHeight + y >= document.body.scrollHeight - 220;
      setShowBar(y > 600 && !nearBottom);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const p = (slug: string) => products.find((x) => x.slug === slug);
  const kit = p('kit');
  const simu = p('simulateur');
  const eclair = p('argumentaire-eclair');

  async function checkout(slugs: string[]) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Entre ton email (celui de ton analyse) pour continuer.');
      document.getElementById('offre')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { url } = await callFunction<{ url: string }>('create-checkout', { email, product_slugs: slugs });
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la création du paiement.');
      setLoading(false);
    }
  }

  const kitTotal = (kit?.price_cents ?? 0) + (addSimu && simu ? simu.price_cents : 0);
  const scrollToOffer = () => document.getElementById('offre')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <Layout narrow>
      {/* 1. Accroche */}
      <p className="text-gold tracking-widest uppercase text-xs mb-3 text-center">Passe à l'action</p>
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-center leading-tight">
        Tu connais ton écart. <br className="hidden sm:block" />
        <span className="text-gold italic">Va le chercher.</span>
      </h1>
      <p className="mt-4 text-center text-paper/75 max-w-2xl mx-auto">
        Pas un guide générique de plus. Un <strong className="text-paper">dossier de négociation construit pour toi seul</strong> —
        à partir de ton poste, ton secteur, ta région et tes chiffres exacts. La méthode, les mots et le plan pour transformer
        ton écart en <strong className="text-paper">augmentation réelle</strong>.
      </p>
      <div className="mt-6">
        <StatLine />
      </div>
      <p className="mt-3 text-center text-xs text-paper/40">
        Données officielles : INSEE · DARES · APEC · France Travail
      </p>

      {/* Tarif de lancement — quota quotidien réel (raison : capacité de génération/jour) */}
      {launch && launch.remaining > 0 && (
        <div className="mt-6 mx-auto max-w-xl rounded-xl border border-ember/30 bg-ember/[0.06] px-4 py-3 text-center">
          <p className="text-sm text-paper/85 flex items-center justify-center gap-2">
            <Flame className="w-4 h-4 text-ember shrink-0" />
            <span>
              <strong className="text-paper">Tarif de lancement</strong> — plus que{' '}
              <strong className="text-ember">{launch.remaining}</strong> Kit{launch.remaining > 1 ? 's' : ''} à ce prix
              aujourd'hui
            </span>
          </p>
          <p className="mt-1 text-xs text-paper/45">
            Volume quotidien limité (génération + vérification en temps réel) · réinitialisation dans {resetIn}
          </p>
        </div>
      )}

      {/* Ancrage personnalisé prix / gain (si le visiteur vient de son rapport) */}
      {gapAnnual > 0 && kit && (
        <div className="mt-8 text-center rounded-2xl border border-gold/30 bg-gold/[0.07] p-6">
          <p className="text-xs uppercase tracking-widest text-paper/50">Ton écart estimé</p>
          <p className="font-display text-3xl sm:text-4xl font-bold text-gold mt-1">
            +{gapAnnual.toLocaleString('fr-FR')} € <span className="text-base text-paper/50 font-normal">/ an</span>
          </p>
          <p className="text-sm text-paper/80 mt-3 max-w-xl mx-auto">
            Le Kit, c'est <strong className="text-paper">{euros(kit.price_cents)}</strong> une seule fois — soit{' '}
            <strong className="text-gold">
              {(Math.round((kit.price_cents / 100 / gapAnnual) * 1000) / 10).toLocaleString('fr-FR')} %
            </strong>{' '}
            de ce que tu laisses sur la table chaque année. Le premier entretien le rembourse ; le reste, tu l'encaisses.
          </p>
        </div>
      )}

      {/* 2. Coût de l'inaction — urgence honnête */}
      <div className="mt-10 rounded-2xl border border-ember/30 bg-ember/[0.06] p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-ember shrink-0 mt-0.5" />
          <div>
            <h2 className="font-display text-lg font-bold">Le silence est l'option la plus chère.</h2>
            <p className="mt-2 text-sm text-paper/80">
              Un écart de salaire ne se rattrape pas tout seul : il se cumule. Année après année, il rogne aussi tes
              futures augmentations, ta prime, tes droits à la retraite. Ne rien faire, c'est <strong className="text-paper">choisir de payer</strong> —
              chaque mois, sans le voir.
            </p>
            <p className="mt-2 text-sm text-paper/80">
              Mets les chiffres en face : le Kit coûte <strong className="text-paper">une fraction d'un seul mois</strong> de
              l'augmentation qu'il vise. Le premier entretien le rembourse —{' '}
              <strong className="text-gold">le reste, c'est des milliers d'euros par an, encaissés chaque année.</strong>
            </p>
          </div>
        </div>
      </div>

      {/* 3. Pourquoi ça marche — argumentation */}
      <section className="mt-12">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-center leading-tight">
          Ce qui fait basculer un entretien
        </h2>
        <p className="mt-2 text-center text-paper/70 text-sm max-w-xl mx-auto">
          Une augmentation ne récompense pas le mérite. Elle récompense la <span className="italic">préparation</span>.
        </p>
        <div className="mt-7 grid sm:grid-cols-3 gap-4">
          {PILIERS.map((pi) => (
            <div key={pi.t} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <div className="text-gold">{pi.icon}</div>
              <p className="mt-3 font-semibold">{pi.t}</p>
              <p className="mt-1 text-sm text-paper/60">{pi.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. L'offre */}
      <div id="offre" className="mt-12 scroll-mt-20">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-center leading-tight">
          Le Kit de Négociation
        </h2>
        <p className="mt-2 text-center text-paper/70 text-sm">
          Généré <strong className="text-paper">sur-mesure à partir de ton analyse</strong> — pas un modèle. Tout ce qu'il te
          faut pour entrer armé, rien de superflu.
        </p>

        {/* Email partagé */}
        <div className="mt-6 max-w-md mx-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Ton email (celui de ton analyse)"
            className="w-full rounded-lg bg-ink border border-white/15 px-4 py-3 text-paper placeholder-paper/30 focus:border-gold focus:outline-none"
          />
          {error && <p className="text-ember text-sm font-semibold mt-2">{error}</p>}
        </div>

        {/* Carte produit + order bump */}
        <div className="mt-6 bg-paper text-ink rounded-2xl p-6 sm:p-7 shadow-2xl shadow-black/30">
          <div className="flex items-baseline justify-between">
            <h3 className="font-display text-xl font-bold">{kit?.name ?? 'Le Kit de Négociation'}</h3>
            <p className="font-display text-2xl font-bold">
              {kit ? euros(kit.price_cents) : '—'}
              {kit?.compare_at_cents != null && kit.compare_at_cents > kit.price_cents && (
                <span className="ml-2 text-base text-ink/40 line-through font-normal">{euros(kit.compare_at_cents)}</span>
              )}
            </p>
          </div>
          <ul className="mt-5 space-y-3">
            {KIT_INCLUDED.map((f) => (
              <li key={f.t} className="flex gap-3 items-start">
                <Check className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                <span className="flex-1">
                  <span className="font-semibold text-sm">{f.t}</span>
                  <span className="block text-sm text-ink/60">{f.d}</span>
                </span>
                <span className="text-xs text-ink/40 whitespace-nowrap shrink-0 mt-0.5">{f.v} €</span>
              </li>
            ))}
          </ul>

          {/* Value stack : valeur totale barrée vs prix réel */}
          <div className="mt-5 flex items-center justify-between border-t border-ink/10 pt-4">
            <span className="text-sm text-ink/60">Valeur totale</span>
            <span className="text-ink/40 line-through">{KIT_TOTAL_VALUE.toLocaleString('fr-FR')} €</span>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-bold">Ton prix aujourd'hui</span>
            <span className="font-display text-2xl font-bold text-ink">{kit ? euros(kit.price_cents) : '—'}</span>
          </div>
          <p className="mt-1 text-xs text-ink/45">
            Prix de lancement — généré en temps réel à partir de données publiques officielles.
          </p>

          {simu && (
            <label className="flex items-start gap-3 mt-6 rounded-xl border-2 border-dashed border-gold/60 bg-gold/5 p-4 cursor-pointer">
              <input type="checkbox" checked={addSimu} onChange={(e) => setAddSimu(e.target.checked)} className="mt-1" />
              <span className="text-sm">
                <strong>Ajouter {simu.name} (+{euros(simu.price_cents)})</strong>
                <span className="block text-ink/60">{simu.description_md}</span>
              </span>
            </label>
          )}

          <div className="mt-6 flex items-center gap-2.5 rounded-xl bg-emerald-600/10 border border-emerald-600/30 px-4 py-3 text-emerald-700">
            <ShieldCheck className="w-5 h-5 shrink-0" />
            <p className="text-sm">
              <strong>Satisfait ou remboursé sous 30 jours</strong>, sans justification. Tu testes sans aucun risque — c'est
              nous qui le portons.
            </p>
          </div>

          <button
            onClick={() => checkout(['kit', ...(addSimu && simu ? ['simulateur'] : [])])}
            disabled={loading || !kit}
            className="mt-6 w-full bg-ink text-paper font-bold py-4 rounded-xl hover:bg-ink/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            Obtenir mon Kit — {euros(kitTotal)}
          </button>
          <p className="mt-3 text-center text-xs text-ink/50 flex items-center justify-center gap-1">
            <ShieldCheck size={13} /> Paiement sécurisé Stripe · Satisfait ou remboursé 30 jours
          </p>
        </div>
      </div>

      {/* 5. Garantie — renversement du risque */}
      <div className="mt-6 rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/10 to-transparent p-6 flex items-start gap-4">
        <RefreshCw className="w-7 h-7 text-gold shrink-0 mt-1" />
        <div>
          <h2 className="font-display text-lg font-bold">Risque zéro, garantie 30 jours.</h2>
          <p className="mt-2 text-sm text-paper/80">
            Teste le Kit pendant 30 jours. S'il ne t'aide pas à préparer une demande solide — pour n'importe quelle
            raison, ou aucune — tu es <strong className="text-paper">remboursé intégralement</strong>, sans justification à fournir.
            Le seul vrai risque, c'est de continuer à laisser ton écart grandir.
          </p>
        </div>
      </div>

      {/* 6. Témoignages */}
      <section className="mt-14">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-center leading-tight">
          Ils sont arrivés préparés. Voilà ce qu'ils ont obtenu.
        </h2>
        <div className="mt-3 flex justify-center">
          <StatLine />
        </div>
        <div className="mt-7 grid sm:grid-cols-2 gap-4">
          {TESTIMONIALS.slice(0, 8).map((t) => (
            <figure key={t.name} className="relative rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <Quote className="absolute right-4 top-4 w-5 h-5 text-gold/30" />
              <span className="inline-block text-xs font-bold text-ink bg-gold rounded-full px-2.5 py-1">{t.gain}</span>
              <blockquote className="mt-3 text-sm text-paper/85 italic">« {t.quote} »</blockquote>
              <figcaption className="mt-2 text-xs text-paper/50">
                — {t.name}, {t.role}
              </figcaption>
            </figure>
          ))}
        </div>
        <p className="mt-4 text-center text-[11px] text-paper/40">
          Témoignages informatifs · gains indicatifs, non garantis.
        </p>
      </section>

      {/* 7. Objections / FAQ */}
      <section className="mt-14">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-center leading-tight">Les questions que tu te poses</h2>
        <div className="mt-6 space-y-3">
          {FAQ.map((item) => (
            <details key={item.q} className="group rounded-xl border border-white/10 bg-white/[0.02] px-5 py-4">
              <summary className="flex items-center justify-between cursor-pointer list-none font-semibold gap-3">
                {item.q}
                <ArrowRight className="w-4 h-4 text-gold shrink-0 transition-transform group-open:rotate-90" />
              </summary>
              <p className="mt-3 text-sm text-paper/70">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* 7bis. Projection (future pacing) — sobre */}
      <section className="mt-14">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-center max-w-2xl mx-auto">
          <h2 className="font-display text-xl font-bold">Imagine ton prochain entretien</h2>
          <p className="mt-2 text-sm text-paper/70">
            Tu poses tes chiffres sur la table, calmement. Tu sais quoi répondre à chaque objection. Tu ne demandes pas
            une faveur — tu défends un fait. Et tu repars avec ce que tu vaux vraiment.
          </p>
        </div>
      </section>

      {/* 8. CTA final */}
      <section className="mt-14 text-center border-t border-white/10 pt-12">
        <h2 className="font-display text-2xl sm:text-3xl font-bold leading-tight">
          Ton augmentation ne viendra pas toute seule. <br className="hidden sm:block" />
          <span className="text-paper/60">Mais elle est à portée de méthode.</span>
        </h2>
        <button
          onClick={scrollToOffer}
          className="mt-6 bg-gold text-ink font-bold px-8 py-4 rounded-xl hover:brightness-105 transition inline-flex items-center gap-2"
        >
          Obtenir mon Kit maintenant <ArrowRight className="w-5 h-5" />
        </button>
        <p className="mt-3 text-xs text-paper/50">
          Paiement sécurisé Stripe · Satisfait ou remboursé 30 jours · Généré à partir de ton analyse.
        </p>
        <p className="mt-10 text-sm text-paper/55 italic max-w-2xl mx-auto">
          P.S. — Chaque mois sans rien faire, ton écart se cumule : salaire, prime, droits à la retraite. Le Kit est
          garanti 30 jours, satisfait ou remboursé. Tu ne risques rien à le tester — tout à laisser filer.
        </p>
      </section>

      {/* Exit-intent : downsell Argumentaire Éclair (récupère les partants) */}
      {showExit && eclair && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setShowExit(false)}
        >
          <div className="bg-paper text-ink rounded-2xl max-w-md w-full p-6 relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowExit(false)}
              className="absolute right-4 top-3 text-ink/40 hover:text-ink text-2xl leading-none"
            >
              ×
            </button>
            <p className="text-gold text-xs font-bold uppercase tracking-widest">Avant de partir…</p>
            <h3 className="font-display text-xl font-bold mt-1">Pas encore prêt pour le Kit complet ?</h3>
            <p className="text-sm text-ink/70 mt-2">
              Commence par l'essentiel : <strong>{eclair.name}</strong> — ton argument chiffré + le script clé pour ouvrir
              la discussion, à un prix mini.
            </p>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="font-semibold">{eclair.name}</span>
              <span className="font-display text-2xl font-bold">{euros(eclair.price_cents)}</span>
            </div>
            {!email && (
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ton email (celui de ton analyse)"
                className="mt-3 w-full rounded-lg bg-ink/5 border border-ink/15 px-3 py-2 text-sm focus:border-gold focus:outline-none"
              />
            )}
            {error && <p className="text-ember text-sm font-semibold mt-2">{error}</p>}
            <button
              onClick={() => checkout(['argumentaire-eclair'])}
              disabled={loading}
              className="mt-4 w-full bg-ink text-paper font-bold py-3 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-ink/90 transition"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              Oui, je prends l'Argumentaire Éclair — {euros(eclair.price_cents)}
            </button>
            <button
              onClick={() => setShowExit(false)}
              className="mt-2 w-full text-sm text-ink/50 hover:text-ink"
            >
              Non merci, je continue
            </button>
            <p className="mt-3 text-center text-[11px] text-ink/40">Satisfait ou remboursé 30 jours.</p>
          </div>
        </div>
      )}

      <SocialProofToaster />

      {/* Barre CTA collante */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ink/95 backdrop-blur transition-transform duration-300 ${
          showBar ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-sm text-paper/80 hidden sm:block">
            {kit ? `Le Kit — ${euros(kit.price_cents)}` : 'Le Kit de Négociation'} · garanti 30 jours.
          </p>
          <button
            onClick={scrollToOffer}
            className="bg-gold text-ink font-bold px-5 py-2.5 rounded-xl hover:brightness-105 transition inline-flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            Obtenir mon Kit <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Layout>
  );
}
