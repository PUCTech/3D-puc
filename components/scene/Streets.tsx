import { useMemo } from 'react';
import { Html } from '@react-three/drei';
import { campus, type Point } from '@/lib/campus';
import { ribbons } from './geometry';
import { pointInPolygon } from './Sunken';

const length = (path: Point[]) => path.slice(1).reduce((s, [x, z], i) => s + Math.hypot(x - path[i][0], z - path[i][1]), 0);

// OSM splits a street into many segments; label only the longest one per name.
const longestByName = new Map<string, number>();
campus.streets.forEach((s, i) => {
  const best = longestByName.get(s.name);
  if (s.name && (best === undefined || length(s.path) > length(campus.streets[best].path))) longestByName.set(s.name, i);
});

const STREET_WIDTH = 8; // meters; shortcut: one width for every street until lanes/widths are imported

export function Streets() {
  // Segments inside a sunken zone (e.g. OSM's service driveway on the parking lane) would float over it: drop them.
  const asphalt = useMemo(() => {
    const zones = (campus.sunken ?? []).map((z) => z.polygon);
    const segments = campus.streets.flatMap((s) =>
      s.path.slice(1).map((b, i) => [s.path[i], b] as [Point, Point]),
    );
    const kept = segments.filter(([a, b]) => !zones.some((z) => pointInPolygon([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], z)));
    return ribbons(kept, STREET_WIDTH, 0.01);
  }, []);
  return (
    <>
      {asphalt && (
        <mesh geometry={asphalt} receiveShadow>
          <meshLambertMaterial color="#55535f" />
        </mesh>
      )}
      {[...longestByName.values()].map((i) => {
        const s = campus.streets[i];
        const mid = s.path[Math.floor(s.path.length / 2)];
        return (
          <Html key={i} position={[mid[0], 0.5, mid[1]]} center zIndexRange={[10, 0]} className="pointer-events-none select-none whitespace-nowrap font-display text-[13px] uppercase tracking-wider text-white [text-shadow:1px_1px_0_#1b1b24,-1px_-1px_0_#1b1b24,1px_-1px_0_#1b1b24,-1px_1px_0_#1b1b24]">
            {s.name}
          </Html>
        );
      })}
    </>
  );
}
