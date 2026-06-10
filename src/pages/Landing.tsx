import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, ShieldCheck, Database, Lock } from 'lucide-react';
import { callFunction } from '../lib/supabase';
import { SECTEURS, SENIORITES, LOCALISATIONS } from '../types';
import type { GapReport } from '../types';

export default function Landing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    poste: '',
    secteur: SECTEURS[0],
    seniorite: SENIORITES[1],
    localisation: LOCALISATIONS[0],
    remuneration_actuelle: '',
    email: '',
    consent: false,
  });

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.consent) {
      setError('Merci de cocher la case de consentement pour recevoir votre analyse.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const report = await callFunction<GapReport>('rapport-ecart', {
        ...form,
        remuneration_actuelle: Number(form.remuneration_actuelle),
      });
      sessionStorage.setItem(`report:${report.id}`, JSON.stringify(report));
      navigate(`/rapport/${report.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue. Réessayez.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <header className="max-w-5xl mx-auto px-6 pt-16 pb-10 text-center">
        <p className="text-gold tracking-widest uppercase text-sm mb-4">Le Négociateur</p>
        <h1 className="font-display text-4xl md:text-6xl font-bold leading-tight">
          Chaque année sans négocier,
          <br />
          <span className="text-gold italic">combien laissez-vous sur la table ?</span>
        </h1>
        <p className="mt-6 text-lg text-paper/80 max-w-2xl mx-auto">
          Découvrez en 30 secondes le positionnement réel de votre salaire de cadre par rapport au
          marché français. Analyse gratuite, chiffrée et sourcée — base de données mise à jour
          chaque semaine.
        </p>
      </header>

      {/* Form */}
      <section className="max-w-xl mx-auto px-6 pb-16">
        <form onSubmit={submit} className="bg-paper text-ink rounded-2xl p-8 shadow-2xl space-y-4">
          <h2 className="font-display text-2xl font-bold text-center">
            Votre analyse de positionnement gratuite
          </h2>

          <div>
            <label className="block text-sm font-semibold mb-1">Intitulé de poste</label>
            <input
              required
              value={form.poste}
              onChange={(e) => set('poste', e.target.value)}
              placeholder="Ex. Chef de projet, Ingénieur logiciel, Responsable marketing…"
              className="w-full rounded-lg border border-ink/20 px-4 py-3 bg-white"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Secteur</label>
              <select
                value={form.secteur}
                onChange={(e) => set('secteur', e.target.value)}
                className="w-full rounded-lg border border-ink/20 px-4 py-3 bg-white"
              >
                {SECTEURS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Expérience</label>
              <select
                value={form.seniorite}
                onChange={(e) => set('seniorite', e.target.value)}
                className="w-full rounded-lg border border-ink/20 px-4 py-3 bg-white"
              >
                {SENIORITES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Localisation</label>
              <select
                value={form.localisation}
                onChange={(e) => set('localisation', e.target.value)}
                className="w-full rounded-lg border border-ink/20 px-4 py-3 bg-white"
              >
                {LOCALISATIONS.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Salaire brut annuel (€)</label>
              <input
                required
                type="number"
                min={20000}
                max={500000}
                value={form.remuneration_actuelle}
                onChange={(e) => set('remuneration_actuelle', e.target.value)}
                placeholder="Ex. 52000"
                className="w-full rounded-lg border border-ink/20 px-4 py-3 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Votre email professionnel</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="prenom.nom@email.fr"
              className="w-full rounded-lg border border-ink/20 px-4 py-3 bg-white"
            />
          </div>

          <label className="flex items-start gap-3 text-sm text-ink/70">
            <input
              type="checkbox"
              checked={form.consent}
              onChange={(e) => set('consent', e.target.checked)}
              className="mt-1"
            />
            <span>
              J'accepte de recevoir mon analyse par email ainsi que les conseils du Négociateur.
              Désinscription en un clic, données jamais revendues (RGPD).
            </span>
          </label>

          {error && <p className="text-ember text-sm font-semibold">{error}</p>}

          <button
            disabled={loading}
            className="w-full bg-ink text-paper font-bold py-4 rounded-lg hover:bg-ink/90 transition disabled:opacity-50"
          >
            {loading ? 'Analyse en cours…' : 'Révéler mon écart de salaire →'}
          </button>
          <p className="text-center text-xs text-ink/50 flex items-center justify-center gap-1">
            <Lock size={12} /> Gratuit · Sans engagement · Résultat immédiat
          </p>
        </form>
      </section>

      {/* Reassurance */}
      <section className="border-t border-paper/10 bg-black/20">
        <div className="max-w-5xl mx-auto px-6 py-14 grid md:grid-cols-3 gap-10 text-center">
          <div>
            <Database className="mx-auto text-gold mb-3" />
            <h3 className="font-display font-bold text-lg mb-2">Données sourcées</h3>
            <p className="text-paper/70 text-sm">
              Référentiel de salaires cadres par poste, secteur, expérience et région — actualisé
              chaque semaine, sources publiques citées.
            </p>
          </div>
          <div>
            <TrendingUp className="mx-auto text-gold mb-3" />
            <h3 className="font-display font-bold text-lg mb-2">Écart chiffré</h3>
            <p className="text-paper/70 text-sm">
              Pas de généralités : un chiffre en euros, par an, entre votre rémunération et votre
              valeur de marché estimée.
            </p>
          </div>
          <div>
            <ShieldCheck className="mx-auto text-gold mb-3" />
            <h3 className="font-display font-bold text-lg mb-2">Confidentiel</h3>
            <p className="text-paper/70 text-sm">
              Vos informations restent privées. Aucune donnée transmise à votre employeur ni à des
              tiers.
            </p>
          </div>
        </div>
      </section>

      <footer className="text-center text-paper/40 text-xs py-8">
        © {new Date().getFullYear()} Le Négociateur — Estimations indicatives, pas un conseil
        juridique ou financier.
      </footer>
    </div>
  );
}
