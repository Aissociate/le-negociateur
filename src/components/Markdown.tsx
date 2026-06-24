import { ReactNode } from 'react';

// Mini-rendu Markdown sûr (pas de HTML brut) : titres, gras, listes, paragraphes.
// Suffisant pour les analyses IA et les livrables générés.

function inline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(<strong key={key++}>{m[1]}</strong>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function renderBlock(block: string, i: number): ReactNode {
  if (block.startsWith('### ')) return <h3 key={i} className="text-lg font-display font-semibold mt-5 mb-2">{inline(block.slice(4))}</h3>;
  if (block.startsWith('## ')) return <h2 key={i} className="text-xl font-display font-semibold mt-6 mb-2">{inline(block.slice(3))}</h2>;
  if (block.startsWith('# ')) return <h1 key={i} className="text-2xl font-display font-bold mt-6 mb-3">{inline(block.slice(2))}</h1>;

  const lines = block.split('\n');
  if (lines.every((l) => l.startsWith('- ') || l.startsWith('* '))) {
    return (
      <ul key={i} className="list-disc pl-5 space-y-1 my-3">
        {lines.map((l, j) => (
          <li key={j}>{inline(l.slice(2))}</li>
        ))}
      </ul>
    );
  }

  return (
    <p key={i} className="my-3 leading-relaxed">
      {lines.flatMap((l, j) => (j === 0 ? inline(l) : [<br key={`br${j}`} />, ...inline(l)]))}
    </p>
  );
}

export default function Markdown({ children, className }: { children: string; className?: string }) {
  const blocks = children.trim().split(/\n{2,}/);
  return <div className={className}>{blocks.map((b, i) => renderBlock(b, i))}</div>;
}
