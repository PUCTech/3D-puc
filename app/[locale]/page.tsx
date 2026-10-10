import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';
import { MapApp } from '@/components/MapApp';

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale((await params).locale);
  return (
    <Suspense>
      <MapApp />
    </Suspense>
  );
}
