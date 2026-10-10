import { useMemo } from 'react';
import { campus } from '@/lib/campus';
import { flatPolygon, ribbons } from './geometry';
import { Trees } from './Trees';

const AREA_COLORS: Record<string, string> = { pitch: '#3fae4f', garden: '#6cc24a', park: '#6cc24a', grass: '#82d05c', playground: '#f0a43a' };

// Ground layers, stacked a few cm apart so they don't z-fight.
export function Site() {
  const lot = useMemo(() => (campus.boundary ? flatPolygon(campus.boundary, 0.03) : null), []);
  const areas = useMemo(() => (campus.areas ?? []).map((a) => ({ kind: a.kind, geometry: flatPolygon(a.polygon, 0.05) })), []);
  const footways = useMemo(() => ribbons(campus.footways ?? [], 2.5, 0.04), []);
  const gardens = useMemo(() => (campus.gardens ?? []).map((g) => ({ geometry: flatPolygon(g.polygon, 0.06), trees: g.trees ?? [] })), []);
  return (
    <>
      {lot && (
        <mesh geometry={lot} receiveShadow>
          <meshLambertMaterial color="#e6cf9f" />
        </mesh>
      )}
      {footways && (
        <mesh geometry={footways} receiveShadow>
          <meshLambertMaterial color="#e9e1d2" />
        </mesh>
      )}
      {gardens.map((g, i) => (
        <group key={`garden-${i}`}>
          <mesh geometry={g.geometry} receiveShadow>
            <meshLambertMaterial color="#5cbf4a" />
          </mesh>
          <Trees at={g.trees} />
        </group>
      ))}
      {areas.map((a, i) => (
        <mesh key={i} geometry={a.geometry} receiveShadow>
          <meshLambertMaterial color={AREA_COLORS[a.kind] ?? '#82d05c'} />
        </mesh>
      ))}
    </>
  );
}
