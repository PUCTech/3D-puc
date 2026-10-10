'use client';
import dynamic from 'next/dynamic';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import type { Locale } from '@/lib/campus';
import { findBuilding } from '@/lib/campus';
import { SearchBar } from './ui/SearchBar';
import { BuildingSheet } from './ui/BuildingSheet';
import { BuildingList } from './ui/BuildingList';
import { LocaleSwitch } from './ui/LocaleSwitch';
import { SceneErrorBoundary } from './SceneErrorBoundary';

function Loading() {
  const t = useTranslations();
  return <div data-testid="scene-loading" className="grid h-full place-items-center font-mono text-xs uppercase tracking-widest text-ice/60">{t('loading')}</div>;
}
const CampusScene = dynamic(() => import('./scene/CampusScene'), { ssr: false, loading: Loading });

let webglSupport: boolean | undefined;
const hasWebGL = () => {
  if (webglSupport !== undefined) return webglSupport;
  try {
    const c = document.createElement('canvas');
    webglSupport = !!(c.getContext('webgl2') ?? c.getContext('webgl'));
  } catch {
    webglSupport = false;
  }
  return webglSupport;
};
const noSubscribe = () => () => {};

export function MapApp() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const selected = findBuilding(params.get('b')) ?? null; // unknown ids fall back to the overview
  // Server render assumes WebGL; the client reads the real value after hydration.
  const webglSupported = useSyncExternalStore(noSubscribe, hasWebGL, () => true);
  const [sceneFailed, setSceneFailed] = useState(false);
  const webgl = webglSupported && !sceneFailed;
  const locale = useLocale() as Locale;
  const [listOpen, setListOpen] = useState(false);

  const select = (id: string | null) => {
    setListOpen(false);
    router.push(id ? `${pathname}?b=${encodeURIComponent(id)}` : pathname, { scroll: false });
  };

  // Escape closes the topmost panel: the list first, then the sheet.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (listOpen && webgl) setListOpen(false);
      else if (selected) router.push(pathname, { scroll: false });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [listOpen, webgl, selected, router, pathname]);

  return (
    <main className="fixed inset-0 overflow-hidden">
      {webgl ? (
        <SceneErrorBoundary onError={() => setSceneFailed(true)}>
          <CampusScene selectedId={selected?.id ?? null} locale={locale} onSelect={select} />
        </SceneErrorBoundary>
      ) : (
        <p role="status" className="p-4 pt-20 text-sm text-ice/70">{t('noWebgl')}</p>
      )}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-20 flex gap-2 p-3 lg:left-auto lg:w-[28rem]">
        <div className="pointer-events-auto flex-1"><SearchBar onPick={select} /></div>
        <button
          onClick={() => setListOpen((v) => !v)}
          aria-expanded={listOpen || !webgl}
          className="pointer-events-auto rounded-xl border border-deep bg-night/85 px-3 font-mono text-xs uppercase tracking-wider text-ice backdrop-blur hover:border-ice"
        >
          {t('list.open')}
        </button>
        <div className="pointer-events-auto flex"><LocaleSwitch /></div>
      </div>
      {(listOpen || !webgl) && <BuildingList onPick={select} onClose={() => setListOpen(false)} closable={webgl} />}
      {selected && <BuildingSheet key={selected.id} building={selected} onClose={() => select(null)} />}
    </main>
  );
}
