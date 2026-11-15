import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToHash() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = decodeURIComponent(hash.slice(1));

      const frame = window.requestAnimationFrame(() => {
        const element = document.getElementById(id);

        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.scrollTo({ top: 0 });
        }
      });

      return () => window.cancelAnimationFrame(frame);
    }

    window.scrollTo({ top: 0 });
    return undefined;
  }, [pathname, hash]);

  return null;
}
