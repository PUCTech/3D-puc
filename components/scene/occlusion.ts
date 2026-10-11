import * as THREE from 'three';
import { ISO_AZIMUTH, ISO_POLAR } from './CameraRig';

// Hides whole objects (city blocks, trees) that stand between the fixed iso camera and the selected building.
// Each vertex carries its object's bounds (aObj = center x, center z, radius, height). The vertex shader drops the
// object when its screen box overlaps the selection's and the selection's footprint lies behind it (looking past
// the object along the camera's ground direction, within the object's width).

const toCamera = new THREE.Vector3().setFromSphericalCoords(1, ISO_POLAR, ISO_AZIMUTH);
const FWD = toCamera.clone().negate();
const RIGHT = new THREE.Vector3().crossVectors(FWD, new THREE.Vector3(0, 1, 0)).normalize();
const UP = new THREE.Vector3().crossVectors(RIGHT, FWD).normalize();
const FWD_GROUND = new THREE.Vector3(FWD.x, 0, FWD.z).normalize();
const FLAT = Math.cos(ISO_POLAR); // a ground circle of radius r spans r·FLAT vertically on screen
const MAX_POLY = 32;

// Shared by every occluding material, so one update reaches them all.
const uniforms = {
  uOccOn: { value: 0 },
  uOccRect: { value: new THREE.Vector4() }, // screen-plane xmin, xmax, ymin, ymax of the selection
  uOccPoly: { value: Array.from({ length: MAX_POLY }, () => new THREE.Vector2()) }, // footprint as (screen x, ground depth)
  uOccN: { value: 0 },
  uOccRight: { value: RIGHT },
  uOccUp: { value: UP },
  uOccFwd: { value: FWD_GROUND },
};

// Selection as its footprint at base and top heights; null turns hiding off.
export function setOcclusionTarget(footprint: [number, number][] | null, base = 0, top = 0) {
  uniforms.uOccOn.value = footprint ? 1 : 0;
  if (!footprint) return;
  const r = uniforms.uOccRect.value.set(Infinity, -Infinity, Infinity, -Infinity);
  for (const [x, z] of footprint)
    for (const y of [base, top]) {
      const p = new THREE.Vector3(x, y, z);
      const sx = p.dot(RIGHT), sy = p.dot(UP);
      r.set(Math.min(r.x, sx), Math.max(r.y, sx), Math.min(r.z, sy), Math.max(r.w, sy));
    }
  const ring = footprint.slice(0, MAX_POLY);
  ring.forEach(([x, z], i) => uniforms.uOccPoly.value[i].set(x * RIGHT.x + z * RIGHT.z, x * FWD_GROUND.x + z * FWD_GROUND.z));
  uniforms.uOccN.value = ring.length;
}

// Writes the object bounds onto every vertex of g.
export function tagObject(g: THREE.BufferGeometry, x: number, z: number, radius: number, height: number) {
  const n = g.getAttribute('position').count;
  const a = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) a.set([x, z, radius, height], i * 4);
  g.setAttribute('aObj', new THREE.BufferAttribute(a, 4));
  return g;
}

// onBeforeCompile for materials whose geometry is tagged with aObj.
export function hideOccluders(shader: THREE.WebGLProgramParametersWithUniforms) {
  Object.assign(shader.uniforms, uniforms);
  shader.vertexShader = shader.vertexShader
    .replace(
      '#include <common>',
      `#include <common>
      attribute vec4 aObj;
      uniform float uOccOn;
      uniform vec4 uOccRect;
      uniform vec2 uOccPoly[${MAX_POLY}];
      uniform int uOccN;
      uniform vec3 uOccRight, uOccUp, uOccFwd;
      varying float vOcc;`,
    )
    .replace(
      '#include <project_vertex>',
      `#include <project_vertex>
      vec3 occO = (modelMatrix * vec4(aObj.x, 0.0, aObj.y, 1.0)).xyz;
      float occX = dot(occO, uOccRight);
      float occY0 = dot(occO, uOccUp), occY1 = dot(occO + vec3(0.0, aObj.w, 0.0), uOccUp);
      float occR = aObj.z, occRy = aObj.z * ${FLAT.toFixed(3)};
      bool occOverlap = occX + occR > uOccRect.x && occX - occR < uOccRect.y
        && max(occY0, occY1) + occRy > uOccRect.z && min(occY0, occY1) - occRy < uOccRect.w;
      // Farthest footprint depth inside the object's screen-x strip: the object is in front if it's nearer than that.
      float occFar = -1e9;
      for (int i = 0; i < ${MAX_POLY}; i++) {
        if (i >= uOccN) break;
        vec2 a = uOccPoly[i], b = uOccPoly[i + 1 < uOccN ? i + 1 : 0];
        float lo = max(min(a.x, b.x), occX - occR), hi = min(max(a.x, b.x), occX + occR);
        if (lo > hi) continue;
        float dx = b.x - a.x;
        float d = abs(dx) < 1e-4 ? max(a.y, b.y) : max(mix(a.y, b.y, (lo - a.x) / dx), mix(a.y, b.y, (hi - a.x) / dx));
        occFar = max(occFar, d);
      }
      vOcc = uOccOn > 0.5 && occOverlap && dot(occO, uOccFwd) < occFar ? 1.0 : 0.0;`,
    );
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', '#include <common>\nvarying float vOcc;')
    .replace('void main() {', 'void main() {\n  if (vOcc > 0.5) discard;');
}
