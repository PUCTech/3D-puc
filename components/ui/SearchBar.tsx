'use client';
import { useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { campus, type Locale } from '@/lib/campus';
import { searchBuildings } from '@/lib/search';

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
        className="pixel-box h-11 w-full px-3 text-sm text-ink placeholder:text-ink/45 focus:outline-none focus-visible:outline-3 focus-visible:outline-puc"
      />
      <p role="status" className="sr-only">
        {q.trim() && (results.length ? t('count', { count: results.length }) : t('noResults'))}
      </p>
      {q.trim() && (
        <ul className={`pixel-box ${inline ? 'mt-3' : 'absolute inset-x-0 top-[calc(100%+8px)] z-30 max-h-[60vh] overflow-y-auto'}`}>
          {results.length === 0 && <li className="px-3 py-3 text-sm text-ink/60">{t('noResults')}</li>}
          {results.map((b) => (
            <li key={b.id} className="border-b-2 border-ink/10 last:border-b-0">
              <button onClick={() => pick(b.id)} className="w-full px-3 py-2.5 text-left text-base font-semibold text-navy hover:bg-ice focus:bg-ice focus:outline-none">
                {b.name[locale]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
