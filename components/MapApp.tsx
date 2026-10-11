'use client';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import type { Locale } from '@/lib/campus';
import { findBuilding, onLowerLevel } from '@/lib/campus';
import { SearchBar } from './ui/SearchBar';
import { MobileSheet, type Snap } from './ui/MobileSheet';
import { BuildingList } from './ui/BuildingList';
import { LocaleSwitch } from './ui/LocaleSwitch';
import { SceneErrorBoundary } from './SceneErrorBoundary';
import { BuildingDetails } from './ui/BuildingDetails';
import { MapControls } from './ui/MapControls';
import { useIsDesktop } from './ui/useIsDesktop';
import { LevelToggle } from './ui/LevelToggle';
import { NightToggle } from './ui/NightToggle';
import { PucTechCredit } from './ui/PucTechCredit';
import { History } from './ui/History';
import { historyFor } from '@/lib/history';

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
// Desktop panel widths in CSS px (left-4 sidebar 23.5rem; + history 25rem), with a gutter.
const PANELS = 26 * 16;
const PANELS_WIDE = 52 * 16;
// Phone floating controls (language + level toggle) height in CSS px, notch padding aside.
const PHONE_TOP_BAR = 64;

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
  const [snap, setSnap] = useState<Snap>(() => (params.get('b') ? 'half' : 'peek')); // phone sheet position; a shared building link opens its details
  const [sheetHeight, setSheetHeight] = useState(0); // phone sheet visible height, reported by the sheet
  const isDesktop = useIsDesktop();
  // Desktop: a selection with history opens the history panel next to the sidebar; ✕ hides it until reopened.
  const [historyOpen, setHistoryOpen] = useState(true);
  const historyEntries = selected ? historyFor(selected.id, selectedFloor) : [];
  const showHistory = historyOpen && historyEntries.length > 0;
  // Picking another building or floor starts both panels from the top.
  const sidebarScroll = useRef<HTMLDivElement>(null);
  const historyScroll = useRef<HTMLDivElement>(null);
  useEffect(() => {
    sidebarScroll.current?.scrollTo({ top: 0 });
    historyScroll.current?.scrollTo({ top: 0 });
  }, [selected?.id, selectedFloor]);

  // Navigation keeps the lighting choice (?noite=1) across picks.
  const go = (query: string) => {
    const q = new URLSearchParams(query);
    if (params.get('noite') === '1') q.set('noite', '1');
    const s = q.toString();
    router.push(s ? `${pathname}?${s}` : pathname, { scroll: false });
  };
  const select = (id: string | null) => {
    setSnap(id ? 'half' : 'peek'); // a pick opens the building; closing goes back to the search peek
    go(id ? `b=${encodeURIComponent(id)}` : '');
  };
  // Lower-level view: ?nivel=inferior, or implied by picking a basement floor.
  // A selected street-level-only building wins over the lower view (it would be hidden there).
  const lower = (params.get('nivel') === 'inferior' && (!selected || onLowerLevel(selected))) || (selectedFloor !== null && selectedFloor < 0);
  const setLower = (on: boolean) => {
    const q = new URLSearchParams(params.toString());
    if (on) {
      q.set('nivel', 'inferior');
      if (selected && !onLowerLevel(selected)) q.delete('b'); // it would vanish; show the lower level instead
    }
    else {
      q.delete('nivel');
      if (Number(q.get('f')) < 0) q.delete('f'); // leaving the lower level also leaves a basement floor
    }
    const s = q.toString();
    router.push(s ? `${pathname}?${s}` : pathname, { scroll: false });
  };
  // Night lighting: ?noite=1, kept in the URL like the level so a shared link shows the same view.
  const night = params.get('noite') === '1';
  const setNight = (on: boolean) => {
    const q = new URLSearchParams(params.toString());
    if (on) q.set('noite', '1');
    else q.delete('noite');
    const s = q.toString();
    router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
  };
  const selectFloor = (level: number | null) => {
    if (!selected) return;
    const b = `b=${encodeURIComponent(selected.id)}`;
    go(level === null ? b : `${b}&f=${level}`);
  };

  // Escape closes the building first, then lowers the phone sheet.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (selected) router.push(params.get('noite') === '1' ? `${pathname}?noite=1` : pathname, { scroll: false });
      setSnap('peek');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, router, pathname, params]);

  const scene = webgl ? (
    <SceneErrorBoundary onError={() => setSceneFailed(true)}>
      <CampusScene selectedId={selected?.id ?? null} selectedFloor={selectedFloor} lower={lower} bottomInset={isDesktop ? 0 : sheetHeight} leftInset={isDesktop ? (showHistory ? PANELS_WIDE : PANELS) : 0} topInset={isDesktop ? 0 : PHONE_TOP_BAR} locale={locale} onSelect={select} onContextLost={() => setSceneFailed(true)} phone={!isDesktop} night={night} />
    </SceneErrorBoundary>
  ) : (
    <p role="status" className="grid h-full place-items-center p-6 text-center font-display text-lg text-navy">
      {t('noWebgl')}
    </p>
  );

  if (isDesktop)
    return (
      <main className="fixed inset-0 overflow-hidden bg-ground">
        {/* Map fills the window behind the panels; the camera frames the selection in the uncovered part (leftInset). */}
        <div className="absolute inset-0">{scene}</div>
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
          <div ref={sidebarScroll} className="flex-1 overflow-y-auto p-4">
            {selected ? (
              <section aria-labelledby="building-title" data-testid="building-sheet">
                <button onClick={() => select(null)} className="pixel-btn pixel-btn-paper mb-5 px-3 py-1 text-sm">
                  ◀ {t('list.back')}
                </button>
                <BuildingDetails
                  key={selected.id}
                  building={selected}
                  floor={selectedFloor}
                  onFloor={selectFloor}
                  onHistory={!showHistory && historyEntries.length ? () => setHistoryOpen(true) : undefined}
                />
              </section>
            ) : (
              <BuildingList onPick={select} />
            )}
          </div>
          <PucTechCredit className="border-t-3 border-ink" />
        </aside>
        {showHistory && (
          <aside aria-labelledby="history-title" className="pixel-box fixed bottom-4 left-[25.5rem] top-4 z-20 flex w-[25rem] flex-col overflow-hidden">
            <header className="flex items-center justify-between gap-3 border-b-3 border-ink bg-sun px-5 py-3">
              <h2 id="history-title" className="font-display text-sm uppercase tracking-widest text-ink">
                {t('history.title')} <span className="text-ink/55">· {selected?.name[locale]}</span>
              </h2>
              <button onClick={() => setHistoryOpen(false)} aria-label={t('history.close')} className="pixel-btn pixel-btn-paper grid h-8 w-8 place-items-center leading-none">
                ✕
              </button>
            </header>
            <div ref={historyScroll} className="flex-1 overflow-y-auto p-5">
              <History key={`${selected?.id}-${selectedFloor}`} entries={historyEntries} name={selected?.name[locale]} />
            </div>
          </aside>
        )}
        {webgl && <MapControls />}
        {webgl && (
          <div className="fixed right-5 top-5 z-20 flex gap-2">
            <NightToggle night={night} onChange={setNight} />
            <LevelToggle lower={lower} onChange={setLower} />
          </div>
        )}
      </main>
    );

  // Phone (mobile first): full-bleed map, two small floating toggles, and one bottom sheet that is always there.
  // Sheet header (the drag area): the search bar, or the picked building's name. Body: the list, or its details.
  const sheetHeader = selected ? (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="font-display text-[12px] uppercase tracking-widest text-puc">{t('sheet.floors', { count: selected.floors.filter((f) => f.level >= 0).length })}</p>
        <h2 id="building-title" className="truncate text-2xl font-extrabold leading-tight tracking-tight text-navy">
          {selected.name[locale]}
        </h2>
      </div>
      <button onClick={() => select(null)} aria-label={t('sheet.close')} className="pixel-btn pixel-btn-paper grid h-10 w-10 shrink-0 place-items-center text-lg leading-none">
        ✕
      </button>
    </div>
  ) : (
    <SearchBar onPick={select} inline onFocus={() => setSnap('full')} />
  );
  return (
    // In-flow (absolute, not fixed) and h-lvh: iOS Safari keeps fixed elements out of the strip under its floating
    // toolbar and paints the page background there; in-flow content runs under it, so the map fills the screen.
    <main className="absolute inset-x-0 top-0 h-lvh overflow-hidden bg-ground">
      {scene}
      {webgl && (
        <div className="fixed right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-10 flex gap-2">
          <NightToggle night={night} onChange={setNight} />
          <LevelToggle lower={lower} onChange={setLower} />
          <LocaleSwitch />
        </div>
      )}
      <MobileSheet
        label={selected ? selected.name[locale] : t('list.title')}
        snap={webgl ? snap : 'full'}
        onSnap={setSnap}
        onVisibleHeight={setSheetHeight}
        header={sheetHeader}
        resetScrollKey={`${selected?.id}-${selectedFloor}`}
      >
        {selected ? (
          <BuildingDetails key={selected.id} building={selected} floor={selectedFloor} onFloor={selectFloor} headless dense history={historyFor(selected.id, selectedFloor)} />
        ) : (
          <>
            <BuildingList onPick={select} />
            <PucTechCredit className="-mx-4 mt-6 border-y-3 border-ink" />
          </>
        )}
      </MobileSheet>
    </main>
  );
}
