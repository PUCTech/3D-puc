import { useMemo } from 'react';
import * as THREE from 'three';
import type { Point } from '@/lib/campus';
import { mergeGeometries } from './geometry';
import { toonRamp } from './pixel';
import { useNight } from './night';

// Multi-sport court from the drone video (29–33 s) and the 2018 court photo:
// maroon border band, green field, futsal + basketball markings, goals, hoops, chain-link fence, floodlights.
const BORDER = 1.2;
const LINE = 0.1;
const FENCE = 4;

// Court frame from its 4-corner polygon: center, long-axis angle, length and width.
function frameOf(poly: Point[]) {
  const c: Point = [poly.reduce((s, p) => s + p[0], 0) / poly.length, poly.reduce((s, p) => s + p[1], 0) / poly.length];
  const e = (i: number) => [poly[(i + 1) % 4][0] - poly[i][0], poly[(i + 1) % 4][1] - poly[i][1]];
  const [a, b] = [e(0), e(1)];
  const [la, lb] = [Math.hypot(a[0], a[1]), Math.hypot(b[0], b[1])];
  const long = la >= lb ? a : b;
  return { c, angle: Math.atan2(long[1], long[0]), L: Math.max(la, lb), W: Math.min(la, lb) };
}

// Lines in local court space (x along the length, z across), merged into one flat mesh.
function markings(L: number, W: number) {
  const parts: THREE.BufferGeometry[] = [];
  const bar = (x: number, z: number, lx: number, lz: number) => {
    const g = new THREE.PlaneGeometry(lx, lz);
    g.rotateX(-Math.PI / 2);
    g.translate(x, 0, z);
    parts.push(g);
  };
  const ring = (x: number, z: number, r: number, start = 0, len = Math.PI * 2) => {
    const g = new THREE.RingGeometry(r - LINE, r, 40, 1, start, len);
    g.rotateX(-Math.PI / 2);
    g.translate(x, 0, z);
    parts.push(g.index ? g.toNonIndexed() : g);
  };
  const [hl, hw] = [L / 2, W / 2];
  bar(0, -hw, L, LINE); // outline
  bar(0, hw, L, LINE);
  bar(-hl, 0, LINE, W);
  bar(hl, 0, LINE, W);
  bar(0, 0, LINE, W); // center line
  ring(0, 0, 3); // center circle
  for (const s of [-1, 1]) {
    const ex = s * hl;
    // futsal penalty D: half circle from the end line, opening into the field
    ring(ex, 0, Math.min(6, hw - 0.5), s < 0 ? -Math.PI / 2 : Math.PI / 2, Math.PI);
    // basketball key (4.9 m wide, 5.8 m deep) and free-throw circle
    const kx = ex - s * 2.9;
    bar(kx, -2.45, 5.8, LINE);
    bar(kx, 2.45, 5.8, LINE);
    bar(ex - s * 5.8, 0, LINE, 4.9);
    ring(ex - s * 5.8, 0, 1.8);
  }
  return mergeGeometries(parts.map((g) => (g.index ? g.toNonIndexed() : g)));
}

function Goal({ x, flip }: { x: number; flip: boolean }) {
  const depth = flip ? -0.8 : 0.8;
  return (
    <group position-x={x}>
      {[-1.5, 1.5].map((z) => (
        <mesh key={z} position={[0, 1, z]}>
          <boxGeometry args={[0.08, 2, 0.08]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ))}
      <mesh position={[0, 2, 0]}>
        <boxGeometry args={[0.08, 0.08, 3.08]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[depth / 2, 1, 0]}>
        <boxGeometry args={[Math.abs(depth), 2, 3]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.25} />
      </mesh>
    </group>
  );
}

function Hoop({ x, flip }: { x: number; flip: boolean }) {
  const toward = flip ? -1 : 1; // board faces into the court
  return (
    <group position-x={x}>
      <mesh position={[0, 1.6, 0]}>
        <boxGeometry args={[0.15, 3.2, 0.15]} />
        <meshToonMaterial color="#3a3d44" gradientMap={toonRamp} />
      </mesh>
      <mesh position={[toward * 0.9, 3.4, 0]}>
        <boxGeometry args={[0.06, 1.05, 1.8]} />
        <meshToonMaterial color="#f4f4f0" gradientMap={toonRamp} />
      </mesh>
      <mesh position={[toward * 1.2, 3.05, 0]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.23, 0.03, 6, 16]} />
        <meshBasicMaterial color="#e2572b" />
      </mesh>
    </group>
  );
}

