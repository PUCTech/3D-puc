'use client';
import { useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { Locale } from '@/lib/campus';
import { history, type HistoryEntry, type HistoryPhoto } from '@/lib/history';

function YearChip({ year }: { year: number }) {
  return <span className="pixel-chip bg-sun px-1.5 font-display text-[12px] text-ink">{year}</span>;
}

// A cropped photo tile; clicking opens the full scan.
// hero: big lead photo. wide: a grid tile spanning both columns (odd one out).
function Photo({ photo, hero, wide, onOpen }: { photo: HistoryPhoto; hero?: boolean; wide?: boolean; onOpen: () => void }) {
  const locale = useLocale() as Locale;
  return (
    <figure className={`pixel-row overflow-hidden bg-white ${wide ? 'col-span-2' : ''}`}>
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
      <figcaption className={`px-2.5 py-2 leading-snug text-ink/80 ${hero || wide ? 'text-[13px]' : 'line-clamp-2 text-xs'}`}>{photo.caption[locale]}</figcaption>
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
      <header>
        <p className="font-display text-[12px] uppercase tracking-widest text-puc">{label}</p>
        <h3 className="mt-1 text-xl font-extrabold leading-tight tracking-tight text-navy">{entry.title[locale]}</h3>
      </header>
      <p className="text-sm leading-relaxed text-ink/80">{entry.text[locale]}</p>
      {!!entry.facts?.length && (
        <section className="pixel-row bg-ice/50 p-3">
          <h4 className="font-display text-[12px] uppercase tracking-widest text-navy">{t('facts')}</h4>
          <ul className="mt-2 space-y-2">
            {entry.facts.map((f) => (
              <li key={f.pt} className="flex gap-2 text-[13px] leading-snug text-ink/85">
                <span aria-hidden className="font-display text-puc">▸</span>
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
        <div key={e.title.pt} className={i > 0 ? 'mt-8 border-t-3 border-dashed border-ink/20 pt-6' : ''}>
          <Entry entry={e} label={'levels' in e ? t('thisFloor') : (name ?? t('siteLabel'))} onOpen={show} />
        </div>
      ))}
      <footer className="mt-8 border-t-2 border-dashed border-ink/20 pt-3">
        <h4 className="font-display text-[12px] uppercase tracking-widest text-ink/55">{t('sources')}</h4>
        <ul className="mt-1 space-y-1">
          {history.sources.map((s) => (
            <li key={s.url} className="text-xs">
              <a href={s.url} target="_blank" rel="noopener" className="text-puc underline underline-offset-2 hover:text-navy">
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
        className="pixel-box m-auto max-h-[92dvh] w-[min(56rem,94vw)] overflow-hidden p-0 backdrop:bg-ink/70"
      >
        {open && (
          <figure className="flex max-h-[92dvh] flex-col">
            {/* eslint-disable-next-line @next/next/no-img-element -- static export, pre-sized scans */}
            <img src={open.src} alt={open.caption[locale]} className="min-h-0 w-full flex-1 bg-ink object-contain" />
            <figcaption className="flex items-start gap-3 border-t-3 border-ink px-4 py-3 text-sm">
              <YearChip year={open.year} />
              <span className="flex-1 leading-snug">
                {open.caption[locale]}
                <span className="block text-xs text-ink/55">{open.credit}</span>
              </span>
              <button onClick={() => dialog.current?.close()} aria-label={t('closePhoto')} className="pixel-btn pixel-btn-paper grid h-8 w-8 shrink-0 place-items-center leading-none">
                ✕
              </button>
            </figcaption>
          </figure>
        )}
      </dialog>
    </div>
  );
}
