/**
 * Rendu markdown minimaliste (titres, gras, listes, paragraphes).
 * Volontairement sans dependance externe — suffisant pour les sorties IA contrôlées.
 */
export default function Markdown({ text, className = '' }: { text: string; className?: string }) {
  const blocks = text.split(/\n{2,}/);
  return (
    <div className={className}>
      {blocks.map((block, i) => {
        const lines = block.split('\n').filter(Boolean);
        if (lines.length === 0) return null;
        if (lines.every((l) => /^\s*[-*•]\s+/.test(l))) {
          return (
            <ul key={i} className="list-disc pl-6 my-3 space-y-1">
              {lines.map((l, j) => (
                <li key={j}>{inline(l.replace(/^\s*[-*•]\s+/, ''))}</li>
              ))}
            </ul>
          );
        }
        const first = lines[0];
        if (/^###\s+/.test(first)) {
          return (
            <h4 key={i} className="font-display text-lg font-bold mt-5 mb-2">
              {inline(first.replace(/^###\s+/, ''))}
            </h4>
          );
        }
        if (/^##\s+/.test(first)) {
          return (
            <h3 key={i} className="font-display text-xl font-bold mt-6 mb-2">
              {inline(first.replace(/^##\s+/, ''))}
            </h3>
          );
        }
        if (/^#\s+/.test(first)) {
          return (
            <h2 key={i} className="font-display text-2xl font-bold mt-6 mb-3">
              {inline(first.replace(/^#\s+/, ''))}
            </h2>
          );
        }
        return (
          <p key={i} className="my-3 leading-relaxed">
            {inline(block)}
          </p>
        );
      })}
    </div>
  );
}

function inline(text: string) {
  // **gras** uniquement — découpe et alterne texte / <strong>
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part));
}
