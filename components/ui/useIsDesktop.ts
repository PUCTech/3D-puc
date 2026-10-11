import { useSyncExternalStore } from 'react';

const QUERY = '(min-width: 1024px)'; // Tailwind lg
const subscribe = (onChange: () => void) => {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
};

// Desktop gets a persistent sidebar; phones get a top bar and bottom sheet.
// Server render assumes phone; the client switches after hydration.
export const useIsDesktop = () => useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);
