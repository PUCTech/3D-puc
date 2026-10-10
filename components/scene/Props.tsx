import { campus } from '@/lib/campus';
import { toonRamp } from './pixel';

// Small objects from the photos: lamp posts (14), the PUC-SP totem sign (CCET photo), concrete benches (tour 01).
function Lamp() {
  return (
    <>
      <mesh position-y={2.2} castShadow>
        <cylinderGeometry args={[0.07, 0.09, 4.4, 6]} />
        <meshToonMaterial color="#e9e9e4" gradientMap={toonRamp} />
      </mesh>
      <mesh position-y={4.5}>
        <boxGeometry args={[0.45, 0.35, 0.3]} />
        <meshToonMaterial color="#f4f4ef" emissive="#fff6d0" emissiveIntensity={0.3} gradientMap={toonRamp} />
      </mesh>
    </>
  );
}

function Totem() {
  return (
    <>
      <mesh position={[-0.55, 1.6, 0]} castShadow>
        <boxGeometry args={[0.18, 3.2, 0.18]} />
        <meshToonMaterial color="#2c4f9e" gradientMap={toonRamp} />
      </mesh>
      <mesh position={[0, 1.7, 0]} castShadow>
        <boxGeometry args={[1, 2.6, 0.12]} />
        <meshToonMaterial color="#d9dbdd" gradientMap={toonRamp} />
      </mesh>
      {/* crest: blue shield and red lettering band, at pixel scale */}
      <mesh position={[0, 2, 0.07]}>
        <planeGeometry args={[0.45, 0.55]} />
        <meshBasicMaterial color="#2a3f86" />
      </mesh>
      <mesh position={[0, 2.75, 0.07]}>
        <planeGeometry args={[0.7, 0.14]} />
        <meshBasicMaterial color="#b0202f" />
      </mesh>
    </>
  );
}

function Bench() {
  return (
    <>
      <mesh position-y={0.42} castShadow receiveShadow>
        <boxGeometry args={[1.8, 0.12, 0.5]} />
        <meshToonMaterial color="#cfcac0" gradientMap={toonRamp} />
      </mesh>
      {[-0.7, 0.7].map((x) => (
        <mesh key={x} position={[x, 0.18, 0]}>
          <boxGeometry args={[0.15, 0.36, 0.42]} />
          <meshToonMaterial color="#bdb8ad" gradientMap={toonRamp} />
        </mesh>
      ))}
    </>
  );
}

const MODELS = { lamp: Lamp, totem: Totem, bench: Bench };

export function Props() {
  return (
    <>
      {(campus.props ?? []).map((p, i) => {
        const Model = MODELS[p.kind];
        return (
          <group key={i} position={[p.at[0], 0, p.at[1]]} rotation-y={-p.angle}>
            <Model />
          </group>
        );
      })}
    </>
  );
}
