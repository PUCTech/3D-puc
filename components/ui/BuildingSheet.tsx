'use client';
import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { Building, Floor, Locale } from '@/lib/campus';

export function BuildingSheet({ building, onClose }: { building: Building; onClose: () => void }) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const [expanded, setExpanded] = useState(false);
  const dragStart = useRef<number | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  // Move focus here on open so keyboard and screen-reader users land on what they picked.
  useEffect(() => heading.current?.focus(), []);
  const aboveGround = building.floors.filter((f) => f.level >= 0).length;
  const floorName = (f: Floor) =>
    f.label?.[locale] ?? (f.level === 0 ? t('floor.ground') : f.level < 0 ? t('floor.basement', { n: -f.level }) : t('floor.level', { level: f.level }));

  const onPointerUp = (y: number) => {
    if (dragStart.current === null) return;
    const dy = y - dragStart.current;
    dragStart.current = null;
    if (dy < -30) setExpanded(true);
    else if (dy > 30 && expanded) setExpanded(false);
    else if (dy > 30) onClose();
  };

  return (
    <section
      data-testid="building-sheet"
      aria-labelledby="sheet-title"
      className="pointer-events-auto fixed inset-x-0 bottom-0 z-20 max-h-[75vh] overflow-y-auto rounded-t-2xl border-t border-accent bg-night px-5 pb-6 pt-2 lg:inset-y-4 lg:left-4 lg:right-auto lg:max-h-none lg:w-96 lg:rounded-2xl lg:border"
    >
      <button
        aria-label={expanded ? t('sheet.collapse') : t('sheet.expand')}
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
        onPointerDown={(e) => (dragStart.current = e.clientY)}
        onPointerUp={(e) => onPointerUp(e.clientY)}
        className="mx-auto mb-3 block h-6 w-full touch-none lg:hidden"
      >
        <span className="mx-auto block h-1 w-10 rounded-full bg-accent" />
      </button>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-md border border-accent px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ice">
              {t('sheet.floors', { count: aboveGround })}
            </span>
            {!!building.entrances?.length && (
              <span className="rounded-md border border-accent px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ice">
                {t('sheet.entrances', { count: building.entrances.length })}
              </span>
            )}
          </div>
          <h2 id="sheet-title" ref={heading} tabIndex={-1} className="mt-2 text-xl font-semibold focus:outline-none">{building.name[locale]}</h2>
        </div>
        <button onClick={onClose} aria-label={t('sheet.close')} className="rounded-lg px-2 py-1 text-ice/70 hover:text-ice">✕</button>
      </div>
      {building.description && (
        <p className={`mt-2 text-sm leading-relaxed text-paper/75 ${expanded ? '' : 'line-clamp-2 lg:line-clamp-none'}`}>
          {building.description[locale]}
        </p>
      )}
      <div className={expanded ? 'mt-4' : 'mt-4 hidden lg:block'}>
        <h3 className="font-mono text-[11px] uppercase tracking-widest text-ice/60">{t('sheet.floorList')}</h3>
        <ol className="mt-2 space-y-1">
          {[...building.floors].sort((a, b) => b.level - a.level).map((f) => (
            <li key={f.level} className="rounded-lg border border-deep px-3 py-2 text-sm">{floorName(f)}</li>
          ))}
        </ol>
      </div>
    </section>
  );
}
