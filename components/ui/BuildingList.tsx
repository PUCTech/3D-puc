'use client';
import { useLocale, useTranslations } from 'next-intl';
import { campus, type Locale } from '@/lib/campus';
import { history } from '@/lib/history';
import { History } from './History';

type Props = { onPick: (id: string) => void };

// The building index, shown in the desktop sidebar and the phone sheet.
export function BuildingList({ onPick }: Props) {
  const t = useTranslations('list');
  const th = useTranslations('history');
  const locale = useLocale() as Locale;
  const buildings = [...campus.buildings].sort((a, b) => a.name[locale].localeCompare(b.name[locale], locale, { numeric: true }));
  const items = (
    <ul className="space-y-2">
      {buildings.map((b, i) => (
        <li key={b.id}>
          <button
            data-testid="building-list-item"
            onClick={() => onPick(b.id)}
            className="pixel-row group flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-ice focus:bg-ice focus:outline-none"
          >
            <span className="pixel-chip grid h-7 w-7 shrink-0 place-items-center bg-puc text-[13px] text-white">{i + 1}</span>
            <span className="flex-1 text-base font-semibold text-navy">{b.name[locale]}</span>
            <span className="font-display text-navy/40 transition-transform group-hover:translate-x-1">▶</span>
          </button>
        </li>
      ))}
    </ul>
  );
  // The site's own story (before the buildings), folded under the list.
  const site = (
    <details className="pixel-row mt-4 bg-white">
      <summary className="cursor-pointer px-3 py-2.5 font-semibold text-navy hover:bg-ice">
        {th('site')} <span className="pixel-chip ml-1 bg-sun px-1.5 font-display text-[12px] text-ink">1930</span>
      </summary>
      <div className="border-t-2 border-ink p-3">
        <History entries={[history.site]} />
      </div>
    </details>
  );
  return (
    <nav aria-label={t('title')}>
      <h2 className="font-display text-sm uppercase tracking-widest text-ink/55">{t('title')}</h2>
      <p className="mb-3 mt-1 text-xs text-ink/55">{t('hint')}</p>
      {items}
      {site}
    </nav>
  );
}
