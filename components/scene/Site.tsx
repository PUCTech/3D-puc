import { useMemo } from 'react';
import { campus } from '@/lib/campus';
import { flatPolygon, ribbons } from './geometry';
import { Plants } from './Plants';

const AREA_COLORS: Record<string, string> = { pitch: '#3fae4f', garden: '#6cc24a', park: '#6cc24a', grass: '#82d05c', playground: '#f0a43a' };

// Ground layers, stacked a few cm apart so they don't z-fight.
export function Site() {
  const lot = useMemo(() => (campus.boundary ? flatPolygon(campus.boundary, 0.03) : null), []);
  const areas = useMemo(() => (campus.areas ?? []).map((a) => ({ kind: a.kind, geometry: flatPolygon(a.polygon, 0.05) })), []);
  const footways = useMemo(() => ribbons(campus.footways ?? [], 2.5, 0.04), []);
  const gardens = useMemo(
    () =>
      (campus.gardens ?? []).map((g) => ({
        geometry: flatPolygon(g.polygon, 0.06),
        earth: (g.earth ?? []).map((e) => flatPolygon(e, 0.07)),
        path: g.path ? ribbons([g.path], 1.6, 0.08) : null,
        plants: g.plants ?? [],
      })),
    [],
  );
  return (
    <>
      {lot && (
        <mesh geometry={lot} receiveShadow>
          <meshLambertMaterial color="#cfcbc2" /> {/* light grey concrete paving (photos tour 01, jornada 1–2) */}
        </mesh>
      )}
      {footways && (
        <mesh geometry={footways} receiveShadow>
          <meshLambertMaterial color="#e9e1d2" />
        </mesh>
      )}
      {gardens.map((g, i) => (
        <group key={`garden-${i}`}>
          {/* dense dark ground cover (photo 05) */}
          <mesh geometry={g.geometry} receiveShadow>
            <meshLambertMaterial color="#3f8f3a" />
          </mesh>
          {g.earth.map((e, j) => (
            <mesh key={j} geometry={e} receiveShadow>
              <meshLambertMaterial color="#b5652f" />
            </mesh>
          ))}
          {g.path && (
            <mesh geometry={g.path} receiveShadow>
              <meshLambertMaterial color="#cfc6b2" />
            </mesh>
          )}
          <Plants plants={g.plants} />
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
