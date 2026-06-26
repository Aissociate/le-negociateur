import { useEffect, useState } from 'react';
import { Check, ShieldCheck, Loader2, ArrowRight, AlertTriangle, Quote, Lock, Star, RefreshCw, Target, MessageSquareText } from 'lucide-react';
import Layout from '../components/Layout';
import { supabase, callFunction } from '../lib/supabase';
import { Product } from '../types';
import { TESTIMONIALS } from '../lib/testimonials';
import { SOCIAL_PROOF, SOCIAL_PROOF_MIN_COUNT } from '../lib/cro';
import { useAnalysesCount } from '../lib/useAnalysesCount';

const euros = (cents: number) => (cents / 100).toLocaleString('fr-FR') + ' €';

// Bénéfices du Kit — orientés résultat, pas fonctionnalité.
const KIT_INCLUDED = [
  {
    t: 'Ton argumentaire chiffré, personnalisé',
    d: 'Le montant exact à demander — ton poste, ton marché, tes chiffres — sources publiques à l’appui. Plus d’approximation, des faits.',
  },
  {
    t: 'La stratégie de négociation en 5 étapes',
    d: 'De la prise de rendez-vous à la signature : quoi dire, quand le dire, et dans quel ordre pour garder la main.',
  },
  {
    t: 'Tes scripts mot à mot',
    d: 'La demande, l’annonce du chiffre, le silence qui fait céder, la conclusion. À lire tel quel, même si tu détestes négocier.',
  },
  {
    t: 'Les réponses aux 12 objections les plus fréquentes',
    d: '« Ce n’est pas le moment », « le budget est gelé », « ça ne dépend pas de moi »… toutes désamorcées d’avance.',
  },
  {
    t: 'Ton plan B hors salaire + l’email de verrouillage',
    d: 'Télétravail, jours de congés, prime, formation financée… et l’email qui grave l’accord noir sur blanc après l’entretien.',
  },
];

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
        Ton analyse t'a donné le chiffre. Le Kit te donne la méthode, les mots exacts et le plan pour le transformer en
        <strong className="text-paper"> augmentation réelle</strong> — sans stress et sans improviser.
      </p>
      <div className="mt-6">
        <StatLine />
      </div>

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
              Le prix du Kit ? L'équivalent d'un dîner. Ce qu'il peut débloquer ? <strong className="text-gold">Des milliers d'euros par an, chaque année.</strong>
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
        <p className="mt-2 text-center text-paper/70 text-sm">Tout ce qu'il te faut pour entrer armé. Rien de superflu.</p>

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
              {kit?.compare_at_cents && (
                <span className="ml-2 text-base text-ink/40 line-through font-normal">{euros(kit.compare_at_cents)}</span>
              )}
            </p>
          </div>
          <ul className="mt-5 space-y-3">
            {KIT_INCLUDED.map((f) => (
              <li key={f.t} className="flex gap-3">
                <Check className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                <span>
                  <span className="font-semibold text-sm">{f.t}</span>
                  <span className="block text-sm text-ink/60">{f.d}</span>
                </span>
              </li>
            ))}
          </ul>

          {simu && (
            <label className="flex items-start gap-3 mt-6 rounded-xl border-2 border-dashed border-gold/60 bg-gold/5 p-4 cursor-pointer">
              <input type="checkbox" checked={addSimu} onChange={(e) => setAddSimu(e.target.checked)} className="mt-1" />
              <span className="text-sm">
                <strong>Ajouter {simu.name} (+{euros(simu.price_cents)})</strong>
                <span className="block text-ink/60">{simu.description_md}</span>
              </span>
            </label>
          )}

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
          Témoignages illustratifs · gains indicatifs, non garantis.
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
      </section>

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
