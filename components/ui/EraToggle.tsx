'use client';
import { useTranslations } from 'next-intl';
import type { Era } from '@/lib/campus';

// Today's campus vs Rino Levi's institute in 1943: a segmented sign plate, navy on the active side.
export function EraToggle({ era, onChange }: { era: Era; onChange: (era: Era) => void }) {
  const t = useTranslations('era');
  return (
    <div role="group" aria-label={t('label')} className="plate flex h-11 gap-1 p-1">
      {(['hoje', '1943'] as const).map((e) => (
        <button
          key={e}
          onClick={() => onChange(e)}
          aria-pressed={era === e}
          className={`rounded-[4px] px-3 text-sm font-bold tabular-nums transition-colors ${era === e ? 'bg-navy text-white' : 'text-navy hover:bg-platform'}`}
        >
          {e === 'hoje' ? t('today') : '1943'}
        </button>
      ))}
    </div>
  );
}
