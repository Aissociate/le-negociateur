import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError('Identifiants invalides.');
      return;
    }
    navigate('/admin');
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <form onSubmit={login} className="bg-paper text-ink rounded-2xl p-8 w-full max-w-sm space-y-4">
        <h1 className="font-display text-2xl font-bold text-center">Espace admin</h1>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full rounded-lg border border-ink/20 px-4 py-3 bg-white"
        />
        <input
          required
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mot de passe"
          className="w-full rounded-lg border border-ink/20 px-4 py-3 bg-white"
        />
        {error && <p className="text-ember text-sm font-semibold">{error}</p>}
        <button disabled={loading} className="w-full bg-ink text-paper font-bold py-3 rounded-lg disabled:opacity-50">
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </div>
  );
}
