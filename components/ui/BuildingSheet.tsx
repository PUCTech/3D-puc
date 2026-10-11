'use client';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Building } from '@/lib/campus';
import { BuildingDetails } from './BuildingDetails';
import { historyFor } from '@/lib/history';

// Phone bottom sheet: peek (name + tag) → drag/tap the handle to expand to floors.
type Props = { building: Building; floor: number | null; onFloor: (level: number | null) => void; onClose: () => void };

export function BuildingSheet({ building, floor, onFloor, onClose }: Props) {
  const t = useTranslations('sheet');
  const [expanded, setExpanded] = useState(false);
  const floorView = floor !== null; // keep the sheet short so the cut floor stays visible above it
  const dragStart = useRef<number | null>(null);
  const sheet = useRef<HTMLElement>(null);
  useEffect(() => {
    sheet.current?.scrollTo({ top: 0 });
  }, [floor]); // new floor: start from the top

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
      ref={sheet}
      data-testid="building-sheet"
      aria-labelledby="building-title"
      className={`pixel-box fixed inset-x-0 bottom-0 z-20 overflow-y-auto ${floorView ? 'max-h-[42dvh]' : 'max-h-[75dvh]'} border-x-0 border-b-0 px-5 pb-6 pt-1 shadow-[0_-4px_0_var(--color-ink)]`}
    >
      <button
        aria-label={expanded ? t('collapse') : t('expand')}
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
        onPointerDown={(e) => (dragStart.current = e.clientY)}
        onPointerUp={(e) => onPointerUp(e.clientY)}
        className="mx-auto mb-2 block h-7 w-full touch-none"
      >
        <span className="mx-auto block h-1.5 w-12 bg-ink" />
      </button>
      <button onClick={onClose} aria-label={t('close')} className="pixel-btn pixel-btn-paper absolute right-4 top-4 grid h-9 w-9 place-items-center text-lg leading-none">
        ✕
      </button>
      <BuildingDetails key={building.id} building={building} floor={floor} onFloor={onFloor} compact={!expanded && !floorView} dense={floorView} history={historyFor(building.id, floor)} />
    </section>
  );
}
