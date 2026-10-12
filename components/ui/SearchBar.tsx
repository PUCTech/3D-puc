'use client';
import { useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { campus, type Locale } from '@/lib/campus';
import { searchBuildings } from '@/lib/search';
import { Icon } from './Icon';
import { LineBullet } from './LineBullet';

// inline: results flow under the input (inside the phone sheet) instead of a floating dropdown.
// onFocus: lets the phone sheet open fully, above the keyboard.
export function SearchBar({ onPick, inline = false, onFocus }: { onPick: (id: string) => void; inline?: boolean; onFocus?: () => void }) {
  const t = useTranslations('search');
  const locale = useLocale() as Locale;
  const [q, setQ] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const results = q.trim() ? searchBuildings(campus.buildings, q) : [];
  // blur() drops the phone keyboard, which would otherwise cover the sheet
  const pick = (id: string) => { onPick(id); setQ(''); input.current?.blur(); };
  return (
    <div className="relative">
      <Icon name="search" className="pointer-events-none absolute left-3.5 top-[15px] text-navy" />
      <input
        ref={input}
        type="search"
        aria-label={t('label')}
        placeholder={t('placeholder')}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={onFocus}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && results[0]) pick(results[0].id);
          if (e.key === 'Escape') setQ('');
        }}
        className="h-[50px] w-full rounded-xl border-2 border-navy bg-white pl-11 pr-3 text-base font-medium text-ink placeholder:text-muted focus:outline-none focus-visible:ring-4 focus-visible:ring-navy/25"
      />
      <p role="status" className="sr-only">
        {q.trim() && (results.length ? t('count', { count: results.length }) : t('noResults'))}
      </p>
      {q.trim() && (
        <ul className={`plate overflow-hidden ${inline ? 'mt-3' : 'absolute inset-x-0 top-[calc(100%+8px)] z-30 max-h-[60vh] overflow-y-auto'}`}>
          {results.length === 0 && <li className="px-4 py-3.5 text-sm text-muted">{t('noResults')}</li>}
          {results.map((b) => (
            <li key={b.id} className="border-b border-rule last:border-b-0">
              <button onClick={() => pick(b.id)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-base font-bold text-ink hover:bg-platform focus-visible:-outline-offset-2">
                <LineBullet id={b.id} name={b.name[locale]} className="h-7 w-7 text-[13px]" />
                {b.name[locale]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
