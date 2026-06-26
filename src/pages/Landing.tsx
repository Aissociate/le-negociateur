import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, AlertTriangle, Quote, ListChecks, FileSearch, Swords, ChevronDown } from 'lucide-react';
import Layout from '../components/Layout';
import Hero from '../components/Hero';
import SocialProof from '../components/SocialProof';

// Page de vente de la home : douleur → vérités du monde du travail → espoir → CTA.
// Le CTA mène au questionnaire de capture (/analyse).

const DOULEURS = [
  'Tu travailles bien au-delà de ce que dit ta fiche de paie — et tout le monde fait mine de ne pas le voir.',
  "Ce collègue arrivé après toi, moins investi, qui gagne plus. Tu le sais. Tu ne peux pas le prouver.",
  "Tu n'oses pas demander, de peur de passer pour « celui qui ne pense qu'à l'argent ».",
  'Tu te répètes « l’année prochaine »… depuis trois ans.',
];

// Les « mesquineries » du monde du travail — vérités cyniques mais vraies.
const VERITES = [
  "Une entreprise ne te paie pas ce que tu vaux. Elle te paie ce que tu acceptes — pas un euro de plus.",
  "On te parle de « famille », de « mission », de « valeurs »… surtout au moment de ne pas t'augmenter.",
  "Il y a toujours un budget pour recruter ton remplaçant 20 % plus cher. Rarement pour te retenir, toi.",
  "Le silence est la seule chose que ton employeur récompense généreusement : par l'immobilité.",
  "Ta loyauté n'est pas une vertu à leurs yeux. C'est une économie.",
];

const ETAPES = [
  { icon: <ListChecks className="w-5 h-5" />, title: 'Réponds à 5 questions', text: '30 secondes, sans inscription. Poste, secteur, séniorité, salaire.' },
  { icon: <FileSearch className="w-5 h-5" />, title: 'Découvre ton écart chiffré', text: 'Le montant exact qui te sépare du marché, sources publiques à l’appui.' },
  { icon: <Swords className="w-5 h-5" />, title: 'Va le chercher', text: 'Argumentaire, scripts mot à mot et plan de négociation prêts à l’emploi.' },
];

const FAQ = [
  { q: "C'est vraiment gratuit ?", a: "Oui — l'analyse de ton écart de rémunération est 100 % gratuite et sans engagement. Tu ne paies que si tu choisis ensuite le Kit pour passer à l'action." },
  { q: "Est-ce que ça marche pour mon métier ?", a: "L'estimation s'appuie sur des données par secteur, séniorité et région, orientées cadres et métiers en tension. Plus ton profil est précis, plus le chiffre est juste." },
  { q: "Mes données sont-elles en sécurité ?", a: "Ton email sert uniquement à t'envoyer ton analyse et nos conseils. Désinscription en 1 clic, aucune revente de tes données." },
  { q: "Et si mon employeur refuse ?", a: "Une négociation ne se joue pas sur un seul « non ». Le Kit te prépare un plan B (leviers hors salaire) et un email de verrouillage pour garder la main." },
  { q: "Combien de temps ça prend ?", a: "30 secondes pour l'analyse. Le reste, tu l'avances à ton rythme, quand tu es prêt." },
];

function Cta({ label, className = '' }: { label?: string; className?: string }) {
  return (
    <Link
      to="/analyse"
      className={`bg-gold text-ink font-bold px-8 py-4 rounded-xl hover:brightness-105 transition inline-flex items-center gap-2 ${className}`}
    >
      {label ?? 'Découvrir mon écart de salaire'} <ArrowRight className="w-5 h-5" />
    </Link>
  );
}

