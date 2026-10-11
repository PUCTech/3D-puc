import { useMemo } from 'react';
import * as THREE from 'three';
import { Edges } from '@react-three/drei';
import type { Point } from '@/lib/campus';
import { mergeGeometries } from './geometry';
import { INK_WIDTH, toonRamp } from './pixel';

// Red clay-tile lean-to along a wall over the sunken level (court photo, 2018):
// it leaves the wall at street level and slopes down outward, on posts standing on the lower floor.
const TOP = 0.4; // m above street level at the wall
const DROP = 1.4; // m it falls toward the outer edge
const POST_EVERY = 3;

function tileTexture() {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 4;
  const g = c.getContext('2d')!;
  g.fillStyle = '#b5532f';
  g.fillRect(0, 0, 4, 4);
  g.fillStyle = '#8e3c22'; // tile course lines
  g.fillRect(0, 3, 4, 1);
  g.fillRect(2, 0, 1, 3);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = t.minFilter = THREE.NearestFilter;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function LeanTo({ from: [x1, z1], to: [x2, z2], width, center: [cx, cz], depth, opacity }: { from: Point; to: Point; width: number; center: Point; depth: number; opacity: number }) {
  const { roof, posts, texture } = useMemo(() => {
    const len = Math.hypot(x2 - x1, z2 - z1);
    const [ux, uz] = [(x2 - x1) / len, (z2 - z1) / len];
    let [nx, nz] = [uz, -ux];
    if (nx * ((x1 + x2) / 2 - cx) + nz * ((z1 + z2) / 2 - cz) < 0) [nx, nz] = [-nx, -nz]; // outward
    const pt = (a: number, w: number, y: number) => new THREE.Vector3(x1 + ux * a + nx * w, y, z1 + uz * a + nz * w);
    const corners = [pt(0, 0, TOP), pt(len, 0, TOP), pt(len, width, TOP - DROP), pt(0, width, TOP - DROP)];
    const roof = new THREE.BufferGeometry().setFromPoints([corners[0], corners[1], corners[2], corners[0], corners[2], corners[3]]);
    roof.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, len / 0.6, 0, len / 0.6, width / 0.4, 0, 0, len / 0.6, width / 0.4, 0, width / 0.4], 2));
    roof.computeVertexNormals();
    const postHeight = depth + TOP - DROP;
    const parts: THREE.BufferGeometry[] = [];
    for (let a = 0; a <= len + 0.01; a += POST_EVERY) {
      const g = new THREE.BoxGeometry(0.18, postHeight, 0.18);
      const p = pt(a, width - 0.2, -depth + postHeight / 2);
      g.translate(p.x, p.y, p.z);
      parts.push(g);
    }
    return { roof, posts: mergeGeometries(parts), texture: tileTexture() };
  }, [x1, z1, x2, z2, width, cx, cz, depth]);
  return (
    <>
      <mesh geometry={roof} castShadow receiveShadow>
        <meshToonMaterial map={texture} gradientMap={toonRamp} side={THREE.DoubleSide} transparent opacity={opacity} />
        {opacity === 1 && <Edges threshold={15} color="#1b1b24" lineWidth={INK_WIDTH * 0.7} />}
      </mesh>
      <mesh geometry={posts} castShadow>
        <meshToonMaterial color="#e8e4da" gradientMap={toonRamp} transparent opacity={opacity} />
      </mesh>
    </>
  );
}
