"""Pull São Paulo's 2017 LiDAR (PMSP, AWS Open Data, Entwine Point Tiles) around the campus into local meters.

Reference data for modeling, not a runtime dependency. Needs: laspy, lazrs, numpy, pyproj (pip, in any venv).
Usage: python scripts/lidar-campus.py [margin_m] [--context]  ->  docs/consolacao/refs/lidar/campus[_context].npz (gitignored)
--context widens the box to every neighbouring building in campus.json (ground, building and class-20 points only).
Columns: x (east, m), z (south, m) in the campus.json frame; y = elevation (m above the geoid, as published);
cls = ASPRS class (2 ground, 3-5 vegetation, 6 building); rgb when the cloud carries color.
"""
import io, json, math, sys, urllib.request
from concurrent.futures import ThreadPoolExecutor
import laspy, numpy as np
from pyproj import Transformer

BASE = 'https://ept-m3dc-pmsp.s3.sa-east-1.amazonaws.com'
M_PER_DEG_LAT, M_PER_DEG_LON = 110540, 111320  # same constants as scripts/osm.ts

campus = json.load(open('data/campus.json'))
o = campus['origin']
args = [a for a in sys.argv[1:] if not a.startswith('--')]
margin = float(args[0]) if args else 40
wide = '--context' in sys.argv
pts = campus['boundary'] + [p for b in campus['buildings'] for p in b['footprint']] + ([p for b in campus.get('context', []) for p in b['footprint']] if wide else [])
xs, zs = [p[0] for p in pts], [p[1] for p in pts]
box = (min(xs) - margin, max(xs) + margin, min(zs) - margin, max(zs) + margin)

to_utm = Transformer.from_crs('EPSG:4326', 'EPSG:31983', always_xy=True)
to_ll = Transformer.from_crs('EPSG:31983', 'EPSG:4326', always_xy=True)
def local_to_utm(x, z):
    lat = o['lat'] - z / M_PER_DEG_LAT
    lon = o['lon'] + x / (M_PER_DEG_LON * math.cos(math.radians(o['lat'])))
    return to_utm.transform(lon, lat)
corners = [local_to_utm(x, z) for x in box[:2] for z in box[2:]]
E0, E1 = min(c[0] for c in corners), max(c[0] for c in corners)
N0, N1 = min(c[1] for c in corners), max(c[1] for c in corners)

def get(path):
    with urllib.request.urlopen(f'{BASE}/{path}', timeout=60) as r:
        return r.read()

ept = json.loads(get('ept.json'))
bx0, by0, bz0, bx1, by1, bz1 = ept['bounds']
span = bx1 - bx0

def node_hits(key):
    d, x, y, _ = map(int, key.split('-'))
    size = span / 2 ** d
    nx0, ny0 = bx0 + x * size, by0 + y * size
    return nx0 < E1 and nx0 + size > E0 and ny0 < N1 and ny0 + size > N0

# Walk the hierarchy: a count of -1 means that subtree's listing lives in its own file.
nodes, pending = [], ['0-0-0-0']
while pending:
    h = json.loads(get(f'ept-hierarchy/{pending.pop()}.json'))
    for key, count in h.items():
        if not node_hits(key):
            continue
        if count == -1:
            pending.append(key)
        elif count > 0:
            nodes.append(key)
print(f'{len(nodes)} chunks intersect the campus box', file=sys.stderr)

def read(key):
    las = laspy.read(io.BytesIO(get(f'ept-data/{key}.laz')))
    keep = (las.x >= E0) & (las.x <= E1) & (las.y >= N0) & (las.y <= N1)
    if wide:
        c = np.asarray(las.classification)
        keep &= (c == 2) | (c == 6) | (c == 20)
    out = {'E': np.asarray(las.x[keep]), 'N': np.asarray(las.y[keep]), 'y': np.asarray(las.z[keep]), 'cls': np.asarray(las.classification[keep])}
    if 'red' in las.point_format.dimension_names and not wide:
        out['rgb'] = np.stack([las.red[keep], las.green[keep], las.blue[keep]], 1) // 256
    return out

with ThreadPoolExecutor(16) as pool:
    parts = list(pool.map(read, nodes))
cat = {k: np.concatenate([p[k] for p in parts if k in p]) for k in parts[0]}
# UTM -> lat/lon -> campus local meters (the inverse of local_to_utm)
lon, lat = to_ll.transform(cat.pop('E'), cat.pop('N'))
cat['x'] = (lon - o['lon']) * M_PER_DEG_LON * math.cos(math.radians(o['lat']))
cat['z'] = (o['lat'] - lat) * M_PER_DEG_LAT
inside = (cat['x'] >= box[0]) & (cat['x'] <= box[1]) & (cat['z'] >= box[2]) & (cat['z'] <= box[3])
cat = {k: v[inside] for k, v in cat.items()}
np.savez_compressed(f"docs/consolacao/refs/lidar/campus{'_context' if wide else ''}.npz", **cat)
print(f"{len(cat['x'])} points; classes {sorted(set(cat['cls'].tolist()))}", file=sys.stderr)
