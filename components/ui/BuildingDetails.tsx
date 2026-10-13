'use client';
import { useEffect, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { roomKind, type Building, type Era, type Floor, type Locale } from '@/lib/campus';
import { roomColor } from '@/components/scene/FloorPlan';
import type { HistoryEntry } from '@/lib/history';
import { lineFor, lineVars } from '@/lib/lines';
import { History } from './History';
import { Icon } from './Icon';
import { LineBullet } from './LineBullet';

// headless: the bullet and title live elsewhere (the phone sheet's draggable header). dense: phone sheet (no plan note).
// history: shown inline below the floors (phone sheet). onHistory: a button that opens it elsewhere (desktop side panel).
type Props = {
  building: Building;
  floor: number | null;
  onFloor: (level: number | null) => void;
  headless?: boolean;
  dense?: boolean;
  history?: HistoryEntry[];
  onHistory?: () => void;
  era: Era; // room uses, legend colors and the note follow the map's era
};

const STOP = 52; // px per station row; the train dot moves in these steps

// The building's content, shared by the phone bottom sheet and the desktop sidebar.
// Floors are stations on the building's line: picking one cuts the 3D building at that floor and lists its rooms.
export function BuildingDetails({ building, floor, onFloor, headless = false, dense = false, history, onHistory, era }: Props) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const heading = useRef<HTMLHeadingElement>(null);
  // Move focus here on open so keyboard and screen-reader users land on what they picked.
  useEffect(() => heading.current?.focus(), []);
  const line = lineFor(building.id, building.name[locale]);
  const aboveGround = building.floors.filter((f) => f.level >= 0).length;
  const floorName = (f: Floor) =>
    f.label?.[locale] ?? (f.level === 0 ? t('floor.ground') : f.level < 0 ? t('floor.basement', { n: -f.level }) : t('floor.level', { level: f.level }));
  const stations = [...building.floors].sort((a, b) => b.level - a.level); // top floor first, like the building
  const at = stations.findIndex((f) => f.level === floor);
  const current = at < 0 ? undefined : stations[at];
  // Room legend: one row per kind on this floor, with how many there are.
  const legend = current
    ? Object.entries(current.rooms.reduce<Record<string, number>>((acc, r) => ({ ...acc, [roomKind(r, era)]: (acc[roomKind(r, era)] ?? 0) + 1 }), {}))
    : [];

  return (
    <div style={lineVars(line)}>
      {!headless && (
        <header className="flex items-center gap-4 rounded-md bg-navy px-4 py-4 text-white">
          <LineBullet id={building.id} name={building.name[locale]} className="h-14 w-14 text-2xl" />
          <div className="min-w-0">
            <h2 id="building-title" ref={heading} tabIndex={-1} className="text-[32px] font-black leading-none tracking-tight focus:outline-none">
              {building.name[locale]}
            </h2>
            <p className="mt-1.5 text-sm font-medium text-white/80">
              {t('sheet.floors', { count: aboveGround })}
              {!!building.entrances?.length && <> · {t('sheet.entrances', { count: building.entrances.length })}</>}
            </p>
          </div>
        </header>
      )}
      {building.description && <p className="mt-4 text-[15px] leading-relaxed text-ink">{building.description[locale]}</p>}
      {onHistory && (
        <button onClick={onHistory} className="mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-amarela pl-3 pr-4 text-sm font-bold text-navy hover:brightness-95">
          <Icon name="clock" size={18} />
          {t('history.open')}
        </button>
      )}
      <section className={headless ? 'mt-1' : 'mt-6'}>
        <div className="flex items-baseline justify-between">
          <h3 className="text-base font-black text-navy">{t('sheet.floorList')}</h3>
          {current && (
            <button onClick={() => onFloor(null)} className="text-sm font-bold text-navy underline decoration-2 underline-offset-4 hover:decoration-[var(--line)]">
              {t('sheet.wholeBuilding')}
            </button>
          )}
        </div>
        {/* The line: a colored bar with one station per floor; the train dot slides to the picked one. */}
        <ol className="relative mt-2">
          <span aria-hidden className="absolute bottom-[26px] left-4 top-[26px] w-2 rounded-full bg-[var(--line)] ring-1 ring-navy/15" />
          {current && (
            <span
              aria-hidden
              className="absolute left-[8px] top-[14px] h-6 w-6 rounded-full border-4 border-white bg-[var(--line)] shadow-[0_1px_2px_rgb(12_36_69/0.4)] ring-1 ring-navy/20 motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-[cubic-bezier(.16,1,.3,1)]"
              style={{ transform: `translateY(${at * STOP}px)` }}
            />
          )}
          {stations.map((f) => {
            const active = f.level === floor;
            return (
              <li key={f.level} style={{ height: STOP }}>
                <button
                  onClick={() => onFloor(active ? null : f.level)}
                  aria-pressed={active}
                  aria-label={t('sheet.showFloor', { floor: floorName(f) })}
                  className={`group flex h-full w-full items-center gap-3 rounded-md pr-3 text-left focus-visible:-outline-offset-2 ${active ? 'bg-platform' : 'hover:bg-platform'}`}
                >
                  <span className="grid w-10 shrink-0 place-items-center">
                    <span className={`relative h-4 w-4 rounded-full border-[3.5px] border-[var(--line)] bg-white ${active ? 'opacity-0' : ''}`} />
                  </span>
                  <span className={`flex-1 text-[17px] ${active ? 'font-black text-[var(--line-text)]' : 'font-semibold text-ink'}`}>{floorName(f)}</span>
                  {f.rooms.length > 0 && <span className="text-sm tabular-nums text-muted">{t('sheet.roomCount', { count: f.rooms.length })}</span>}
                  <Icon name="next" size={18} className={`text-navy/50 ${active ? 'rotate-90' : ''} motion-safe:transition-transform`} />
                </button>
              </li>
            );
          })}
        </ol>
        {current && current.rooms.length > 0 && (
          <div className="mt-5 rounded-xl bg-platform p-4">
            <h3 className="text-base font-black text-navy">
              {t('sheet.rooms')} · {floorName(current)}
            </h3>
            <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
              {legend.map(([kind, n]) => (
                <li key={kind} className="flex items-center gap-2 text-sm text-ink">
                  <span aria-hidden className="h-4 w-4 shrink-0 rounded-[4px] ring-1 ring-navy/25" style={{ background: roomColor(kind, era) }} />
                  <span className="truncate">{t(`room.${kind}` as 'room.room')}</span>
                  {n > 1 && <span className="text-xs font-bold tabular-nums text-muted">×{n}</span>}
                </li>
              ))}
            </ul>
            {!dense && <p className="mt-3 text-xs leading-snug text-muted">{current.estimated ? t('sheet.estimatedNote') : era === '1943' ? t('sheet.planNote') : t('sheet.todayNote')}</p>}
          </div>
        )}
      </section>
      {!!history?.length && (
        <section className="mt-8 border-t border-rule pt-5">
          <h3 className="mb-4 flex items-center gap-2 text-base font-black text-navy">
            <span aria-hidden className="grid h-7 w-7 place-items-center rounded-full bg-amarela">
              <Icon name="clock" size={16} />
            </span>
            {t('history.title')}
          </h3>
          <History entries={history} name={building.name[locale]} />
        </section>
      )}
    </div>
  );
}
