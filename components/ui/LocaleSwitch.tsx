'use client';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';

// className: swaps the default white plate (e.g. for the desktop's navy header).
export function LocaleSwitch({ className = 'plate-btn' }: { className?: string }) {
  const t = useTranslations('locale');
  const other = useLocale() === 'pt' ? 'en' : 'pt';
  const qs = useSearchParams().toString();
  return (
    // Plain <a>: a full load switches the locale's messages; keeps ?b= so the selection survives.
    <a href={`/${other}${qs ? `?${qs}` : ''}`} aria-label={t('switchLabel')} hrefLang={other} className={`grid h-11 min-w-11 place-items-center px-3 text-sm font-bold uppercase ${className}`}>
      {other}
    </a>
  );
}
