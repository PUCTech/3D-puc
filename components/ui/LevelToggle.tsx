'use client';
import { useTranslations } from 'next-intl';

// Street level vs the lower level (court, Prédio 2 subsolo, Prédio 3, DTI): a segmented sign plate, navy on the active side.
export function LevelToggle({ lower, onChange, className = '' }: { lower: boolean; onChange: (lower: boolean) => void; className?: string }) {
  const t = useTranslations('level');
  return (
    <div role="group" aria-label={t('label')} className={`plate flex h-11 gap-1 p-1 ${className}`}>
      {([false, true] as const).map((isLower) => (
        <button
          key={String(isLower)}
          onClick={() => onChange(isLower)}
          aria-pressed={lower === isLower}
          className={`rounded-[4px] px-3 text-sm font-bold transition-colors ${lower === isLower ? 'bg-navy text-white' : 'text-navy hover:bg-platform'}`}
        >
          {isLower ? t('lower') : t('street')}
        </button>
      ))}
    </div>
  );
}
