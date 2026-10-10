'use client';
import { useTranslations } from 'next-intl';

export function MapApp() {
  return <main className="p-4 font-mono text-ice">{useTranslations()('loading')}</main>;
}
