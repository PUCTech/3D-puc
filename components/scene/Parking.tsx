import { useMemo } from 'react';
import { Label } from './Label';
import * as THREE from 'three';

import { useTranslations } from 'next-intl';
import { campus, type Point } from '@/lib/campus';
import { mergeGeometries } from './geometry';
import { carGateTexture } from './textures';
import { useEra } from './era';

// Parking lane (user + photo 2025-10-29): concrete lane from the car gate, sloping down past the Auditório
// to the lower level and ending at Prédio 3; cars parallel-parked on both sides; a railed pedestrian ramp.
const parking = campus.parking;

// Local frame along the lane axis: d = distance from `from`, s = sideways offset.
function frame(from: Point, to: Point) {
  const len = Math.hypot(to[0] - from[0], to[1] - from[1]);
  const [ux, uz] = [(to[0] - from[0]) / len, (to[1] - from[1]) / len];
  const [sx, sz] = [-uz, ux];
  const at = (d: number, s: number): Point => [from[0] + ux * d + sx * s, from[1] + uz * d + sz * s];
  return { len, at, yaw: Math.atan2(uz, ux) };
}

// Height of a sloped strip at distance d: 0 before the slope, -depth after it.
const heightAt = (d: number, [a, b]: [number, number], depth: number) => (d <= a ? 0 : d >= b ? -depth : (-depth * (d - a)) / (b - a));

const LIFT = 0.06; // above the street paving (0.03) and the lower floor, so neither z-fights with the lane

// A solid strip following the slope: top surface sampled along its length, plus side walls and an end cap
// down to the lower floor, so nothing under it shows through.
function strip(f: ReturnType<typeof frame>, width: number, slope: [number, number], depth: number, from = 0, to = f.len, sides = true) {
  const ds = [from, ...[slope[0], slope[1]].filter((d) => d > from && d < to), to];
  const floor = -depth;
  const pos: number[] = [];
  const quad = (a: number[], b: number[], c: number[], e: number[]) => pos.push(...a, ...b, ...c, ...a, ...c, ...e);
  for (let i = 1; i < ds.length; i++) {
    const [d0, d1] = [ds[i - 1], ds[i]];
    const [y0, y1] = [heightAt(d0, slope, depth) + LIFT, heightAt(d1, slope, depth) + LIFT];
    const [l0, r0, r1, l1] = [f.at(d0, -width / 2), f.at(d0, width / 2), f.at(d1, width / 2), f.at(d1, -width / 2)];
    quad([l0[0], y0, l0[1]], [r0[0], y0, r0[1]], [r1[0], y1, r1[1]], [l1[0], y1, l1[1]]); // top
    if (sides && (y0 > floor + LIFT + 0.01 || y1 > floor + LIFT + 0.01)) {
      quad([l0[0], floor, l0[1]], [l0[0], y0, l0[1]], [l1[0], y1, l1[1]], [l1[0], floor, l1[1]]); // left wall
      quad([r0[0], y0, r0[1]], [r0[0], floor, r0[1]], [r1[0], floor, r1[1]], [r1[0], y1, r1[1]]); // right wall
    }
  }
  // Front cap where the strip starts above the floor (lower view cuts it mid-way).
  const y = heightAt(from, slope, depth) + LIFT;
  if (sides && y > floor + LIFT + 0.01) {
    const [l, r] = [f.at(from, -width / 2), f.at(from, width / 2)];
    quad([l[0], floor, l[1]], [r[0], floor, r[1]], [r[0], y, r[1]], [l[0], y, l[1]]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

// Car gate across the lane at the street (Street View, Jan 2023): square concrete pillars and a black
// sliding gate of diagonal bars. Local frame: x along the lane (inward), z across it.
const GATE_HEIGHT = 2.3;
function CarGate({ at, yaw, width }: { at: Point; yaw: number; width: number }) {
  const texture = useMemo(() => carGateTexture(), []);
  return (
    <group position={[at[0], 0, at[1]]} rotation-y={-yaw}>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[0, 1.4, side * (width / 2 + 0.35)]} castShadow>
          <boxGeometry args={[0.7, 2.8, 0.7]} />
          <meshStandardMaterial color="#e3ded3" />
        </mesh>
      ))}
      <mesh position-y={GATE_HEIGHT / 2 + 0.05} rotation-y={Math.PI / 2}>
        <planeGeometry args={[width, GATE_HEIGHT]} />
        <meshBasicMaterial map={texture} alphaTest={0.5} transparent side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function Car({ color }: { color: string }) {
  // ~4.3 × 1.8 m hatchback/SUV, low-poly: body, cabin, dark glass band, 4 wheels.
  return (
    <group>
      <mesh position-y={0.55} castShadow>
        <boxGeometry args={[4.3, 0.7, 1.8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[-0.25, 1.15, 0]} castShadow>
        <boxGeometry args={[2.3, 0.55, 1.6]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[-0.25, 1.17, 0]}>
        <boxGeometry args={[2.34, 0.34, 1.64]} />
        <meshStandardMaterial color="#2b3440" />
      </mesh>
      {[-1.35, 1.35].flatMap((x) =>
        [-0.85, 0.85].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.32, z]} rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[0.32, 0.32, 0.22, 10]} />
            <meshStandardMaterial color="#141416" />
          </mesh>
        )),
      )}
    </group>
  );
}

