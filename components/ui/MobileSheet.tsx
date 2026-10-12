'use client';
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';

export type Snap = 'peek' | 'half' | 'full';
const ORDER: Snap[] = ['peek', 'half', 'full'];

// Visible height of each snap in CSS px: peek shows exactly the header (handle + search bar or building name).
const snapHeight = (snap: Snap, h: number, peek: number) => (snap === 'peek' ? peek : snap === 'half' ? Math.round(h * 0.5) : h - 72);

type Props = {
  snap: Snap;
  onSnap: (snap: Snap) => void;
  // Visible height in px once a snap settles, so the map can frame things above the sheet.
  onVisibleHeight: (px: number) => void;
  header: ReactNode; // the drag area: handle + always-visible content (search bar, building name)
  children: ReactNode; // scrolls inside the sheet
  label: string;
  resetScrollKey?: string; // scroll the body back to the top when this changes
  band?: boolean; // navy header band (a building is picked), like the line band on a station sign
};

// Phone bottom sheet (maps-app style): one panel that is always there, dragged between peek / half / full.
// It is a full-height panel moved with translateY, so dragging and snapping are GPU-cheap transforms.
export function MobileSheet({ snap, onSnap, onVisibleHeight, header, children, label, resetScrollKey, band = false }: Props) {
  const t = useTranslations('sheet');
  const [vh, setVh] = useState(0);
  const [drag, setDrag] = useState<number | null>(null); // live visible height while a finger is down
  const [entered, setEntered] = useState(false); // first paint starts off-screen, then slides in
  const start = useRef<{ y: number; h: number; t: number } | null>(null);
  const body = useRef<HTMLDivElement>(null);
  const head = useRef<HTMLDivElement>(null);
  const [peek, setPeek] = useState(132);

  useLayoutEffect(() => {
    const read = () => setVh(window.innerHeight);
    read();
    window.addEventListener('resize', read);
    return () => window.removeEventListener('resize', read);
  }, []);
  useLayoutEffect(() => {
    const el = head.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setPeek(Math.ceil(el.getBoundingClientRect().height)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [vh]);
  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const settled = snapHeight(snap, vh, peek);
  useEffect(() => {
    if (vh) onVisibleHeight(settled);
  }, [settled, vh, onVisibleHeight]);
  useEffect(() => {
    body.current?.scrollTo({ top: 0 });
  }, [resetScrollKey]);

  const full = snapHeight('full', vh, peek);
  const visible = !entered ? 0 : (drag ?? settled);

  const onDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('input,a,button:not([data-handle])')) return; // let controls in the header work
    start.current = { y: e.clientY, h: settled, t: performance.now() };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!start.current) return;
    setDrag(Math.min(full, Math.max(peek * 0.6, start.current.h + start.current.y - e.clientY)));
  };
  const onUp = (e: React.PointerEvent) => {
    const s = start.current;
    start.current = null;
    if (!s) return;
    setDrag(null);
    const moved = s.y - e.clientY;
    if (Math.abs(moved) < 6) return; // a tap: the handle button's click does the stepping
    // Project the release with its velocity (px/ms) so a flick goes to the next snap.
    const velocity = moved / Math.max(1, performance.now() - s.t);
    const target = s.h + moved + velocity * 180;
    onSnap(ORDER.reduce((best, k) => (Math.abs(snapHeight(k, vh, peek) - target) < Math.abs(snapHeight(best, vh, peek) - target) ? k : best), snap));
  };

  if (!vh) return null;
  return (
    <section
      aria-label={label}
      className="fixed inset-x-0 bottom-0 z-20 flex flex-col overflow-hidden rounded-t-[18px] bg-white shadow-[0_-2px_6px_rgb(12_36_69/0.12),0_-12px_32px_rgb(12_36_69/0.16)] motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-[cubic-bezier(.2,.8,.2,1)]"
      style={{ height: full, transform: `translateY(${full - visible}px)`, transitionDuration: drag !== null ? '0ms' : undefined }}
    >
      <div ref={head} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} className={`shrink-0 touch-none px-4 pb-4 transition-colors ${band ? 'bg-navy text-white' : ''}`}>
        <button
          data-handle
          aria-label={snap === 'full' ? t('collapse') : t('expand')}
          onClick={() => onSnap(snap === 'full' ? 'half' : ORDER[ORDER.indexOf(snap) + 1])}
          className="mx-auto block h-6 w-full"
        >
          <span className={`mx-auto block h-1.5 w-11 rounded-full ${band ? 'bg-white/45' : 'bg-navy/30'}`} />
        </button>
        {header}
      </div>
      <div ref={body} className={`min-h-0 flex-1 px-4 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] ${snap === 'peek' && drag === null ? 'overflow-hidden' : 'overflow-y-auto overscroll-contain'}`}>
        {children}
      </div>
    </section>
  );
}
