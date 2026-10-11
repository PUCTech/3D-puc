'use client';
import { useEffect, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { Building, Floor, Locale } from '@/lib/campus';
import { ROOM_COLORS } from '@/components/scene/FloorPlan';
import type { HistoryEntry } from '@/lib/history';
import { History } from './History';

// compact: phone peek (tag + title). dense: phone floor view (floors as a chip row, so the plan stays visible).
// history: shown inline below the floors (phone sheet). onHistory: a button that opens it elsewhere (desktop side panel).
type Props = {
  building: Building;
  floor: number | null;
  onFloor: (level: number | null) => void;
  compact?: boolean;
  dense?: boolean;
  history?: HistoryEntry[];
  onHistory?: () => void;
};

// The building's content, shared by the phone bottom sheet and the desktop sidebar.
// Floor rows are buttons: picking one cuts the 3D building at that floor and lists its rooms.
export function BuildingDetails({ building, floor, onFloor, compact = false, dense = false, history, onHistory }: Props) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const heading = useRef<HTMLHeadingElement>(null);
  // Move focus here on open so keyboard and screen-reader users land on what they picked.
  useEffect(() => heading.current?.focus(), []);
  const aboveGround = building.floors.filter((f) => f.level >= 0).length;
  const floorName = (f: Floor) =>
    f.label?.[locale] ?? (f.level === 0 ? t('floor.ground') : f.level < 0 ? t('floor.basement', { n: -f.level }) : t('floor.level', { level: f.level }));
  const current = floor === null ? undefined : building.floors.find((f) => f.level === floor);
  // Room legend: one row per kind on this floor, with how many there are.
  const legend = current
    ? Object.entries(current.rooms.reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.kind ?? 'room']: (acc[r.kind ?? 'room'] ?? 0) + 1 }), {}))
    : [];

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <span className="pixel-chip bg-puc px-2 py-0.5 font-display text-[13px] uppercase tracking-wide text-white">{t('sheet.floors', { count: aboveGround })}</span>
        {!!building.entrances?.length && (
          <span className="pixel-chip bg-ice px-2 py-0.5 font-display text-[13px] uppercase tracking-wide text-navy">{t('sheet.entrances', { count: building.entrances.length })}</span>
        )}
      </div>
      <h2 id="building-title" ref={heading} tabIndex={-1} className="mt-3 text-3xl font-extrabold leading-none tracking-tight text-navy focus:outline-none">
        {building.name[locale]}
      </h2>
      {building.description && (
        <p className={`mt-3 text-sm leading-relaxed text-ink/75 ${compact ? 'line-clamp-2' : ''}`}>{building.description[locale]}</p>
      )}
      {onHistory && (
        <button onClick={onHistory} className="pixel-btn mt-4 px-3 py-1.5 text-sm">
          {t('history.open')} ▶
        </button>
      )}
      {!compact && (
        <section className="mt-5">
          <div className="flex items-baseline justify-between">
            <h3 className="font-display text-[13px] uppercase tracking-widest text-ink/55">{t('sheet.floorList')}</h3>
            {current && (
              <button onClick={() => onFloor(null)} className="font-display text-[13px] text-puc underline underline-offset-2 hover:text-navy">
                {t('sheet.wholeBuilding')}
              </button>
            )}
          </div>
          {dense ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {[...building.floors]
                .sort((a, b) => a.level - b.level)
                .map((f) => (
                  <button
                    key={f.level}
                    onClick={() => onFloor(f.level === floor ? null : f.level)}
                    aria-pressed={f.level === floor}
                    aria-label={t('sheet.showFloor', { floor: floorName(f) })}
                    className={`pixel-chip px-2.5 py-1 font-display text-[13px] ${f.level === floor ? 'bg-sun text-ink' : 'bg-paper text-navy'}`}
                  >
                    {floorName(f)}
                  </button>
                ))}
            </div>
          ) : (
          <ol className="mt-2 space-y-2">
            {[...building.floors]
              .sort((a, b) => b.level - a.level)
              .map((f) => {
                const active = f.level === floor;
                return (
                  <li key={f.level}>
                    <button
                      onClick={() => onFloor(active ? null : f.level)}
                      aria-pressed={active}
                      aria-label={t('sheet.showFloor', { floor: floorName(f) })}
                      className={`pixel-row flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-ice focus:outline-none focus-visible:bg-ice ${active ? 'bg-sun font-semibold' : ''}`}
                    >
                      <span>{floorName(f)}</span>
                      <span className="font-display text-[13px] text-ink/45">{f.rooms.length ? `${f.rooms.length} ▸` : f.level}</span>
                    </button>
                  </li>
                );
              })}
          </ol>
          )}
          {current && current.rooms.length > 0 && (
            <div className="mt-5">
              <h3 className="font-display text-[13px] uppercase tracking-widest text-ink/55">
                {t('sheet.rooms')} · {floorName(current)}
              </h3>
              <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
                {legend.map(([kind, n]) => (
                  <li key={kind} className="flex items-center gap-2 text-sm">
                    <span aria-hidden className="h-3.5 w-3.5 shrink-0 border-2 border-ink" style={{ background: ROOM_COLORS[kind] ?? ROOM_COLORS.room }} />
                    <span className="truncate">{t(`room.${kind}` as 'room.room')}</span>
                    {n > 1 && <span className="font-display text-[12px] text-ink/45">×{n}</span>}
                  </li>
                ))}
              </ul>
              {!dense && <p className="mt-3 text-xs leading-snug text-ink/55">{current.estimated ? t('sheet.estimatedNote') : t('sheet.planNote')}</p>}
            </div>
          )}
        </section>
      )}
      {!compact && !!history?.length && (
        <section className="mt-6 border-t-3 border-ink pt-4">
          <h3 className="mb-3 font-display text-[13px] uppercase tracking-widest text-ink/55">{t('history.title')}</h3>
          <History entries={history} name={building.name[locale]} />
        </section>
      )}
    </div>
  );
}
