import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Check, X, ShieldCheck, BadgeCheck, Wallet, MonitorPlay, GraduationCap, Star, Loader2, Lock,
} from 'lucide-react';
import Layout from '../components/Layout';
import { callFunction } from '../lib/supabase';

// Vidéo de présentation. Par défaut : le film HTML animé (export Claude Design)
// déposé dans public/formation-film/. VITE_FORMATION_VIDEO_URL=off pour le couper,
// ou une URL (embed YouTube/Vimeo, .mp4, ou autre film) pour le remplacer.
const filmEnv = import.meta.env.VITE_FORMATION_VIDEO_URL as string | undefined;
const VIDEO_URL = filmEnv === 'off' ? undefined : filmEnv || '/formation-film/Formation-IA-Video.dc.html';

// ⚠️ Témoignages ILLUSTRATIFS — à remplacer par de VRAIS avis avant production
// (honnêteté publicitaire, cf. CONFORMITE.md). De même, les mentions Qualiopi /
// CPF / financement doivent correspondre à une formation réellement certifiée.
const AVIS = [
  { name: 'Nadia B.', role: 'Chargée de mission', quote: "100 % à distance et financée par mon CPF : zéro euro de ma poche, et une vraie ligne de plus sur mon CV." },
  { name: 'Olivier M.', role: 'Responsable ADV', quote: "Savoir manier les outils IA a pesé lourd à mon entretien annuel — j'ai justifié ma demande autrement que sur l'ancienneté." },
  { name: 'Farida K.', role: 'Assistante de direction', quote: "Le côté certifiant rassure mon employeur. Inscription simple, accompagnement au top du début à la fin." },
];

const BENEFICES = [
  "Comprendre et utiliser l'IA générative (ChatGPT, Claude…) au quotidien professionnel",
  'Automatiser tes tâches répétitives et gagner des heures chaque semaine',
  'Une compétence recherchée qui pèse dans ta prochaine négociation salariale',
  'Une attestation de fin de formation à valoriser sur ton CV et LinkedIn',
];

export default function Formation() {
  const [params] = useSearchParams();
  const session = params.get('session') ?? '';
  const navigate = useNavigate();
  const [busy, setBusy] = useState<null | 'oui' | 'non'>(null);

  function next() {
    navigate(`/personnaliser${session ? `?session=${encodeURIComponent(session)}` : ''}`);
  }

  async function choose(interested: boolean) {
    setBusy(interested ? 'oui' : 'non');
    try {
      await callFunction('formation-interest', { session, interested, offer: 'formation-ia-cpf' });
    } catch {
      // On ne bloque jamais le tunnel sur l'enregistrement de l'intérêt.
    }
    next();
  }

  return (
    <Layout narrow>
      <div className="text-center mb-6">
        <span className="text-gold text-xs font-bold uppercase tracking-widest">Réservé aux membres — offre unique</span>
        <h1 className="font-display text-2xl sm:text-3xl font-bold mt-2 leading-tight">
          Et si ta prochaine augmentation passait par <span className="text-gold italic">la compétence la plus recherchée de 2026</span> ?
        </h1>
        <p className="text-paper/75 mt-3 max-w-xl mx-auto">
          Forme-toi à l'intelligence artificielle — <strong>financé par ton CPF</strong>, à distance, sans avance de frais.
          Le meilleur argument pour valoir plus… c'est de valoir plus.
        </p>
      </div>

      {/* Vidéo de présentation */}
      <div className="aspect-video w-full rounded-2xl overflow-hidden border border-white/10 bg-ink/60">
        {VIDEO_URL ? (
          <iframe
            src={VIDEO_URL}
            title="Présentation de la formation"
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-paper/40 gap-2">
            <MonitorPlay className="w-10 h-10" />
            <p className="text-sm">Vidéo de présentation — bientôt disponible</p>
          </div>
        )}
      </div>

      {/* Arguments d'autorité */}
      <div className="grid sm:grid-cols-3 gap-3 mt-6">
        <Authority icon={<BadgeCheck className="w-5 h-5" />} title="Certifié Qualiopi" text="La marque de qualité reconnue par l'État pour les formations finançables." />
        <Authority icon={<Wallet className="w-5 h-5" />} title="Éligible CPF" text="Finançable avec tes droits formation — souvent sans aucun reste à charge." />
        <Authority icon={<GraduationCap className="w-5 h-5" />} title="100 % à distance" text="À ton rythme, avec un accompagnement individuel jusqu'à l'attestation." />
      </div>

      {/* Bénéfices */}
      <div className="mt-6 bg-paper text-ink rounded-2xl p-6">
        <h2 className="font-display text-xl font-bold">Ce que tu en retires</h2>
        <ul className="mt-4 space-y-2">
          {BENEFICES.map((b) => (
            <li key={b} className="flex gap-2 text-sm">
              <Check className="w-4 h-4 text-gold shrink-0 mt-0.5" /> {b}
            </li>
          ))}
        </ul>
      </div>

      {/* Réassurance / garanties */}
      <div className="mt-4 rounded-xl border border-gold/30 bg-gold/5 p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-gold shrink-0 mt-0.5" />
          <div className="text-sm text-paper/80">
            <p className="font-semibold text-paper">Sans engagement, sans risque.</p>
            <p className="mt-1">
              Tu dis simplement « oui » pour qu'on <strong>étudie gratuitement ton éligibilité CPF</strong>. Aucun
              paiement aujourd'hui, aucune carte demandée. Tu décides ensuite, en toute liberté.
            </p>
          </div>
        </div>
      </div>

      {/* Témoignages */}
      <div className="mt-6 grid sm:grid-cols-3 gap-3">
        {AVIS.map((a) => (
          <figure key={a.name} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex gap-0.5 text-gold mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-current" />
              ))}
            </div>
            <blockquote className="text-sm text-paper/80">“{a.quote}”</blockquote>
            <figcaption className="mt-2 text-xs text-paper/50">{a.name} — {a.role}</figcaption>
          </figure>
        ))}
      </div>

      {/* Décision Oui / Non */}
      <div className="mt-8">
        <button
          onClick={() => choose(true)}
          disabled={!!busy}
          className="w-full bg-gold text-ink font-bold py-4 rounded-xl hover:brightness-105 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {busy === 'oui' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
          Oui, étudiez mon éligibilité (gratuit, sans engagement)
        </button>
        <button
          onClick={() => choose(false)}
          disabled={!!busy}
          className="mt-3 w-full flex items-center justify-center gap-1 text-sm text-paper/50 hover:text-paper disabled:opacity-50"
        >
          {busy === 'non' ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
          Non merci, passer à la personnalisation de mon Kit
        </button>
        <p className="mt-4 text-center text-xs text-paper/40 flex items-center justify-center gap-1">
          <Lock className="w-3 h-3" /> Tes données restent confidentielles — zéro spam, désinscription à tout moment.
        </p>
      </div>
    </Layout>
  );
}

function Authority({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-center">
      <div className="text-gold flex justify-center mb-2">{icon}</div>
      <p className="font-semibold text-sm">{title}</p>
      <p className="text-xs text-paper/55 mt-1">{text}</p>
    </div>
  );
}
