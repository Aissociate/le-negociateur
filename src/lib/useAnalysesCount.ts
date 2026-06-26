import { useEffect, useState } from 'react';
import { getFunction } from './supabase';

/** Nombre réel d'analyses générées (preuve sociale dynamique), ou null si indisponible. */
export function useAnalysesCount(): number | null {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    getFunction<{ analyses: number }>('public-data', { stat: 'analyses' })
      .then((r) => setCount(typeof r.analyses === 'number' ? r.analyses : null))
      .catch(() => setCount(null));
  }, []);
  return count;
}