export function Parking({ lower }: { lower: boolean }) {
  const t = useTranslations('map');
  const era = useEra();
  const built = useMemo(() => {
    if (!parking) return null;
    const f = frame(parking.from, parking.to);
    const slope = parking.slope as [number, number];
    const from = lower ? slope[0] : 0; // lower view: just the ramp down and the lower stretch
    const lane = strip(f, parking.width, slope, parking.depth, from);
    // Painted bays: thin white lines across each parking row every 5.6 m, following the slope.
    const lines: THREE.BufferGeometry[] = [];
    for (const side of [-1, 1])
      for (let d = 3.2; d < f.len; d += 5.6) {
        if (d < from) continue;
        const [x, z] = f.at(d, side * (parking.width / 2 - 1.1));
        const g = new THREE.PlaneGeometry(0.1, 2.1);
        g.rotateX(-Math.PI / 2);
        g.rotateY(-f.yaw);
        g.translate(x, heightAt(d, slope, parking.depth) + LIFT + 0.02, z);
        lines.push(g);
      }
    const cars = parking.cars
      .filter((c) => c.d >= from)
      .map((c) => {
        const d = c.d;
        const [x, z] = f.at(d, c.side * (parking.width / 2 - 1.15));
        const pitch = Math.atan2(heightAt(d + 1, slope, parking.depth) - heightAt(d - 1, slope, parking.depth), 2);
        return { x, z, y: heightAt(d, slope, parking.depth), pitch, color: c.color };
      });
    const accessible = (parking.accessible ?? []).map((a) => {
      const [x, z] = f.at(a.d, a.side * (parking.width / 2 - 1.15));
      return { x, z, y: heightAt(a.d, slope, parking.depth) };
    });
    // Railed pedestrian ramp down to the lower level.
    const r = parking.ramp ? frame(parking.ramp.from, parking.ramp.to) : null;
    const ramp = r && parking.ramp ? strip(r, parking.ramp.width, [0, r.len], parking.depth) : null;
    const rails: THREE.BufferGeometry[] = [];
    if (r && parking.ramp)
      for (const side of [-1, 1])
        for (let d = 0; d <= r.len; d += 1.5) {
          const [x, z] = r.at(d, side * (parking.ramp.width / 2));
          const g = new THREE.BoxGeometry(0.06, 1, 0.06);
          g.translate(x, heightAt(d, [0, r.len], parking.depth) + LIFT + 0.5, z);
          rails.push(g);
        }
    const handrails =
      r && parking.ramp
        ? [-1, 1].map((side) => {
            const a = r.at(0, side * (parking.ramp!.width / 2));
            const b = r.at(r.len, side * (parking.ramp!.width / 2));
            return new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(a[0], 1 + LIFT, a[1]), new THREE.Vector3(b[0], 1 + LIFT - parking.depth, b[1])]);
          })
        : [];
    return {
      f,
      lane,
      lines: lines.length ? mergeGeometries(lines) : null,
      cars,
      accessible,
      ramp,
      rails: rails.length ? mergeGeometries(rails) : null,
      handrails,
      label: f.at((slope[0] + slope[1]) / 2, 0),
      labelY: heightAt((slope[0] + slope[1]) / 2, slope, parking.depth),
    };
  }, [lower]);
  if (!built || !parking) return null;
  return (
    <group>
      {!lower && <CarGate at={parking.from} yaw={built.f.yaw} width={parking.width} />}
      <mesh geometry={built.lane} receiveShadow>
        <meshLambertMaterial color="#d6d1c5" side={THREE.DoubleSide} />
      </mesh>
      {built.lines && (
        <mesh geometry={built.lines}>
          <meshBasicMaterial color="#f4f1e6" side={THREE.DoubleSide} />
        </mesh>
      )}
      {era === 'hoje' && built.accessible.map((a, i) => (
        <mesh key={i} position={[a.x, a.y + LIFT + 0.02, a.z]} rotation={[-Math.PI / 2, 0, -built.f.yaw]}>
          <planeGeometry args={[4.6, 2]} />
          <meshBasicMaterial color="#2f6db5" side={THREE.DoubleSide} />
        </mesh>
      ))}
      {/* 1943: no cars or accessible bays (both modern) */}
      {era === 'hoje' && built.cars.map((c, i) => (
        <group key={i} position={[c.x, c.y + LIFT, c.z]} rotation={[0, -built.f.yaw, c.pitch]}>
          <Car color={c.color} />
        </group>
      ))}
      {built.ramp && (
        <mesh geometry={built.ramp} receiveShadow>
          <meshLambertMaterial color="#bdb8ad" side={THREE.DoubleSide} />
        </mesh>
      )}
      {built.rails && (
        <mesh geometry={built.rails}>
          <meshStandardMaterial color="#f4f4f0" />
        </mesh>
      )}
      {built.handrails.map((g, i) => (
        <lineSegments key={i} geometry={g}>
          <lineBasicMaterial color="#f4f4f0" />
        </lineSegments>
      ))}
      {era === 'hoje' && <Label position={[built.label[0], built.labelY + 2.5, built.label[1]]} text={t('parking')} badge="P" className="map-plate parking-plate" />}
    </group>
  );
}
