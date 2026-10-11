'use client';
import { useTranslations } from 'next-intl';

// Day / night lighting for the map.
export function NightToggle({ night, onChange }: { night: boolean; onChange: (night: boolean) => void }) {
  const t = useTranslations('night');
  return (
    <button
      onClick={() => onChange(!night)}
      aria-pressed={night}
      aria-label={night ? t('toDay') : t('toNight')}
      title={night ? t('toDay') : t('toNight')}
      className={`pixel-btn grid h-10 w-10 place-items-center text-lg leading-none ${night ? '' : 'pixel-btn-paper'}`}
    >
      <span aria-hidden>{night ? '☾' : '☀'}</span>
    </button>
  );
}