export default function Landing() {
  // Barre CTA collante : visible après le Hero, masquée tout en bas (près du footer).
  const [showBar, setShowBar] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const nearBottom = window.innerHeight + y >= document.body.scrollHeight - 240;
      setShowBar(y > 700 && !nearBottom);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <Layout hero={<Hero />}>
      <div className="max-w-3xl mx-auto space-y-16 py-4">
        {/* 1. La douleur */}
        <section>
          <p className="text-gold uppercase tracking-widest text-xs mb-3">Ce que tu ressens déjà</p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold leading-tight">
            Tu le sens, sans pouvoir le prouver.
          </h2>
          <p className="mt-3 text-paper/75">
            Les responsabilités s'empilent, la fiche de paie ne bouge pas. À l'entretien annuel, on te félicite
            chaleureusement… juste avant de t'expliquer que « ce n'est pas le moment ».
          </p>
          <ul className="mt-6 space-y-3">
            {DOULEURS.map((d) => (
              <li key={d} className="flex gap-3 text-paper/85">
                <AlertTriangle className="w-5 h-5 text-ember shrink-0 mt-0.5" />
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* 2. Les vérités du monde du travail */}
        <section>
          <p className="text-gold uppercase tracking-widest text-xs mb-3">Ce qu'on ne t'avoue jamais</p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold leading-tight">
            Personne ne te paiera ta vraie valeur. <span className="text-gold italic">Il faut aller la chercher.</span>
          </h2>
          <div className="mt-6 space-y-3">
            {VERITES.map((v) => (
              <blockquote
                key={v}
                className="relative border-l-2 border-gold/60 bg-white/[0.03] rounded-r-xl pl-5 pr-4 py-3 text-paper/85 italic"
              >
                <Quote className="absolute -left-[11px] top-3 w-4 h-4 text-gold bg-ink rounded-full" />
                {v}
              </blockquote>
            ))}
          </div>
        </section>

        {/* 3. L'espoir / le retournement */}
        <section className="text-center bg-gradient-to-br from-gold/10 to-ember/5 border border-gold/20 rounded-2xl p-8">
          <p className="text-gold uppercase tracking-widest text-xs mb-3">Et maintenant ?</p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold leading-tight">
            Et si, pour une fois, tu arrivais armé ?
          </h2>
          <p className="mt-3 text-paper/80 max-w-xl mx-auto">
            Imagine entrer dans le bureau avec le chiffre exact du marché posé sur la table. Plus de boule au ventre,
            plus d'approximations. Des faits, une méthode, et la bonne phrase au bon moment.
          </p>
          <p className="mt-4 font-display text-xl text-gold font-semibold">
            Tu ne demandes pas une faveur. Tu corriges une erreur.
          </p>
          <div className="mt-7">
            <Cta />
          </div>
          <p className="mt-3 text-xs text-paper/50">Gratuit · 30 secondes · données sourcées · sans engagement</p>
        </section>

        {/* 4. Comment ça marche */}
        <section>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-center leading-tight">
            Trois étapes pour reprendre la main
          </h2>
          <div className="mt-8 grid sm:grid-cols-3 gap-4">
            {ETAPES.map((e, i) => (
              <div key={e.title} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <div className="flex items-center gap-2 text-gold">
                  <span className="font-display text-lg font-bold">{i + 1}</span>
                  {e.icon}
                </div>
                <p className="mt-3 font-semibold">{e.title}</p>
                <p className="mt-1 text-sm text-paper/60">{e.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 5. Autorité / preuve */}
        <section className="text-center">
          <h2 className="font-display text-xl sm:text-2xl font-bold">Des chiffres, pas des promesses.</h2>
          <p className="mt-2 text-paper/70 max-w-xl mx-auto text-sm">
            Nos estimations s'appuient sur des données publiques sourcées — INSEE, DARES, APEC, France Travail.
            Aucun résultat n'est garanti : on te donne la vérité du marché, à toi de la défendre.
          </p>
          <div className="mt-6">
            <SocialProof index={0} />
          </div>
        </section>

        {/* 5bis. Objections / FAQ */}
        <section>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-center leading-tight">
            Les questions que tu te poses
          </h2>
          <div className="mt-6 space-y-3">
            {FAQ.map((item) => (
              <details key={item.q} className="group rounded-xl border border-white/10 bg-white/[0.02] px-5 py-4">
                <summary className="flex items-center justify-between cursor-pointer list-none font-semibold gap-3">
                  {item.q}
                  <ChevronDown className="w-4 h-4 text-gold shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm text-paper/70">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* 6. CTA final */}
        <section className="text-center border-t border-white/10 pt-12">
          <h2 className="font-display text-2xl sm:text-3xl font-bold leading-tight">
            Ton écart t'attend. <span className="text-paper/60">Il ne disparaîtra pas en l'ignorant.</span>
          </h2>
          <div className="mt-6">
            <Cta label="Calculer mon écart maintenant" />
          </div>
          <p className="mt-3 text-xs text-paper/50">
            Estimations indicatives basées sur des données publiques sourcées. Aucun résultat garanti.
          </p>
        </section>
      </div>

      {/* Barre CTA collante — apparaît au scroll */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ink/95 backdrop-blur transition-transform duration-300 ${
          showBar ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-sm text-paper/80 hidden sm:block">Ton écart de salaire t'attend — gratuit, 30 secondes.</p>
          <Link
            to="/analyse"
            className="bg-gold text-ink font-bold px-5 py-2.5 rounded-xl hover:brightness-105 transition inline-flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            Calculer mon écart <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </Layout>
  );
}
