import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Point } from '@/lib/campus';

// Footprints are (x east, z south). Shapes live in XY and are laid flat with rotateX(-90°),
// which maps shape y to -z, so we feed -z.
const shapeOf = (points: Point[]) => new THREE.Shape(points.map(([x, z]) => new THREE.Vector2(x, -z)));

// Extruded footprint. ExtrudeGeometry groups: 0 = caps (roof/floor), 1 = walls; wall UVs are in meters.
export function extrude(points: Point[], height: number) {
  const g = new THREE.ExtrudeGeometry(shapeOf(points), { depth: height, bevelEnabled: false });
  g.rotateX(-Math.PI / 2);
  return g;
}

// Flat polygon on the ground at height y.
export function flatPolygon(points: Point[], y: number) {
  const g = new THREE.ShapeGeometry(shapeOf(points));
  g.rotateX(-Math.PI / 2);
  g.translate(0, y, 0);
  return g;
}

// Paths (streets, footways) as flat strips `width` meters wide, merged into one geometry.
export function ribbons(paths: Point[][], width: number, y: number) {
  const parts: THREE.BufferGeometry[] = [];
  for (const path of paths)
    for (let i = 1; i < path.length; i++) {
      const [x1, z1] = path[i - 1], [x2, z2] = path[i];
      const len = Math.hypot(x2 - x1, z2 - z1);
      if (!len) continue;
      const g = new THREE.PlaneGeometry(len + width, width); // + width covers the gap at bends
      g.rotateX(-Math.PI / 2);
      g.rotateY(-Math.atan2(z2 - z1, x2 - x1));
      g.translate((x1 + x2) / 2, y, (z1 + z2) / 2);
      parts.push(g);
    }
  return parts.length ? mergeGeometries(parts) : null;
}

export { mergeGeometries };
