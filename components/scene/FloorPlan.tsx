import { useEffect, useMemo, useState } from 'react';
import { Label } from './Label';
import { useFrame } from '@react-three/fiber';
import { useTranslations } from 'next-intl';
import { roomKind, type Building, type Era, type Floor, type Point } from '@/lib/campus';
import { useEra } from './era';
import { flatPolygon } from './geometry';
import { SURFACES, WALL_HEIGHT, buildInterior, finishOf, floorTexture, stageRise, type Surface } from './interior';

// Legend swatch per room use: the color of its real floor finish in that era (BuildingDetails room list).
export const roomColor = (kind: string, era: Era) => finishOf(kind, era).base;

const LABEL_MIN_AREA = 14; // m²; smaller rooms are unlabeled to avoid clutter
const LABEL_MIN_ZOOM = 7; // CSS px per meter; below this (phones, zoomed out) labels would pile up

const area = (pts: Point[]) => Math.abs(pts.reduce((s, [x, z], i) => s + x * pts[(i + 1) % pts.length][1] - pts[(i + 1) % pts.length][0] * z, 0)) / 2;
const centroid = (pts: Point[]): Point => [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];

// One floor of a building as a cutaway model: real floor finishes, walls cut at sill height with doors and glazing,
// and furniture by use (interior.ts). xray: the floor is under the visible ground, so only its floors are drawn,
// through everything (depthTest off).
export function FloorPlan({ building, floor, y, xray }: { building: Building; floor: Floor; y: number; xray: boolean }) {
  const t = useTranslations('room');
  const era = useEra();
  const [labelsFit, setLabelsFit] = useState(false);
  useFrame(({ camera }) => {
    const fit = camera.zoom >= LABEL_MIN_ZOOM;
    if (fit !== labelsFit) setLabelsFit(fit);
  });
  const rooms = useMemo(
    () => floor.rooms.filter((r) => r.footprint && r.footprint.length >= 3).map((r) => ({ id: r.id, kind: roomKind(r, era), footprint: r.footprint! })),
    [floor.rooms, era],
  );
  const slab = useMemo(() => flatPolygon(building.footprint, y + 0.02), [building.footprint, y]);
  const floors = useMemo(() => rooms.map((r) => ({ id: r.id, kind: r.kind, geometry: flatPolygon(r.footprint, y + 0.03 + stageRise(r.kind)) })), [rooms, y]);
  const interior = useMemo(() => (xray ? null : buildInterior(rooms, y, era)), [rooms, y, xray, era]);
  // Geometry is rebuilt per floor; free the previous floor's buffers on the GPU when it goes.
  useEffect(() => () => slab.dispose(), [slab]);
  useEffect(() => () => floors.forEach((f) => f.geometry.dispose()), [floors]);
  useEffect(() => () => Object.values(interior ?? {}).forEach((g) => g?.dispose()), [interior]);
  const labels = useMemo(() => rooms.filter((r) => r.kind !== 'corridor' && area(r.footprint) >= LABEL_MIN_AREA).map((r) => ({ id: r.id, kind: r.kind, at: centroid(r.footprint) })), [rooms]);
  return (
    <group>
      <mesh geometry={slab} receiveShadow renderOrder={xray ? 5 : 0}>
        <meshStandardMaterial color="#d9d4ca" roughness={0.9} depthTest={!xray} transparent={xray} opacity={xray ? 0.85 : 1} />
      </mesh>
      {floors.map((f) => (
        <mesh key={f.id} geometry={f.geometry} receiveShadow renderOrder={xray ? 6 : 0}>
          <meshStandardMaterial map={floorTexture(f.kind, era)} roughness={finishOf(f.kind, era).roughness} depthTest={!xray} transparent={xray} opacity={xray ? 0.9 : 1} polygonOffset polygonOffsetFactor={-1} />
        </mesh>
      ))}
      {interior &&
        (Object.keys(SURFACES) as Surface[]).map((s) =>
          interior[s] ? (
            <mesh key={s} geometry={interior[s]!} castShadow={s !== 'glass'} receiveShadow>
              <meshStandardMaterial vertexColors {...SURFACES[s]} transparent={s === 'glass'} depthWrite={s !== 'glass'} />
            </mesh>
          ) : null,
        )}
      {/* Always mounted, faded by zoom, so zooming doesn't add and remove DOM nodes */}
      {labels.map((r) => (
        <Label
          key={`l-${r.id}`}
          position={[r.at[0], y + (xray ? 0.4 : WALL_HEIGHT) + 0.6, r.at[1]]}
          text={t(r.kind as 'room')}
          className={`block whitespace-nowrap rounded-[5px] bg-white/90 px-1.5 py-0.5 text-[11px] font-bold text-navy shadow-[0_1px_3px_rgb(12_36_69/0.3)] transition-opacity ${labelsFit ? 'opacity-100' : 'opacity-0'}`}
        />
      ))}
    </group>
  );
}
