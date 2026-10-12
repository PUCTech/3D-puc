import { useMemo } from 'react';
import { campus } from '@/lib/campus';
import { extrude, flatPolygon, ribbons, terrainAt, terrainGeometry } from './geometry';
import { pointInPolygon, Sunken } from './Sunken';
import { Plants } from './Plants';

const AREA_COLORS: Record<string, string> = { pitch: '#4c8a3c', garden: '#5e9142', park: '#5e9142', grass: '#6b9a4a', playground: '#f0a43a' };

// Ground layers, stacked a few cm apart so they don't z-fight.
// lower: only the sunken level's layers (court, retaining walls, lower gardens and paths).
export function Site({ lower = false }: { lower?: boolean }) {
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
    return [{ geometry: ribbons(upper, 2.5, 0.04), sunk: false }, ...lower.map((geometry) => ({ geometry, sunk: true }))].filter(
      (f): f is { geometry: NonNullable<typeof f.geometry>; sunk: boolean } => f.geometry !== null,
    );
  }, [sunken]);
  const gardens = useMemo(
    () =>
      (campus.gardens ?? []).map((g) => ({
        y: -(g.depth ?? 0),
        // A garden with `terrain` follows the measured slope (the bosque falls to -12 m); the rest are flat.
        geometry: g.terrain ? terrainGeometry(g.terrain, g.polygon, -(g.depth ?? 0), pointInPolygon) : flatPolygon(g.polygon, -(g.depth ?? 0) + 0.06),
        terrain: g.terrain,
        earth: (g.earth ?? []).map((e) => flatPolygon(e, -(g.depth ?? 0) + 0.07)),
        hedges: (g.hedges ?? []).map((h) => extrude(h, 0.6).translate(0, -(g.depth ?? 0) + 0.06, 0)),
        path: g.path ? ribbons([g.path], 1.6, -(g.depth ?? 0) + 0.08) : null,
        curb: g.path ? ribbons([g.path], 1.85, -(g.depth ?? 0) + 0.075) : null, // red-painted edging under the flagstones (PUC-SP gallery 2023)
        plants: g.plants ?? [],
      })),
    [],
  );
  return (
    <>
      <Sunken courts={areas.filter((a) => a.sunk && a.kind === 'pitch').map((a) => a.polygon)} />
      {!lower && lot && (
        <mesh geometry={lot} receiveShadow>
          <meshLambertMaterial color="#cfcbc2" /> {/* light grey concrete paving (photos tour 01, jornada 1–2) */}
        </mesh>
      )}
      {footways.filter((f) => !lower || f.sunk).map((f, i) => (
        <mesh key={`fw-${i}`} geometry={f.geometry} receiveShadow>
          <meshLambertMaterial color="#e9e1d2" />
        </mesh>
      ))}
      {gardens.filter((g) => !lower || g.y < 0).map((g, i) => (
        <group key={`garden-${i}`}>
          {/* dense dark ground cover (photo 05) */}
          <mesh geometry={g.geometry} receiveShadow>
            <meshLambertMaterial color="#40703a" />
          </mesh>
          {g.earth.map((e, j) => (
            <mesh key={j} geometry={e} receiveShadow>
              <meshLambertMaterial color="#b5652f" />
            </mesh>
          ))}
          {/* Burle Marx's clipped, lobed hedge beds (drone video) */}
          {g.hedges.map((h, j) => (
            <mesh key={`h-${j}`} geometry={h} castShadow receiveShadow>
              <meshStandardMaterial color="#3b6b2f" roughness={0.95} />
            </mesh>
          ))}
          {g.curb && (
            <mesh geometry={g.curb} receiveShadow>
              <meshLambertMaterial color="#a8442f" />
            </mesh>
          )}
          {g.path && (
            <mesh geometry={g.path} receiveShadow>
              <meshLambertMaterial color="#cfc6b2" />
            </mesh>
          )}
          {g.terrain ? (
            g.plants.map((p, j) => (
              <group key={`p-${j}`} position-y={terrainAt(g.terrain!, p.at[0], p.at[1])}>
                <Plants plants={[p]} />
              </group>
            ))
          ) : (
            <group position-y={g.y}>
              <Plants plants={g.plants} />
            </group>
          )}
        </group>
      ))}
      {areas.filter((a) => !(a.sunk && a.kind === 'pitch') && (!lower || a.sunk)).map((a, i) => (
        <mesh key={i} geometry={a.geometry} receiveShadow>
          <meshLambertMaterial color={AREA_COLORS[a.kind] ?? '#6b9a4a'} />
        </mesh>
      ))}
    </>
  );
}
