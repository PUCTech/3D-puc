'use client';
import { useLocale, useTranslations } from 'next-intl';
import type { Locale } from '@/lib/campus';
import { history, type HistoryEntry } from '@/lib/history';

// One "wiki" entry: title, text, trivia and dated photos (each opens full size in a new tab).
function Entry({ entry }: { entry: HistoryEntry }) {
  const locale = useLocale() as Locale;
  return (
    <article className="space-y-3">
      <h3 className="text-xl font-extrabold leading-tight tracking-tight text-navy">{entry.title[locale]}</h3>
      <p className="text-sm leading-relaxed text-ink/80">{entry.text[locale]}</p>
      {entry.photos.map((p) => (
        <figure key={p.src} className="pixel-row bg-white">
          <a href={p.src} target="_blank" rel="noopener" className="block">
            {/* eslint-disable-next-line @next/next/no-img-element -- static export, pre-sized scans */}
            <img src={p.src} alt={p.caption[locale]} loading="lazy" className="block w-full grayscale-[15%]" />
          </a>
          <figcaption className="px-3 py-2 text-xs leading-snug text-ink/75">
            <span className="pixel-chip mr-1.5 bg-sun px-1.5 font-display text-[12px] text-ink">{p.year}</span>
            {p.caption[locale]} <span className="text-ink/45">· {p.credit}</span>
          </figcaption>
        </figure>
      ))}
      {!!entry.facts?.length && (
        <ul className="space-y-2">
          {entry.facts.map((f) => (
            <li key={f.pt} className="flex gap-2 text-sm leading-snug text-ink/80">
              <span aria-hidden className="font-display text-puc">▸</span>
              <span>{f[locale]}</span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

export function History({ entries }: { entries: HistoryEntry[] }) {
  const t = useTranslations('history');
  return (
    <div className="space-y-8">
      {entries.map((e) => (
        <Entry key={e.title.pt} entry={e} />
      ))}
      <footer className="border-t-2 border-dashed border-ink/25 pt-3">
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
    </div>
  );
}
