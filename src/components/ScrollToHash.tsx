import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToHash – listens for URL hash changes and scrolls to the target element.
 * Also scrolls to top when navigating to a new page without a hash.
 * Must be used inside a <Router> component.
 */
export default function ScrollToHash() {
  const { pathname, hash, key } = useLocation();
  const prevKey = useRef(key);

  useEffect(() => {
    // key changes on every navigation, even same-page hash changes
    if (key === prevKey.current) return;
    prevKey.current = key;

    if (hash) {
      // Delay to ensure page content is rendered
      const timeoutId = setTimeout(() => {
        const id = hash.replace('#', '');
        const el = document.getElementById(id);
        if (el) {
          const headerOffset = 130;
          const elementPosition = el.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({
            top: elementPosition - headerOffset,
            behavior: 'smooth',
          });
        }
      }, 150);
      return () => clearTimeout(timeoutId);
    } else {
      // No hash → scroll to top
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [pathname, hash, key]);

  return null;
}
