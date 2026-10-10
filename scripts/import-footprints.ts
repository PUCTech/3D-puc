// One-time import of campus footprints from OpenStreetMap (Overpass API).
// Re-runs merge: footprints/streets update, hand-edited fields stay. --fresh overwrites everything.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { buildCampus, importMode, mergeCampus, type OsmNode, type OsmWay } from './osm';
import { validateCampus, type Campus } from '../lib/campus';

const CAMPUS_WAY = 38629633; // "PUC Campus Consolação" boundary in OSM
const OUT = 'data/campus.json';
const QUERY = `[out:json][timeout:25];
way(${CAMPUS_WAY})->.campus;
.campus out geom;
way(around.campus:200); // everything nearby; around = distance to the boundary line. buildCampus sorts it out
out geom;
node["barrier"](around.campus:30);
out;
node["highway"~"^(crossing|traffic_signals|bus_stop)$"](around.campus:200);
out;`;

// Plain async main: package.json is CommonJS, so tsx can't use top-level await here.
async function main() {
  // Overpass rate-limits bursts (429/504); retry a few times with backoff.
  let res: Response | undefined;
  for (let attempt = 1; attempt <= 4; attempt++) {
    res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'User-Agent': '3d-puc campus map importer' },
      body: new URLSearchParams({ data: QUERY }),
    });
    if (res.ok) break;
    console.warn(`Overpass ${res.status}, retrying in ${attempt * 15}s`);
    await new Promise((r) => setTimeout(r, attempt * 15_000));
  }
  if (!res?.ok) throw new Error(`Overpass ${res?.status}: ${await res?.text()}`);
  const elements = (await res!.json()).elements as (OsmWay | OsmNode)[];
  const ways = elements.filter((e): e is OsmWay => e.type === 'way');
  const nodes = elements.filter((e): e is OsmNode => e.type === 'node');

  const existing: Campus | undefined = importMode(existsSync(OUT), process.argv) === 'merge'
    ? JSON.parse(readFileSync(OUT, 'utf8'))
    : undefined;
  const fresh = buildCampus(ways, CAMPUS_WAY, existing?.origin, nodes);
  const result = existing ? mergeCampus(existing, fresh) : fresh;

  const errors = validateCampus(result);
  if (errors.length) throw new Error(`refusing to write invalid campus:\n${errors.join('\n')}`);
  // One line per building/street keeps the file diffable without indenting every coordinate pair.
  writeFileSync(OUT, JSON.stringify(result, (_, v) => v, 1).replace(/\[\s+(-?[\d.]+),\s+(-?[\d.]+)\s+\]/g, '[$1,$2]') + '\n');
  console.log(`wrote ${OUT}: ${result.buildings.length} buildings, ${result.streets.length} streets`);
}

main().catch((e) => { console.error(e); process.exit(1); });
