'use client';
import { useLocale, useTranslations } from 'next-intl';
import { campus, type Locale } from '@/lib/campus';
import { history } from '@/lib/history';
import { History } from './History';
import { Icon } from './Icon';
import { LineBullet } from './LineBullet';

type Props = { onPick: (id: string) => void };

// The building index, shown in the desktop sidebar and the phone sheet.
export function BuildingList({ onPick }: Props) {
  const t = useTranslations('list');
  const ts = useTranslations('sheet');
  const th = useTranslations('history');
  const locale = useLocale() as Locale;
  const buildings = [...campus.buildings].sort((a, b) => a.name[locale].localeCompare(b.name[locale], locale, { numeric: true }));
  // One row per building, like a station's line index: bullet, name, how many floors.
  const items = (
    <ul className="divide-y divide-rule border-y border-rule">
      {buildings.map((b) => (
        <li key={b.id}>
          <button
            data-testid="building-list-item"
            onClick={() => onPick(b.id)}
            className="group flex min-h-14 w-full items-center gap-3 px-1 py-2 text-left hover:bg-platform focus-visible:-outline-offset-2"
          >
            <LineBullet id={b.id} name={b.name[locale]} className="h-9 w-9 text-base" />
            <span className="flex-1 text-[17px] font-bold leading-tight text-ink">{b.name[locale]}</span>
            <span className="text-sm tabular-nums text-muted">{ts('floors', { count: b.floors.filter((f) => f.level >= 0).length })}</span>
            <Icon name="next" size={18} className="text-navy/60 transition-transform group-hover:translate-x-0.5" />
          </button>
        </li>
      ))}
    </ul>
  );
  // The site's own story (before the buildings), folded under the list.
  const site = (
    <details className="group mt-4 border-y border-rule">
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-1 py-2 font-bold text-ink hover:bg-platform [&::-webkit-details-marker]:hidden">
        <span aria-hidden className="grid h-9 w-9 place-items-center rounded-full bg-amarela text-navy">
          <Icon name="clock" size={18} />
        </span>
        <span className="flex-1">{th('site')}</span>
        <span className="rounded-md bg-amarela px-1.5 py-0.5 text-xs font-bold tabular-nums text-navy">1930</span>
        <Icon name="next" size={18} className="text-navy/60 transition-transform group-open:rotate-90" />
      </summary>
      <div className="border-t border-rule py-4">
        <History entries={[history.site]} />
      </div>
    </details>
  );
  return (
    <nav aria-label={t('title')}>
      <h2 className="text-xl font-black tracking-tight text-navy">{t('title')}</h2>
      <p className="mb-3 mt-0.5 text-sm text-muted">{t('hint')}</p>
      {items}
      {site}
    </nav>
  );
}
