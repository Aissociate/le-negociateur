// Parseur CSV minimal mais robuste, partagé (import prospects + import barèmes).
// Gère : champs entre guillemets, "" échappés, CRLF, et détection auto du
// délimiteur (`,`, `;` Excel FR, ou tabulation).

export function detectDelimiter(line: string): string {
  const ranked = [',', ';', '\t']
    .map((d) => [d, line.split(d).length] as const)
    .sort((a, b) => b[1] - a[1]);
  return ranked[0][1] > 1 ? ranked[0][0] : ',';
}

export function parseCSV(text: string): string[][] {
  const nl = text.indexOf('\n');
  const delim = detectDelimiter(text.slice(0, nl >= 0 ? nl : text.length));
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === delim) {
      row.push(field);
      field = '';
    } else if (c === '\r') {
      /* ignore */
    } else if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

/** Auto-mappe les en-têtes CSV vers des champs cibles via synonymes (normalisés). */
export function guessMapping(headers: string[], synonyms: Record<string, string[]>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [key, syns] of Object.entries(synonyms)) {
    out[key] = headers.findIndex((h) => syns.includes(h.trim().toLowerCase()));
  }
  return out;
}
