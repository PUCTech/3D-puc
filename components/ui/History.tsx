'use client';
import { useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { Locale } from '@/lib/campus';
import { history, type HistoryEntry, type HistoryPhoto } from '@/lib/history';
import { Icon } from './Icon';

function YearChip({ year }: { year: number }) {
  return <span className="rounded-md bg-amarela px-1.5 py-0.5 text-xs font-bold tabular-nums text-navy">{year}</span>;
}

// A cropped photo tile; clicking opens the full scan.
// hero: big lead photo. wide: a grid tile spanning both columns (odd one out).
function Photo({ photo, hero, wide, onOpen }: { photo: HistoryPhoto; hero?: boolean; wide?: boolean; onOpen: () => void }) {
  const locale = useLocale() as Locale;
  return (
    <figure className={`overflow-hidden rounded-xl bg-platform ${wide ? 'col-span-2' : ''}`}>
      <button onClick={onOpen} className="group relative block w-full" aria-label={photo.caption[locale]}>
        {/* eslint-disable-next-line @next/next/no-img-element -- static export, pre-sized scans */}
        <img
          src={photo.src}
          alt=""
          loading="lazy"
          className={`block w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] ${hero ? 'aspect-[4/3]' : wide ? 'aspect-[16/9]' : 'aspect-square'}`}
        />
        <span className="absolute left-2 top-2">
          <YearChip year={photo.year} />
        </span>
      </button>
      <figcaption className={`px-3 py-2 leading-snug text-muted ${hero || wide ? 'text-[13px]' : 'line-clamp-2 text-xs'}`}>{photo.caption[locale]}</figcaption>
    </figure>
  );
}

// One "wiki" entry: hero photo, title, text, trivia box, then the remaining photos as a grid.
function Entry({ entry, label, onOpen }: { entry: HistoryEntry; label: string; onOpen: (p: HistoryPhoto) => void }) {
  const locale = useLocale() as Locale;
  const t = useTranslations('history');
  const [hero, ...rest] = entry.photos;
  return (
    <article className="space-y-4">
      {hero && <Photo photo={hero} hero onOpen={() => onOpen(hero)} />}
      {/* nbsp keeps a title's " · " separator on the first line instead of dangling */}
      <header>
        <h3 className="text-[22px] font-black leading-tight tracking-tight text-balance text-navy">{entry.title[locale].replaceAll(' · ', '\u00a0· ')}</h3>
        <p className="mt-1 text-sm font-semibold text-muted">{label}</p>
      </header>
      <p className="max-w-[65ch] text-[15px] leading-relaxed text-ink">{entry.text[locale]}</p>
      {!!entry.facts?.length && (
        <section className="rounded-xl bg-platform p-4">
          <h4 className="text-sm font-black text-navy">{t('facts')}</h4>
          <ul className="mt-2 space-y-2">
            {entry.facts.map((f) => (
              <li key={f.pt} className="flex gap-2.5 text-sm leading-snug text-ink">
                <span aria-hidden className="mt-[5px] h-2.5 w-2.5 shrink-0 rounded-full border-[2.5px] border-navy" />
                <span>{f[locale]}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {rest.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {rest.map((p, i) => (
            <Photo key={p.src} photo={p} wide={rest.length % 2 === 1 && i === rest.length - 1} onOpen={() => onOpen(p)} />
          ))}
        </div>
      )}
    </article>
  );
}

// name: the building's name, used as the label of its entry (floor entries are labelled "this floor"; none = the site).
export function History({ entries, name }: { entries: HistoryEntry[]; name?: string }) {
  const t = useTranslations('history');
  const locale = useLocale() as Locale;
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState<HistoryPhoto | null>(null);
  const show = (p: HistoryPhoto) => {
    setOpen(p);
    dialog.current?.showModal();
  };
  return (
    <div>
      {entries.map((e, i) => (
        <div key={e.title.pt} className={i > 0 ? 'mt-8 border-t border-rule pt-6' : ''}>
          <Entry entry={e} label={'levels' in e ? t('thisFloor') : (name ?? t('siteLabel'))} onOpen={show} />
        </div>
      ))}
      <footer className="mt-8 border-t border-rule pt-4">
        <h4 className="text-sm font-black text-navy">{t('sources')}</h4>
        <ul className="mt-2 space-y-1.5">
          {history.sources.map((s) => (
            <li key={s.url} className="text-[13px] leading-snug">
              <a href={s.url} target="_blank" rel="noopener" className="text-navy underline decoration-navy/35 underline-offset-[3px] hover:decoration-navy">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </footer>
      {/* Full-size viewer. Esc is kept here so it doesn't also close the building (MapApp listens on window). */}
      <dialog
        ref={dialog}
        onClose={() => setOpen(null)}
        onKeyDown={(e) => e.key === 'Escape' && e.stopPropagation()}
        onClick={(e) => e.target === dialog.current && dialog.current.close()}
        className="m-auto max-h-[92dvh] w-[min(56rem,94vw)] overflow-hidden rounded-2xl bg-white p-0 shadow-2xl backdrop:bg-navy-deep/75"
      >
        {open && (
          <figure className="flex max-h-[92dvh] flex-col">
            {/* eslint-disable-next-line @next/next/no-img-element -- static export, pre-sized scans */}
            <img src={open.src} alt={open.caption[locale]} className="min-h-0 w-full flex-1 bg-navy-deep object-contain" />
            <figcaption className="flex items-start gap-3 px-4 py-3 text-sm text-ink">
              <YearChip year={open.year} />
              <span className="flex-1 leading-snug">
                {open.caption[locale]}
                <span className="mt-0.5 block text-xs text-muted">{open.credit}</span>
              </span>
              <button onClick={() => dialog.current?.close()} aria-label={t('closePhoto')} className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-navy hover:bg-platform">
                <Icon name="close" />
              </button>
            </figcaption>
          </figure>
        )}
      </dialog>
    </div>
  );
}
