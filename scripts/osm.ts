import type { Campus, Building, Floor, Point } from '../lib/campus';

export type LatLon = { lat: number; lon: number };
export type OsmWay = { type: 'way'; id: number; tags?: Record<string, string>; geometry: LatLon[] };
export type OsmNode = { type: 'node'; id: number; tags?: Record<string, string> } & LatLon;

const M_PER_DEG_LAT = 110540;
const M_PER_DEG_LON = 111320;
const FLOOR_HEIGHT = 3.5;
const CAR_ROADS = /^(primary|secondary|tertiary|residential|unclassified|living_street|pedestrian|service)$/;
const FURNITURE = new Set(['crossing', 'traffic_signals', 'bus_stop']);
const AREA_KINDS = new Set(['pitch', 'garden', 'park', 'grass', 'playground']);
const r2 = (n: number) => Math.round(n * 100) / 100;

// Equirectangular projection: accurate to centimeters at campus scale.
export const project = (p: LatLon, o: LatLon): Point => [
  r2((p.lon - o.lon) * M_PER_DEG_LON * Math.cos((o.lat * Math.PI) / 180)),
  r2((o.lat - p.lat) * M_PER_DEG_LAT), // south is +z; written this way to avoid -0
];

export function pointInPolygon([x, z]: Point, poly: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

export function guessFloors(height: number | undefined): Floor[] {
  if (!height) return [{ level: 0, height: FLOOR_HEIGHT, rooms: [] }];
  const n = Math.max(1, Math.round(height / FLOOR_HEIGHT));
  return Array.from({ length: n }, (_, level) => ({ level, height: r2(height / n), rooms: [] }));
}

const ring = (w: OsmWay, o: LatLon): Point[] => {
  const pts = w.geometry.map((p) => project(p, o));
  const [a, z] = [pts[0], pts[pts.length - 1]];
  return pts.length > 1 && a[0] === z[0] && a[1] === z[1] ? pts.slice(0, -1) : pts;
};
const center = (pts: Point[]): Point => [
  pts.reduce((s, p) => s + p[0], 0) / pts.length,
  pts.reduce((s, p) => s + p[1], 0) / pts.length,
];

const segmentDistance = ([px, pz]: Point, [ax, az]: Point, [bx, bz]: Point) => {
  const [dx, dz] = [bx - ax, bz - az];
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz || 1)));
  return Math.hypot(px - ax - t * dx, pz - az - t * dz);
};
const EDGE_DISTANCE = 15; // meters: barriers this close to the campus boundary belong to the campus edge

export function buildCampus(ways: OsmWay[], campusWayId: number, origin?: LatLon, nodes: OsmNode[] = []): Campus {
  const campusWay = ways.find((w) => w.id === campusWayId);
  if (!campusWay) throw new Error(`campus way ${campusWayId} not found in Overpass result`);
  const g = campusWay.geometry.slice(0, -1);
  const o = origin ?? {
    lat: g.reduce((s, p) => s + p.lat, 0) / g.length,
    lon: g.reduce((s, p) => s + p.lon, 0) / g.length,
  };
  const boundary = ring(campusWay, o);
  const buildings: Building[] = ways
    .filter((w) => w.tags?.building && w.id !== campusWayId)
    .map((w) => ({ w, footprint: ring(w, o) }))
    .filter(({ footprint }) => pointInPolygon(center(footprint), boundary))
    .sort((a, b) => a.w.id - b.w.id)
    .map(({ w, footprint }, i) => ({
      id: `predio-${i + 1}`,
      osmId: w.id,
      name: { pt: `Prédio ${i + 1}`, en: `Building ${i + 1}` },
      footprint,
      floors: guessFloors(w.tags?.height ? Number(w.tags.height) : undefined),
    }));
  const streets = ways
    .filter((w) => CAR_ROADS.test(w.tags?.highway ?? ''))
    .map((w) => ({ name: w.tags?.name ?? '', path: w.geometry.map((p) => project(p, o)) }));
  const footways = ways.filter((w) => w.tags?.highway === 'footway').map((w) => w.geometry.map((p) => project(p, o)));
  const areas = ways
    .filter((w) => AREA_KINDS.has(w.tags?.leisure ?? w.tags?.landuse ?? ''))
    .map((w) => ({ kind: (w.tags?.leisure ?? w.tags?.landuse)!, polygon: ring(w, o) }));
  // Neighbours only: campus buildings left out of data/campus.json were removed on purpose.
  const context = ways
    .filter((w) => w.tags?.building && w.id !== campusWayId)
    .map((w) => ({ w, footprint: ring(w, o) }))
    .filter(({ footprint }) => !pointInPolygon(center(footprint), boundary))
    .map(({ w, footprint }) => ({
      footprint: footprint.map(([x, z]): Point => [Math.round(x * 10) / 10, Math.round(z * 10) / 10]), // background: 10 cm is plenty
      height: Number(w.tags?.height) || FLOOR_HEIGHT * Number(w.tags?.['building:levels'] ?? 3),
    }));
  const nearEdge = (p: Point) => boundary.some((a, i) => segmentDistance(p, a, boundary[(i + 1) % boundary.length]) < EDGE_DISTANCE);
  const barriers = ways
    .filter((w) => w.tags?.barrier === 'fence' || w.tags?.barrier === 'wall')
    .map((w) => ({ w, path: w.geometry.map((p) => project(p, o)) }))
    .filter(({ path }) => path.some(nearEdge))
    .map(({ w, path }) => ({ kind: w.tags!.barrier, path, height: Number(w.tags?.height?.replace(',', '.')) || (w.tags!.barrier === 'wall' ? 2.5 : 2) }));
  const gates = nodes.filter((n) => n.tags?.barrier === 'gate').map((n) => project(n, o)).filter(nearEdge);
  // Street direction at a point: the nearest street segment's angle.
  const streetAngle = (p: Point) => {
    let best = { d: Infinity, angle: 0 };
    for (const s of streets)
      for (let i = 1; i < s.path.length; i++) {
        const d = segmentDistance(p, s.path[i - 1], s.path[i]);
        if (d < best.d) best = { d, angle: Math.atan2(s.path[i][1] - s.path[i - 1][1], s.path[i][0] - s.path[i - 1][0]) };
      }
    return Math.round(best.angle * 1000) / 1000;
  };
  const furniture = nodes
    .filter((n) => FURNITURE.has(n.tags?.highway ?? ''))
    .map((n) => {
      const at = project(n, o);
      return { kind: n.tags!.highway as 'crossing' | 'traffic_signals' | 'bus_stop', at, angle: streetAngle(at) };
    });
  return { origin: o, streets, buildings, boundary, areas, footways, context, barriers, gates, furniture };
}

export function mergeCampus(existing: Campus, fresh: Campus): Campus {
  const byOsm = new Map(fresh.buildings.map((b) => [b.osmId, b]));
  return {
    ...existing,
    streets: fresh.streets,
    boundary: fresh.boundary,
    areas: fresh.areas,
    footways: fresh.footways,
    context: fresh.context,
    barriers: fresh.barriers,
    gates: fresh.gates,
    furniture: fresh.furniture,
    buildings: existing.buildings.map((b) => {
      const match = b.osmId !== undefined ? byOsm.get(b.osmId) : undefined;
      return match ? { ...b, footprint: match.footprint } : b;
    }),
  };
}

// Merging is the default once data exists, so a plain re-run can't wipe hand edits.
export const importMode = (dataExists: boolean, args: string[]): 'merge' | 'fresh' =>
  dataExists && !args.includes('--fresh') ? 'merge' : 'fresh';
