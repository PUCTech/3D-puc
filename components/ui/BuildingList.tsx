'use client';
import { useLocale, useTranslations } from 'next-intl';
import { campus, type Locale } from '@/lib/campus';

export function BuildingList({ onPick, onClose, closable }: { onPick: (id: string) => void; onClose: () => void; closable: boolean }) {
  const t = useTranslations('list');
  const locale = useLocale() as Locale;
  const buildings = [...campus.buildings].sort((a, b) => a.name[locale].localeCompare(b.name[locale], locale, { numeric: true }));
  return (
    <nav data-testid="building-list" aria-label={t('title')} className="pointer-events-auto fixed inset-x-4 z-20 top-20 bottom-4 overflow-y-auto rounded-2xl border border-deep bg-night/95 p-4 backdrop-blur lg:left-auto lg:w-80">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-mono text-xs uppercase tracking-widest text-ice">{t('title')}</h2>
        {closable && <button onClick={onClose} aria-label={t('close')} className="px-2 text-ice/70 hover:text-ice">✕</button>}
      </div>
      <ul className="space-y-1">
        {buildings.map((b) => (
          <li key={b.id}>
            <button data-testid="building-list-item" onClick={() => onPick(b.id)} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-deep focus:bg-deep focus:outline-none">
              {b.name[locale]}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
