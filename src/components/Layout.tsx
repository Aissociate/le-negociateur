import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export default function Layout({ children, narrow }: { children: ReactNode; narrow?: boolean }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="font-display text-xl font-bold tracking-tight">
            Le <span className="text-gold">Négociateur</span>
          </Link>
          <Link to="/compte" className="text-sm text-paper/60 hover:text-paper transition">
            Mon compte
          </Link>
        </div>
      </header>

      <main className={`flex-1 w-full mx-auto px-4 py-8 ${narrow ? 'max-w-2xl' : 'max-w-5xl'}`}>
        {children}
      </main>

      <footer className="border-t border-white/10 text-xs text-paper/50">
        <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col sm:flex-row gap-2 justify-between">
          <span>© {new Date().getFullYear()} Le Négociateur — estimations indicatives, sourcées.</span>
          <div className="flex gap-4">
            <Link to="/mentions" className="hover:text-paper">Mentions légales</Link>
            <Link to="/confidentialite" className="hover:text-paper">Confidentialité</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
