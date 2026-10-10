import { Html, Line } from '@react-three/drei';
import { campus } from '@/lib/campus';

export function Streets() {
  return (
    <>
      {campus.streets.map((s, i) => {
        const mid = s.path[Math.floor(s.path.length / 2)];
        return (
          <group key={i}>
            <Line points={s.path.map(([x, z]) => [x, 0.02, z] as [number, number, number])} color="#143966" lineWidth={6} />
            {s.name && (
              <Html position={[mid[0], 0.5, mid[1]]} center distanceFactor={150} className="pointer-events-none select-none whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-accent">
                {s.name}
              </Html>
            )}
          </group>
        );
      })}
    </>
  );
}
