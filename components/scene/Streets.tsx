import { Html, Line } from '@react-three/drei';
import { campus, type Point } from '@/lib/campus';

const length = (path: Point[]) => path.slice(1).reduce((s, [x, z], i) => s + Math.hypot(x - path[i][0], z - path[i][1]), 0);

// OSM splits a street into many segments; label only the longest one per name.
const longestByName = new Map<string, number>();
campus.streets.forEach((s, i) => {
  const best = longestByName.get(s.name);
  if (s.name && (best === undefined || length(s.path) > length(campus.streets[best].path))) longestByName.set(s.name, i);
});
const LABELED = new Set(longestByName.values());

export function Streets() {
  return (
    <>
      {campus.streets.map((s, i) => {
        const mid = s.path[Math.floor(s.path.length / 2)];
        return (
          <group key={i}>
            <Line points={s.path.map(([x, z]) => [x, 0.02, z] as [number, number, number])} color="#5d6170" lineWidth={10} />
            {LABELED.has(i) && (
              <Html position={[mid[0], 0.5, mid[1]]} center zIndexRange={[10, 0]} className="pointer-events-none select-none whitespace-nowrap font-mono text-[9px] uppercase tracking-widest text-white [text-shadow:1px_1px_0_#000]">
                {s.name}
              </Html>
            )}
          </group>
        );
      })}
    </>
  );
}
