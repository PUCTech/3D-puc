'use client';
import { useTranslations } from 'next-intl';
import { Icon } from './Icon';

// Day / night lighting for the map.
export function NightToggle({ night, onChange }: { night: boolean; onChange: (night: boolean) => void }) {
  const t = useTranslations('night');
  return (
    <button
      onClick={() => onChange(!night)}
      aria-pressed={night}
      aria-label={night ? t('toDay') : t('toNight')}
      title={night ? t('toDay') : t('toNight')}
      className="plate-btn grid h-11 w-11 place-items-center"
    >
      <Icon name={night ? 'moon' : 'sun'} />
    </button>
  );
}
