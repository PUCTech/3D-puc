'use client';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import type { Era, Locale } from '@/lib/campus';
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
import { EraToggle } from './ui/EraToggle';
import { PucTechCredit } from './ui/PucTechCredit';
import { History } from './ui/History';
import { historyFor } from '@/lib/history';
import { Icon } from './ui/Icon';
import { LineBullet } from './ui/LineBullet';

function Loading() {
  const t = useTranslations();
  return (
    <div data-testid="scene-loading" className="grid h-full place-items-center">
      <span className="flex items-center gap-3 rounded-full bg-white px-5 py-3 text-lg font-bold text-navy">
        <span aria-hidden className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="station-dot h-2.5 w-2.5 rounded-full bg-navy" style={{ animationDelay: `${i * 0.2}s` }} />
          ))}
        </span>
        {t('loading')}
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
// Phone floating controls (two rows: lighting, level, language; then era) height in CSS px, notch padding aside.
const PHONE_TOP_BAR = 116;
// URL params that describe the view rather than the selection: kept across picks so a shared link looks the same.
const VIEW_PARAMS = ['noite', 'epoca'];

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

  // Navigation keeps the view choices (lighting ?noite=1, era ?epoca=1943) across picks.
  const go = (query: string) => {
    const q = new URLSearchParams(query);
    for (const k of VIEW_PARAMS) if (params.get(k)) q.set(k, params.get(k)!);
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
  // Era: ?epoca=1943 shows the 1943 institute; today is the default.
  const era: Era = params.get('epoca') === '1943' ? '1943' : 'hoje';
  const setEra = (e: Era) => {
    const q = new URLSearchParams(params.toString());
    if (e === '1943') q.set('epoca', '1943');
    else q.delete('epoca');
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
      if (selected) {
        const q = new URLSearchParams();
        for (const k of VIEW_PARAMS) if (params.get(k)) q.set(k, params.get(k)!);
        const s = q.toString();
        router.push(s ? `${pathname}?${s}` : pathname, { scroll: false });
      }
      setSnap('peek');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, router, pathname, params]);

  const scene = webgl ? (
    <SceneErrorBoundary onError={() => setSceneFailed(true)}>
      <CampusScene selectedId={selected?.id ?? null} selectedFloor={selectedFloor} lower={lower} bottomInset={isDesktop ? 0 : sheetHeight} leftInset={isDesktop ? (showHistory ? PANELS_WIDE : PANELS) : 0} topInset={isDesktop ? 0 : PHONE_TOP_BAR} locale={locale} onSelect={select} onContextLost={() => setSceneFailed(true)} night={night} era={era} />
    </SceneErrorBoundary>
  ) : (
    <p role="status" className="grid h-full place-items-center p-6 text-center text-lg font-bold text-navy">
      {t('noWebgl')}
    </p>
  );

  if (isDesktop)
    return (
      <main className="fixed inset-0 overflow-hidden bg-ground">
        {/* Map fills the window behind the panels; the camera frames the selection in the uncovered part (leftInset). */}
        <div className="absolute inset-0">{scene}</div>
        <aside className="plate fixed bottom-4 left-4 top-4 z-20 flex w-[23.5rem] flex-col overflow-hidden rounded-xl">
          <header className="flex items-center justify-between gap-3 bg-navy px-5 py-4 text-white">
            <div>
              <h1 className="text-[28px] font-black leading-none tracking-tight">{t('brand.title')}</h1>
              <p className="mt-1.5 text-sm font-medium text-white/80">{t('brand.place')}</p>
            </div>
            <LocaleSwitch className="rounded-[10px] bg-white/12 text-white hover:bg-white/22 focus-visible:outline-white" />
          </header>
          <div className="border-b border-rule bg-platform p-4">
            <SearchBar onPick={select} />
          </div>
          <div ref={sidebarScroll} className="flex-1 overflow-y-auto p-4">
            {selected ? (
              <section aria-labelledby="building-title" data-testid="building-sheet">
                <button onClick={() => select(null)} className="-ml-2 mb-4 inline-flex h-9 items-center gap-1 rounded-lg pl-1 pr-3 text-sm font-bold text-navy hover:bg-platform">
                  <Icon name="back" size={18} />
                  {t('list.back')}
                </button>
                <BuildingDetails
                  key={selected.id}
                  building={selected}
                  floor={selectedFloor}
                  onFloor={selectFloor}
                  onHistory={!showHistory && historyEntries.length ? () => setHistoryOpen(true) : undefined}
                  era={era}
                />
              </section>
            ) : (
              <BuildingList onPick={select} />
            )}
          </div>
          <PucTechCredit />
        </aside>
        {showHistory && (
          <aside aria-labelledby="history-title" className="plate fixed bottom-4 left-[25.5rem] top-4 z-20 flex w-[25rem] flex-col overflow-hidden rounded-xl">
            <header className="flex items-center justify-between gap-3 border-b border-rule px-5 py-3.5">
              <h2 id="history-title" className="flex items-center gap-2.5 text-lg font-black text-navy">
                <span aria-hidden className="grid h-8 w-8 place-items-center rounded-full bg-amarela">
                  <Icon name="clock" size={18} />
                </span>
                {t('history.title')} <span className="font-semibold text-muted">· {selected?.name[locale]}</span>
              </h2>
              <button onClick={() => setHistoryOpen(false)} aria-label={t('history.close')} className="grid h-10 w-10 place-items-center rounded-full text-navy hover:bg-platform">
                <Icon name="close" />
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
            <EraToggle era={era} onChange={setEra} />
            <NightToggle night={night} onChange={setNight} />
            <LevelToggle lower={lower} onChange={setLower} />
          </div>
        )}
      </main>
    );

  // Phone (mobile first): full-bleed map, two small floating toggles, and one bottom sheet that is always there.
  // Sheet header (the drag area): the search bar, or the picked building's name. Body: the list, or its details.
  const sheetHeader = selected ? (
    <div className="flex items-center gap-3">
      <LineBullet id={selected.id} name={selected.name[locale]} className="h-11 w-11 text-xl" />
      <div className="min-w-0 flex-1">
        <h2 id="building-title" className="truncate text-[26px] font-black leading-none tracking-tight">
          {selected.name[locale]}
        </h2>
        <p className="mt-1 text-sm font-medium text-white/80">
          {t('sheet.floors', { count: selected.floors.filter((f) => f.level >= 0).length })}
          {!!selected.entrances?.length && <> · {t('sheet.entrances', { count: selected.entrances.length })}</>}
        </p>
      </div>
      <button onClick={() => select(null)} aria-label={t('sheet.close')} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/12 text-white hover:bg-white/22 focus-visible:outline-white">
        <Icon name="close" />
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
        <div className="fixed right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-10 flex flex-col items-end gap-2">
          <div className="flex gap-2">
            <NightToggle night={night} onChange={setNight} />
            <LevelToggle lower={lower} onChange={setLower} />
            <LocaleSwitch />
          </div>
          <EraToggle era={era} onChange={setEra} />
        </div>
      )}
      <MobileSheet
        label={selected ? selected.name[locale] : t('list.title')}
        snap={webgl ? snap : 'full'}
        onSnap={setSnap}
        onVisibleHeight={setSheetHeight}
        header={sheetHeader}
        resetScrollKey={`${selected?.id}-${selectedFloor}`}
        band={!!selected}
      >
        {selected ? (
          <BuildingDetails key={selected.id} building={selected} floor={selectedFloor} onFloor={selectFloor} headless dense history={historyFor(selected.id, selectedFloor)} era={era} />
        ) : (
          <>
            <BuildingList onPick={select} />
            <PucTechCredit className="-mx-4 mt-6" />
          </>
        )}
      </MobileSheet>
    </main>
  );
}
