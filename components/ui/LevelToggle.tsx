'use client';
import { useTranslations } from 'next-intl';

// Street level vs the lower level (court, Prédio 2 subsolo, Prédio 3, DTI).
export function LevelToggle({ lower, onChange, className = '' }: { lower: boolean; onChange: (lower: boolean) => void; className?: string }) {
  const t = useTranslations('level');
  return (
    <div role="group" aria-label={t('label')} className={`flex ${className}`}>
      {([false, true] as const).map((isLower) => (
        <button
          key={String(isLower)}
          onClick={() => onChange(isLower)}
          aria-pressed={lower === isLower}
          className={`pixel-btn h-10 px-3 text-[13px] uppercase ${lower === isLower ? '' : 'pixel-btn-paper'} ${isLower ? '-ml-[3px]' : ''}`}
        >
          {isLower ? t('lower') : t('street')}
        </button>
      ))}
    </div>
  );
}
