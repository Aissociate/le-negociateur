import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../lib/pixel';

// Déclenche un PageView Meta à chaque changement de route (SPA React Router).
// La toute première vue est déjà envoyée par le snippet inline dans index.html —
// on saute donc le montage initial pour ne pas la compter deux fois.
export default function PixelTracker() {
  const { pathname } = useLocation();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    trackPageView();
  }, [pathname]);

  return null;
}
