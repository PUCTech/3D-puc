import { useEffect, useMemo, useState } from 'react';
import { Label } from './Label';
import * as THREE from 'three';
import { campus, type Point } from '@/lib/campus';
import { mergeGeometries, ribbons } from './geometry';
import { barsTexture } from './textures';
import { latticeTexture } from './StreetFence';
import { useNight } from './night';

// Upright strips along a path: walls (thick, opaque) and fences (thin, see-through bars).
function barrier(path: Point[], height: number, thickness: number) {
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 1; i < path.length; i++) {
    const [x1, z1] = path[i - 1], [x2, z2] = path[i];
    const len = Math.hypot(x2 - x1, z2 - z1);
    const g = new THREE.BoxGeometry(len, height, thickness);
    g.rotateY(-Math.atan2(z2 - z1, x2 - x1));
    g.translate((x1 + x2) / 2, height / 2, (z1 + z2) / 2);
    parts.push(g);
  }
  return mergeGeometries(parts);
}

function Pillar({ at: [x, z], height = 3 }: { at: Point; height?: number }) {
  return (
    <mesh position={[x, height / 2, z]} castShadow>
      <boxGeometry args={[0.8, height, 0.8]} />
      <meshStandardMaterial color="#d8d2c6" />
    </mesh>
  );
}

// Main gate (Street View, Jan 2024): white gatehouses flanking a white metal gate. The left (north) block carries the
// wall sign: PUC-SP crest + "PUC-SP", "Campus Marquês de Paranaguá" and the number 111 in blue (photo 01.37.51).
const GATE = { width: 3, house: 4, depth: 3, height: 2.8 };
const SIGN = { width: 3.8, height: 1.45 }; // meters: fills most of the wall, readable at map zoom

// Draws the sign on a canvas once the crest image (public/brand/pucsp-sign.png: crest + "PUC-SP") has loaded.
function useSignTexture() {
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);
  useEffect(() => {
    const img = new Image();
    img.src = '/brand/pucsp-sign.png';
    // Canvas text needs the web font loaded first (next/font exposes its family through --font-sign).
    const family = getComputedStyle(document.documentElement).getPropertyValue('--font-sign').trim() || 'sans-serif';
    const ready = Promise.all([img.decode(), document.fonts.load(`bold 30px ${family}`)]);
    ready.then(() => {
      const c = document.createElement('canvas');
      c.width = 680;
      c.height = 260;
      const g = c.getContext('2d')!;
      const h = 190; // crest + "PUC-SP" block
      const w = (img.width / img.height) * h;
      g.drawImage(img, 10, 10, w, h);
      g.fillStyle = '#1d1d1f';
      g.font = `bold 30px ${family}`;
      g.fillText('Campus Marquês de Paranaguá', 150, 240);
      g.fillStyle = '#2b4f9e';
      g.font = `bold 70px ${family}`;
      g.fillText('111', 570, 140);
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      setTexture(t);
    });
  }, []);
  return texture;
}

function Gatehouse({ at: [x, z], along: [ax, az] }: { at: Point; along: Point }) {
  const lattice = useMemo(() => {
    const t = latticeTexture();
    t.repeat.set(GATE.house * 2, 4);
    return t;
  }, []);
  const sign = useSignTexture();
  const bars = useMemo(() => barsTexture('#f3f3ee', 8, GATE.width), []);
  // Local frame: x along the street (south = +x), +z toward the street (west).
  const angle = -Math.atan2(az, ax);
  const offset = GATE.width / 2 + GATE.house / 2;
  const face = GATE.depth / 2 + 0.03;
  return (
    <group position={[x, 0, z]} rotation-y={angle}>
      {[-offset, offset].map((u) => (
        <group key={u} position-x={u}>
          <mesh position-y={GATE.height / 2} castShadow receiveShadow>
            <boxGeometry args={[GATE.house, GATE.height, GATE.depth]} />
            <meshStandardMaterial color="#f1efe9" />
          </mesh>
          {u < 0 ? (
            sign && (
              <mesh position={[0, GATE.height * 0.55, face]}>
                <planeGeometry args={[SIGN.width, SIGN.height]} />
                <meshBasicMaterial map={sign} transparent toneMapped={false} />
              </mesh>
            )
          ) : (
            <mesh position={[0, GATE.height * 0.6, face]}>
              <planeGeometry args={[GATE.house * 0.6, GATE.height * 0.4]} />
              <meshStandardMaterial map={lattice} color="#f4f2ec" alphaTest={0.5} transparent side={THREE.DoubleSide} />
            </mesh>
          )}
        </group>
      ))}
      {/* pedestrian gate: white vertical bars (Street View, Jan 2024) */}
      <mesh position-y={1.2}>
        <planeGeometry args={[GATE.width, 2.4]} />
        <meshStandardMaterial map={bars} color="#f3f3ee" alphaTest={0.5} transparent side={THREE.DoubleSide} />
      </mesh>
      <mesh position-y={2.42}>
        <boxGeometry args={[GATE.width, 0.08, 0.08]} />
        <meshStandardMaterial color="#f3f3ee" />
      </mesh>
    </group>
  );
}

// The campus edge: OSM walls, fences and gates, plus the hand-placed main entrance and its walk.
export function Edge() {
  const walls = useMemo(() => (campus.barriers ?? []).filter((b) => b.kind === 'wall').map((b) => barrier(b.path, b.height, 0.4)), []);
  const fences = useMemo(() => (campus.barriers ?? []).filter((b) => b.kind !== 'wall').map((b) => barrier(b.path, b.height, 0.08)), []);
  const entrance = campus.entrance;
  const night = useNight();
  const [narrow] = useState(() => window.matchMedia('(max-width: 639px)').matches);
  const walk = useMemo(() => (entrance ? ribbons([entrance.path], 3.5, 0.045) : null), [entrance]);
  return (
    <>
      {walls.map((g, i) => (
        <mesh key={`w${i}`} geometry={g} castShadow receiveShadow>
          <meshStandardMaterial color="#cfc6b6" />
        </mesh>
      ))}
      {fences.map((g, i) => (
        <mesh key={`f${i}`} geometry={g}>
          <meshStandardMaterial color="#2f3440" transparent opacity={0.55} />
        </mesh>
      ))}
      {(campus.gates ?? []).map((g, i) => (
        <group key={`g${i}`}>
          <Pillar at={[g[0] - 1.6, g[1]]} height={2.4} />
          <Pillar at={[g[0] + 1.6, g[1]]} height={2.4} />
        </group>
      ))}
      {entrance && (
        <group>
          {walk && (
            <mesh geometry={walk} receiveShadow>
              <meshLambertMaterial color="#f1e6cf" />
            </mesh>
          )}
          <Gatehouse at={entrance.at} along={entrance.along} />
          {night && <pointLight position={[entrance.at[0], 4, entrance.at[1]]} color="#ffe1b0" intensity={60} distance={18} decay={2} />}
          {/* white plaque with dark lettering, as on the real gate (Descubra Sampa photo); phones show only "PUC-SP" */}
          <Label
            position={[entrance.at[0], 6.5, entrance.at[1]]}
            text={narrow ? entrance.label.split(' · ')[0] : entrance.label}
            className="block whitespace-nowrap rounded-[3px] border border-[#555] bg-[#f7f6f1] px-1.5 py-0.5 text-[13px] font-bold uppercase tracking-wider text-[#2a2a2a] shadow-[0_2px_4px_rgb(0_0_0/0.35)]"
          />
        </group>
      )}
    </>
  );
}
