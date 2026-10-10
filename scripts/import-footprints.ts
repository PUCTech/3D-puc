// One-time import of campus footprints from OpenStreetMap (Overpass API).
// Re-runs merge: footprints/streets update, hand-edited fields stay. --fresh overwrites everything.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { buildCampus, importMode, mergeCampus, type OsmWay } from './osm';
import { validateCampus, type Campus } from '../lib/campus';

const CAMPUS_WAY = 38629633; // "PUC Campus Consolação" boundary in OSM
const OUT = 'data/campus.json';
const QUERY = `[out:json][timeout:25];
way(${CAMPUS_WAY})->.campus;
.campus out geom;
way["building"](around.campus:200); // around = distance to the boundary line, so reach the middle; buildCampus filters to inside
out geom;
way["highway"~"^(primary|secondary|tertiary|residential|unclassified|living_street|pedestrian)$"](around.campus:80);
out geom;`;

// Plain async main: package.json is CommonJS, so tsx can't use top-level await here.
async function main() {
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'User-Agent': '3d-puc campus map importer' },
    body: new URLSearchParams({ data: QUERY }),
  });
  if (!res.ok) throw new Error(`Overpass ${res.status}: ${await res.text()}`);
  const ways = ((await res.json()).elements as OsmWay[]).filter((e) => e.type === 'way');

  const existing: Campus | undefined = importMode(existsSync(OUT), process.argv) === 'merge'
    ? JSON.parse(readFileSync(OUT, 'utf8'))
    : undefined;
  const fresh = buildCampus(ways, CAMPUS_WAY, existing?.origin);
  const result = existing ? mergeCampus(existing, fresh) : fresh;

  const errors = validateCampus(result);
  if (errors.length) throw new Error(`refusing to write invalid campus:\n${errors.join('\n')}`);
  writeFileSync(OUT, JSON.stringify(result, null, 1) + '\n');
  console.log(`wrote ${OUT}: ${result.buildings.length} buildings, ${result.streets.length} streets`);
}

main().catch((e) => { console.error(e); process.exit(1); });
