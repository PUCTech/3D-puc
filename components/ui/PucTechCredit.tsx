'use client';
import { useTranslations } from 'next-intl';

// "Built by PUC Tech" credit: the league's wordmark (white + cyan, made for dark backgrounds) on navy.
export function PucTechCredit({ className = '' }: { className?: string }) {
  const t = useTranslations('brand');
  return (
    <a
      href="https://www.puctech.com.br/"
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('byLabel')}
      className={`flex items-center justify-between gap-3 bg-[#020d2b] px-5 py-2.5 hover:bg-navy ${className}`}
    >
      <span className="font-display text-[12px] uppercase tracking-widest text-ice/80">{t('madeBy')}</span>
      {/* eslint-disable-next-line @next/next/no-img-element -- static export, small SVG */}
      <img src="/brand/puctech.svg" alt="PUC Tech" className="h-6 w-auto" />
    </a>
  );
}
