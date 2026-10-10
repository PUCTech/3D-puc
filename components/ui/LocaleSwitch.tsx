'use client';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';

export function LocaleSwitch() {
  const t = useTranslations('locale');
  const other = useLocale() === 'pt' ? 'en' : 'pt';
  const qs = useSearchParams().toString();
  return (
    // Plain <a>: a full load switches the locale's messages; keeps ?b= so the selection survives.
    <a href={`/${other}${qs ? `?${qs}` : ''}`} aria-label={t('switchLabel')} hrefLang={other} className="rounded-xl border border-deep bg-night/85 px-3 py-2.5 font-mono text-xs uppercase tracking-wider text-ice backdrop-blur hover:border-ice">
      {other.toUpperCase()}
    </a>
  );
}
