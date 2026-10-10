'use client';
import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { campus, type Locale } from '@/lib/campus';
import { searchBuildings } from '@/lib/search';

export function SearchBar({ onPick }: { onPick: (id: string) => void }) {
  const t = useTranslations('search');
  const locale = useLocale() as Locale;
  const [q, setQ] = useState('');
  const results = q.trim() ? searchBuildings(campus.buildings, q) : [];
  const pick = (id: string) => { onPick(id); setQ(''); };
  return (
    <div className="relative">
      <input
        type="search"
        aria-label={t('label')}
        placeholder={t('placeholder')}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && results[0] && pick(results[0].id)}
        className="h-11 w-full rounded-xl border border-deep bg-night/85 px-4 text-sm text-paper placeholder:text-ice/50 backdrop-blur focus:border-ice focus:outline-none"
      />
      {q.trim() && (
        <ul className="absolute inset-x-0 top-12 max-h-[60vh] overflow-y-auto rounded-xl border border-deep bg-night/95 backdrop-blur">
          {results.length === 0 && <li className="px-4 py-3 text-sm text-ice/60">{t('noResults')}</li>}
          {results.map((b) => (
            <li key={b.id}>
              <button onClick={() => pick(b.id)} className="w-full px-4 py-3 text-left text-sm hover:bg-deep focus:bg-deep focus:outline-none">
                {b.name[locale]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
