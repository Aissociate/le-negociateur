import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Send, Mic, Loader2, RotateCcw, Award } from 'lucide-react';
import Layout from '../components/Layout';
import { supabase, callAuthFunction, callFunction } from '../lib/supabase';

type Msg = { role: 'user' | 'assistant'; content: string };
type Persona = { key: string; label: string; prompt: string };

const FALLBACK_PERSONA: Persona = {
  key: 'default',
  label: 'Manager',
  prompt: 'Manager direct et factuel, attaché au budget, ouvert mais exigeant.',
};

export default function Simulateur() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const acces = params.get('acces') ?? '';
  const [authChecked, setAuthChecked] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [persona, setPersona] = useState<Persona>(FALLBACK_PERSONA);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [err, setErr] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recRef = useRef<any>(null);

  useEffect(() => {
    // Accès direct par token (lien email) : pas de login requis.
    if (acces) {
      callFunction<{ entitlements: { simulator: boolean } }>('account-data', { token: acces })
        .then((acc) => setAllowed(acc.entitlements.simulator))
        .catch(() => setAllowed(false))
        .finally(() => setAuthChecked(true));
      return;
    }
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        navigate('/compte');
        return;
      }
      try {
        const acc = await callAuthFunction<{ entitlements: { simulator: boolean } }>('account-data', {});
        setAllowed(acc.entitlements.simulator);
      } catch {
        setAllowed(false);
      }
      setAuthChecked(true);
    });
  }, [navigate, acces]);

  useEffect(() => {
    supabase
      .from('simulator_personas')
      .select('key,label,prompt')
      .eq('active', true)
      .order('position')
      .then(({ data }) => {
        const list = (data as Persona[]) ?? [];
        if (list.length) {
          setPersonas(list);
          setPersona(list[0]);
        }
      });
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);

  async function exchange(history: Msg[], visible: Msg[]) {
    setBusy(true);
    setErr('');
    setMessages(visible);
    try {
      const { reply } = acces
        ? await callFunction<{ reply: string }>('interview-chat', { messages: history, persona: persona.prompt, token: acces })
        : await callAuthFunction<{ reply: string }>('interview-chat', { messages: history, persona: persona.prompt });
      setMessages([...visible, { role: 'assistant', content: reply }]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erreur');
      setMessages(visible);
    }
    setBusy(false);
  }

  function start() {
    const kickoff: Msg = { role: 'user', content: "(Le candidat entre dans votre bureau pour parler de sa rémunération. Démarrez l'entretien.)" };
    // kickoff envoyé à l'IA mais masqué de l'affichage
    exchange([kickoff], []);
    setInput('');
  }
  function userSend(text: string) {
    const userMsg: Msg = { role: 'user', content: text };
    exchange([...messages, userMsg], [...messages, userMsg]);
    setInput('');
  }
  function feedback() {
    userSend('[FEEDBACK] Donne-moi un débrief de ma performance et une note sur 10.');
  }

  function voice() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) {
      setErr('Reconnaissance vocale non supportée par ce navigateur (essayez Chrome).');
      return;
    }
    const rec = new SR();
    rec.lang = 'fr-FR';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => setInput((prev) => (prev ? prev + ' ' : '') + e.results[0][0].transcript);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.start();
    recRef.current = rec;
    setListening(true);
  }

  if (!authChecked) return <Layout narrow><p className="text-center py-16 text-paper/40">…</p></Layout>;

  if (!allowed) {
    return (
      <Layout narrow>
        <div className="text-center py-16">
          <p className="text-paper/70 mb-4">L'Agent Recruteur IA nécessite un accès actif.</p>
          <Link to="/kit" className="bg-gold text-ink font-bold px-5 py-3 rounded-lg inline-block">Activer l'Agent Recruteur IA</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout narrow>
      <div className="flex items-center justify-between mb-4 gap-3">
        <h1 className="font-display text-2xl font-bold">Agent Recruteur IA</h1>
        <select
          value={persona.key}
          onChange={(e) => {
            const list = personas.length ? personas : [FALLBACK_PERSONA];
            setPersona(list.find((p) => p.key === e.target.value) ?? persona);
          }}
          className="bg-ink border border-white/15 rounded-lg px-3 py-2 text-sm"
        >
          {(personas.length ? personas : [FALLBACK_PERSONA]).map((p) => (
            <option key={p.key} value={p.key}>{p.label}</option>
          ))}
        </select>
      </div>

      <div ref={scrollRef} className="h-[55vh] overflow-y-auto rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
        {messages.length === 0 && !busy && (
          <p className="text-paper/40 text-sm text-center py-10">
            Choisis un persona puis lance l'entretien. L'IA joue le recruteur, connaît ta situation et mène la discussion.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-gold text-ink' : 'bg-white/[0.06] text-paper'}`}>
              {m.content}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="bg-white/[0.06] rounded-2xl px-4 py-2.5"><Loader2 className="w-4 h-4 animate-spin" /></div>
          </div>
        )}
      </div>

      {err && <p className="text-ember text-sm mt-2">{err}</p>}

      {messages.length === 0 ? (
        <button onClick={start} disabled={busy} className="mt-4 w-full bg-gold text-ink font-bold py-3 rounded-xl disabled:opacity-50 hover:brightness-105 transition">
          Lancer l'entretien
        </button>
      ) : (
        <>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={voice} className={`p-3 rounded-xl border shrink-0 ${listening ? 'border-gold text-gold animate-pulse' : 'border-white/15 text-paper/60'}`} title="Parler">
              <Mic className="w-5 h-5" />
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && input.trim() && !busy) userSend(input.trim()); }}
              placeholder="Ta réponse…"
              className="flex-1 bg-ink border border-white/15 rounded-xl px-4 py-3 text-sm focus:border-gold focus:outline-none"
            />
            <button onClick={() => input.trim() && userSend(input.trim())} disabled={busy || !input.trim()} className="p-3 rounded-xl bg-gold text-ink disabled:opacity-50 shrink-0">
              <Send className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-3 flex gap-4 justify-center text-sm">
            <button onClick={feedback} disabled={busy} className="flex items-center gap-1 text-gold disabled:opacity-50"><Award className="w-4 h-4" /> Demander un débrief</button>
            <button onClick={start} disabled={busy} className="flex items-center gap-1 text-paper/50 disabled:opacity-50"><RotateCcw className="w-4 h-4" /> Recommencer</button>
          </div>
        </>
      )}
    </Layout>
  );
}
