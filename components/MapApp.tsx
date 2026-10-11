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
import { BuildingDetails } from './ui/BuildingDetails';
import { MapControls } from './ui/MapControls';
import { useIsDesktop } from './ui/useIsDesktop';
import { LevelToggle } from './ui/LevelToggle';

function Loading() {
  const t = useTranslations();
  return (
    <div data-testid="scene-loading" className="grid h-full place-items-center font-display text-xl text-navy">
      <span>
        {t('loading')} <span className="pixel-blink">█</span>
      </span>
    </div>
  );
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
  // ?f=<level> shows that floor's plan; ignored unless the selected building has that floor
  const floorParam = params.get('f');
  const selectedFloor = selected && floorParam !== null && selected.floors.some((f) => String(f.level) === floorParam) ? Number(floorParam) : null;
  // Server render assumes WebGL; the client reads the real value after hydration.
  const webglSupported = useSyncExternalStore(noSubscribe, hasWebGL, () => true);
  const [sceneFailed, setSceneFailed] = useState(false);
  const webgl = webglSupported && !sceneFailed;
  const locale = useLocale() as Locale;
  const [listOpen, setListOpen] = useState(false);
  const isDesktop = useIsDesktop();

  const select = (id: string | null) => {
    setListOpen(false);
    router.push(id ? `${pathname}?b=${encodeURIComponent(id)}` : pathname, { scroll: false });
  };
  // Lower-level view: ?nivel=inferior, or implied by picking a basement floor.
  const lower = params.get('nivel') === 'inferior' || (selectedFloor !== null && selectedFloor < 0);
  const setLower = (on: boolean) => {
    const q = new URLSearchParams(params.toString());
    if (on) q.set('nivel', 'inferior');
    else {
      q.delete('nivel');
      if (Number(q.get('f')) < 0) q.delete('f'); // leaving the lower level also leaves a basement floor
    }
    const s = q.toString();
    router.push(s ? `${pathname}?${s}` : pathname, { scroll: false });
  };
  const selectFloor = (level: number | null) => {
    if (!selected) return;
    const b = `?b=${encodeURIComponent(selected.id)}`;
    router.push(level === null ? `${pathname}${b}` : `${pathname}${b}&f=${level}`, { scroll: false });
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

  const scene = webgl ? (
    <SceneErrorBoundary onError={() => setSceneFailed(true)}>
      <CampusScene selectedId={selected?.id ?? null} selectedFloor={selectedFloor} lower={lower} bottomInset={isDesktop || !selected ? 0 : selectedFloor !== null ? 0.42 : 0.2} locale={locale} onSelect={select} />
    </SceneErrorBoundary>
  ) : (
    <p role="status" className="grid h-full place-items-center p-6 text-center font-display text-lg text-navy">
      {t('noWebgl')}
    </p>
  );

  if (isDesktop)
    return (
      <main className="fixed inset-0 overflow-hidden bg-ground">
        {/* Map gets its own area right of the sidebar, so a selected building is never hidden behind a panel. */}
        <div className="absolute inset-y-0 left-[25.5rem] right-0">{scene}</div>
        <aside className="pixel-box fixed bottom-4 left-4 top-4 z-20 flex w-[23.5rem] flex-col overflow-hidden">
          <header className="flex items-start justify-between gap-3 border-b-3 border-ink bg-navy px-5 py-4 text-white">
            <div>
              <p className="font-display text-[13px] uppercase tracking-widest text-ice">{t('brand.place')}</p>
              <h1 className="mt-1 text-3xl font-extrabold leading-none tracking-tight">{t('brand.title')}</h1>
            </div>
            <LocaleSwitch />
          </header>
          <div className="border-b-3 border-ink bg-paper p-4">
            <SearchBar onPick={select} />
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {selected ? (
              <section aria-labelledby="building-title" data-testid="building-sheet">
                <button onClick={() => select(null)} className="pixel-btn pixel-btn-paper mb-5 px-3 py-1 text-sm">
                  ◀ {t('list.back')}
                </button>
                <BuildingDetails key={selected.id} building={selected} floor={selectedFloor} onFloor={selectFloor} />
              </section>
            ) : (
              <BuildingList onPick={select} inline />
            )}
          </div>
          <footer className="border-t-3 border-ink bg-ice/40 px-5 py-2 font-display text-[13px] text-navy/70">{t('brand.by')}</footer>
        </aside>
        {webgl && <MapControls />}
        {webgl && <LevelToggle lower={lower} onChange={setLower} className="fixed right-5 top-5 z-20" />}
      </main>
    );

  return (
    <main className="fixed inset-0 overflow-hidden bg-ground">
      {scene}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-20 flex gap-2 p-3">
        <div className="pointer-events-auto flex-1">
          <SearchBar onPick={select} />
        </div>
        <button
          onClick={() => setListOpen((v) => !v)}
          aria-expanded={listOpen || !webgl}
          className="pixel-btn pointer-events-auto h-11 px-3 text-base uppercase"
        >
          {t('list.open')}
        </button>
        <div className="pointer-events-auto">
          <LocaleSwitch />
        </div>
      </div>
      {webgl && !listOpen && <LevelToggle lower={lower} onChange={setLower} className="fixed left-3 top-[4.25rem] z-10" />}
      {(listOpen || !webgl) && <BuildingList onPick={select} onClose={webgl ? () => setListOpen(false) : undefined} />}
      {selected && <BuildingSheet key={selected.id} building={selected} floor={selectedFloor} onFloor={selectFloor} onClose={() => select(null)} />}
    </main>
  );
}
