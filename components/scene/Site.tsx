import { useMemo } from 'react';
import { campus } from '@/lib/campus';
import { flatPolygon, ribbons } from './geometry';
import { pointInPolygon, Sunken } from './Sunken';
import { Plants } from './Plants';

const AREA_COLORS: Record<string, string> = { pitch: '#3fae4f', garden: '#6cc24a', park: '#6cc24a', grass: '#82d05c', playground: '#f0a43a' };

// Ground layers, stacked a few cm apart so they don't z-fight.
export function Site() {
  const sunken = useMemo(() => campus.sunken ?? [], []);
  const lotOutline = campus.upperLot ?? campus.boundary;
  const lot = useMemo(() => (lotOutline ? flatPolygon(lotOutline, 0.03) : null), [lotOutline]);
  // Areas inside a sunken zone (the court) sit on its lower floor.
  const areas = useMemo(
    () =>
      (campus.areas ?? []).map((a) => {
        const n = a.polygon.length;
        const c: [number, number] = [a.polygon.reduce((s, p) => s + p[0], 0) / n, a.polygon.reduce((s, p) => s + p[1], 0) / n];
        const zone = sunken.find((s) => pointInPolygon(c, s.polygon));
        return { kind: a.kind, polygon: a.polygon, sunk: !!zone, geometry: flatPolygon(a.polygon, zone ? -zone.depth + 0.05 : 0.05) };
      }),
    [sunken],
  );
  // Footways inside a sunken zone are drawn on its lower floor.
  const footways = useMemo(() => {
    const all = campus.footways ?? [];
    const depthOf = (path: [number, number][]) => sunken.find((s) => pointInPolygon(path[Math.floor(path.length / 2)], s.polygon))?.depth ?? 0;
    const upper = all.filter((p) => depthOf(p) === 0);
    const lower = sunken.map((s) => ribbons(all.filter((p) => depthOf(p) === s.depth), 2.5, -s.depth + 0.04));
    return [ribbons(upper, 2.5, 0.04), ...lower].filter((g) => g !== null);
  }, [sunken]);
  const gardens = useMemo(
    () =>
      (campus.gardens ?? []).map((g) => ({
        y: -(g.depth ?? 0),
        geometry: flatPolygon(g.polygon, -(g.depth ?? 0) + 0.06),
        earth: (g.earth ?? []).map((e) => flatPolygon(e, -(g.depth ?? 0) + 0.07)),
        path: g.path ? ribbons([g.path], 1.6, -(g.depth ?? 0) + 0.08) : null,
        plants: g.plants ?? [],
      })),
    [],
  );
  return (
    <>
      <Sunken courts={areas.filter((a) => a.sunk && a.kind === 'pitch').map((a) => a.polygon)} />
      {lot && (
        <mesh geometry={lot} receiveShadow>
          <meshLambertMaterial color="#cfcbc2" /> {/* light grey concrete paving (photos tour 01, jornada 1–2) */}
        </mesh>
      )}
      {footways.map((g, i) => (
        <mesh key={`fw-${i}`} geometry={g} receiveShadow>
          <meshLambertMaterial color="#e9e1d2" />
        </mesh>
      ))}
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
          <group position-y={g.y}>
            <Plants plants={g.plants} />
          </group>
        </group>
      ))}
      {areas.filter((a) => !(a.sunk && a.kind === 'pitch')).map((a, i) => (
        <mesh key={i} geometry={a.geometry} receiveShadow>
          <meshLambertMaterial color={AREA_COLORS[a.kind] ?? '#82d05c'} />
        </mesh>
      ))}
    </>
  );
}
