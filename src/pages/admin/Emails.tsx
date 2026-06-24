import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { EmailEvent, EmailSequence } from '../../types';

/**
 * Séquence d'emails de vente du Kit. Éditables : délai, objet, corps HTML.
 * Variables : {{poste}}, {{gap_annual}}, {{gap_percent}}, {{kit_url}}, {{report_url}}.
 */
export default function Emails() {
  const [seq, setSeq] = useState<EmailSequence[]>([]);
  const [events, setEvents] = useState<EmailEvent[]>([]);
  const [saved, setSaved] = useState('');

  useEffect(() => {
    supabase.from('email_sequences').select('*').order('step').then(({ data }) => setSeq((data as EmailSequence[]) ?? []));
    supabase
      .from('email_events')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(50)
      .then(({ data }) => setEvents((data as EmailEvent[]) ?? []));
  }, []);

  const update = (id: string, patch: Partial<EmailSequence>) =>
    setSeq((s) => s.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  async function save(email: EmailSequence) {
    const { error } = await supabase
      .from('email_sequences')
      .update({
        delay_hours: email.delay_hours,
        subject: email.subject,
        body_html: email.body_html,
        active: email.active,
      })
      .eq('id', email.id);
    setSaved(error ? `Erreur : ${error.message}` : `Email ${email.step} enregistré.`);
    setTimeout(() => setSaved(''), 4000);
  }

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-3xl font-bold mb-2">Séquence emails</h1>
      <p className="text-paper/60 text-sm mb-8">
        Déclenchée à la capture du lead. Variables :{' '}
        <code className="text-gold">{'{{poste}} {{gap_annual}} {{gap_percent}} {{kit_url}} {{report_url}}'}</code>. Le
        cron d'envoi tourne toutes les 15 minutes ; la séquence s'arrête automatiquement à l'achat.
      </p>
      {saved && <p className="mb-4 text-gold font-semibold">{saved}</p>}

      <div className="space-y-6 mb-12">
        {seq.map((e) => (
          <div key={e.id} className="bg-paper/5 rounded-xl p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Email {e.step}</h2>
              <div className="flex items-center gap-4 text-sm">
                <label className="flex items-center gap-2">
                  Délai (heures après capture)
                  <input
                    type="number"
                    value={e.delay_hours}
                    onChange={(ev) => update(e.id, { delay_hours: Number(ev.target.value) })}
                    className="w-20 bg-ink border border-paper/20 rounded px-2 py-1"
                  />
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={e.active} onChange={(ev) => update(e.id, { active: ev.target.checked })} />
                  Actif
                </label>
              </div>
            </div>
            <input
              value={e.subject}
              onChange={(ev) => update(e.id, { subject: ev.target.value })}
              className="w-full bg-ink border border-paper/20 rounded-lg px-3 py-2 text-sm font-semibold"
              placeholder="Objet"
            />
            <textarea
              rows={8}
              value={e.body_html}
              onChange={(ev) => update(e.id, { body_html: ev.target.value })}
              className="w-full bg-ink border border-paper/20 rounded-lg px-3 py-2 text-sm font-mono"
            />
            <button onClick={() => save(e)} className="bg-gold text-ink font-bold px-5 py-2 rounded-lg text-sm">
              Enregistrer
            </button>
          </div>
        ))}
      </div>

      <h2 className="font-display text-xl font-bold mb-4">Derniers envois</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-paper/50 border-b border-paper/10">
            <th className="py-2 pr-4">Date</th>
            <th className="py-2 pr-4">Étape</th>
            <th className="py-2 pr-4">Statut</th>
            <th className="py-2">Erreur</th>
          </tr>
        </thead>
        <tbody>
          {events.map((ev) => (
            <tr key={ev.id} className="border-b border-paper/5">
              <td className="py-2 pr-4">{new Date(ev.sent_at).toLocaleString('fr-FR')}</td>
              <td className="py-2 pr-4">Email {ev.step}</td>
              <td className={`py-2 pr-4 ${ev.status === 'error' ? 'text-ember' : 'text-gold'}`}>{ev.status}</td>
              <td className="py-2 text-paper/60">{ev.error ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
