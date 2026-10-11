import { useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Edges, Html } from '@react-three/drei';
import { useTranslations } from 'next-intl';
import type { Building, Floor, Point } from '@/lib/campus';
import { extrude, flatPolygon } from './geometry';
import { INK_WIDTH, toonRamp } from './pixel';

// Room colors by use, so a floor reads at a glance (legend: BuildingDetails room list).
export const ROOM_COLORS: Record<string, string> = {
  classroom: '#bae4fe', office: '#ffd166', support: '#e8e1cf', wc: '#cfe3e8', stair: '#bdb6a8', corridor: '#c97a5a', // terracotta tile corridor floor (Prédio 2 photo, 2025)
 
  foyer: '#f1d9b5', entrance: '#f1d9b5', stage: '#e3b6e8', auditorium: '#f4b1a8', library: '#b7dfa8', stacks: '#9ccf8c',
  terrace: '#8fcf6a', canteen: '#f7b267', lounge: '#f6c9a8', bedroom: '#f9e3b8', meeting: '#ffe08a', room: '#e9dcc6', bar: '#f2c6a0',
};
const ROOM_HEIGHT = 0.4; // low blocks: walls suggested, the plan stays readable from above
const LABEL_MIN_AREA = 14; // m²; smaller rooms are colored but unlabeled to avoid clutter
const LABEL_MIN_ZOOM = 7; // CSS px per meter; below this (phones, zoomed out) labels would pile up

const area = (pts: Point[]) => Math.abs(pts.reduce((s, [x, z], i) => s + x * pts[(i + 1) % pts.length][1] - pts[(i + 1) % pts.length][0] * z, 0)) / 2;
const centroid = (pts: Point[]): Point => [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];

// One floor of a building as a cutaway: a slab with its rooms as colored, ink-outlined blocks and labels.
// xray: the floor is under the visible ground, so draw it through (depthTest off).
export function FloorPlan({ building, floor, y, xray }: { building: Building; floor: Floor; y: number; xray: boolean }) {
  const t = useTranslations('room');
  const [labelsFit, setLabelsFit] = useState(false);
  useFrame(({ camera }) => {
    const fit = camera.zoom >= LABEL_MIN_ZOOM;
    if (fit !== labelsFit) setLabelsFit(fit);
  });
  const slab = useMemo(() => flatPolygon(building.footprint, y + 0.02), [building.footprint, y]);
  const rooms = useMemo(
    () =>
      floor.rooms
        .filter((r) => r.footprint && r.footprint.length >= 3)
        .map((r) => {
          const g = extrude(r.footprint!, ROOM_HEIGHT);
          g.translate(0, y + 0.03, 0);
          return { id: r.id, kind: r.kind ?? 'room', geometry: g, at: centroid(r.footprint!), big: area(r.footprint!) >= LABEL_MIN_AREA };
        }),
    [floor.rooms, y],
  );
  return (
    <group>
      <mesh geometry={slab} receiveShadow renderOrder={xray ? 5 : 0}>
        <meshLambertMaterial color="#fdf6e3" depthTest={!xray} transparent={xray} opacity={xray ? 0.85 : 1} />
      </mesh>
      {rooms.map((r) => (
        <mesh key={r.id} geometry={r.geometry} receiveShadow renderOrder={xray ? 6 : 0}>
          <meshToonMaterial color={ROOM_COLORS[r.kind] ?? ROOM_COLORS.room} gradientMap={toonRamp} depthTest={!xray} transparent={xray} opacity={xray ? 0.9 : 1} />
          <Edges threshold={15} color="#1b1b24" lineWidth={INK_WIDTH * 0.6} depthTest={!xray} renderOrder={xray ? 7 : 0} />
        </mesh>
      ))}
      {/* Always mounted, hidden with opacity: mounting/unmounting drei <Html> on every zoom step is costly and noisy */}
      {rooms
        .filter((r) => r.big && r.kind !== 'corridor')
        .map((r) => (
          <Html key={`l-${r.id}`} position={[r.at[0], y + ROOM_HEIGHT + 0.6, r.at[1]]} center zIndexRange={[10, 0]} className="pointer-events-none select-none">
            <span className={`pixel-chip block whitespace-nowrap bg-paper px-1 font-display text-[11px] text-navy transition-opacity ${labelsFit ? 'opacity-100' : 'opacity-0'}`}>
              {t(r.kind as 'room')}
            </span>
          </Html>
        ))}
    </group>
  );
}
