'use client';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';

export function LocaleSwitch() {
  const t = useTranslations('locale');
  const other = useLocale() === 'pt' ? 'en' : 'pt';
  const qs = useSearchParams().toString();
  return (
    // Plain <a>: a full load switches the locale's messages; keeps ?b= so the selection survives.
    <a href={`/${other}${qs ? `?${qs}` : ''}`} aria-label={t('switchLabel')} hrefLang={other} className="pixel-btn pixel-btn-paper grid h-11 place-items-center px-3 text-base uppercase">
      {other}
    </a>
  );
}