export function Court({ polygon, y }: { polygon: Point[]; y: number }) {
  const night = useNight();
  const { c, angle, L, W } = useMemo(() => frameOf(polygon), [polygon]);
  const [fl, fw] = [L - 2 * BORDER, W - 2 * BORDER];
  const lines = useMemo(() => markings(fl, fw), [fl, fw]);
  const fence = useMemo(() => {
    const posts: THREE.BufferGeometry[] = [];
    for (const [ax, az, bx, bz] of [[-L / 2, -W / 2, L / 2, -W / 2], [L / 2, -W / 2, L / 2, W / 2], [L / 2, W / 2, -L / 2, W / 2], [-L / 2, W / 2, -L / 2, -W / 2]]) {
      const len = Math.hypot(bx - ax, bz - az);
      for (let d = 0; d <= len; d += 3) {
        const g = new THREE.BoxGeometry(0.08, FENCE, 0.08);
        g.translate(ax + ((bx - ax) * d) / len, FENCE / 2, az + ((bz - az) * d) / len);
        posts.push(g);
      }
    }
    return mergeGeometries(posts);
  }, [L, W]);
  return (
    <group position={[c[0], y, c[1]]} rotation-y={-angle}>
      <mesh rotation-x={-Math.PI / 2} position-y={0.02} receiveShadow>
        <planeGeometry args={[L, W]} />
        <meshLambertMaterial color="#8f3a2e" />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.04} receiveShadow>
        <planeGeometry args={[fl, fw]} />
        <meshLambertMaterial color="#3f9a5c" />
      </mesh>
      <mesh geometry={lines} position-y={0.06}>
        <meshBasicMaterial color="#f4f4ef" side={THREE.DoubleSide} />
      </mesh>
      <Goal x={-fl / 2} flip={false} />
      <Goal x={fl / 2} flip />
      <Hoop x={-L / 2 + 0.3} flip={false} />
      <Hoop x={L / 2 - 0.3} flip />
      {/* chain-link fence: see-through panels on thin posts */}
      {[
        [0, -W / 2, L, 0],
        [0, W / 2, L, 0],
        [-L / 2, 0, W, Math.PI / 2],
        [L / 2, 0, W, Math.PI / 2],
      ].map(([x, z, len, rot], i) => (
        <mesh key={i} position={[x, FENCE / 2, z]} rotation-y={rot}>
          <planeGeometry args={[len, FENCE]} />
          <meshBasicMaterial color="#27463a" transparent opacity={0.3} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      ))}
      <mesh geometry={fence} castShadow>
        <meshToonMaterial color="#27463a" gradientMap={toonRamp} />
      </mesh>
      {/* floodlights on the corners (2018 photo) */}
      {[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz], i) => (
        <group key={i} position={[(sx * L) / 2, 0, (sz * W) / 2 + sz * 0.6]}>
          <mesh position-y={4.5} castShadow>
            <cylinderGeometry args={[0.08, 0.1, 9, 6]} />
            <meshToonMaterial color="#9aa0a6" gradientMap={toonRamp} />
          </mesh>
          <mesh position={[0, 9, -sz * 0.3]}>
            <boxGeometry args={[1.2, 0.3, 0.5]} />
            <meshToonMaterial color="#f2f2ee" emissive="#ffffff" emissiveIntensity={night ? 2 : 0} gradientMap={toonRamp} />
          </mesh>
        </group>
      ))}
      {/* one cool white light over the field stands in for the four floodlights (point lights are costly on phones) */}
      {night && <pointLight position-y={11} color="#eef4ff" intensity={420} distance={45} decay={2} />}
    </group>
  );
}
