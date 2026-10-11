'use client';
import { useEffect, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { Building, Floor, Locale } from '@/lib/campus';

// The building's content, shared by the phone bottom sheet and the desktop sidebar.
export function BuildingDetails({ building, compact = false }: { building: Building; compact?: boolean }) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const heading = useRef<HTMLHeadingElement>(null);
  // Move focus here on open so keyboard and screen-reader users land on what they picked.
  useEffect(() => heading.current?.focus(), []);
  const aboveGround = building.floors.filter((f) => f.level >= 0).length;
  const floorName = (f: Floor) =>
    f.label?.[locale] ?? (f.level === 0 ? t('floor.ground') : f.level < 0 ? t('floor.basement', { n: -f.level }) : t('floor.level', { level: f.level }));

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <span className="pixel-chip bg-puc px-2 py-0.5 text-[13px] uppercase tracking-wide text-white">{t('sheet.floors', { count: aboveGround })}</span>
        {!!building.entrances?.length && (
          <span className="pixel-chip bg-ice px-2 py-0.5 text-[13px] uppercase tracking-wide text-navy">{t('sheet.entrances', { count: building.entrances.length })}</span>
        )}
      </div>
      <h2 id="building-title" ref={heading} tabIndex={-1} className="mt-3 font-pixel text-3xl font-bold leading-none text-navy focus:outline-none">
        {building.name[locale]}
      </h2>
      {building.description && (
        <p className={`mt-3 text-sm leading-relaxed text-ink/75 ${compact ? 'line-clamp-2' : ''}`}>{building.description[locale]}</p>
      )}
      {!compact && (
        <section className="mt-5">
          <h3 className="font-pixel text-sm uppercase tracking-widest text-ink/55">{t('sheet.floorList')}</h3>
          <ol className="mt-2 space-y-2">
            {[...building.floors]
              .sort((a, b) => b.level - a.level)
              .map((f, i) => (
                <li key={f.level} className={`pixel-row flex items-center justify-between px-3 py-2 text-sm ${i === 0 ? 'bg-ice' : ''}`}>
                  <span>{floorName(f)}</span>
                  <span className="font-pixel text-[13px] text-ink/45">{f.level >= 0 ? `${f.level}` : `S${-f.level}`}</span>
                </li>
              ))}
          </ol>
        </section>
      )}
    </div>
  );
}
