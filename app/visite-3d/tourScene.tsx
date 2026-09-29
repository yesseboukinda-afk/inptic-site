'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Html, OrbitControls, useGLTF, useProgress } from '@react-three/drei';
import { Suspense, useEffect, useMemo, useRef } from 'react';
import type { ComponentRef, RefObject } from 'react';
import * as THREE from 'three';
import { zones } from './zones';

const MODEL_URL = '/models/colorz-city.glb';
type Controls = ComponentRef<typeof OrbitControls>;

function Model() {
  const { scene } = useGLTF(MODEL_URL);

  // Normalise à ~20 unités et centre la ville sur l'origine
  const { scale, position } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const s = 20 / Math.max(size.x, size.y, size.z);
    return { scale: s, position: center.multiplyScalar(-s) };
  }, [scene]);

  return (
    <primitive
      object={scene}
      scale={scale}
      position={position}
      onClick={(e: { stopPropagation: () => void; point: THREE.Vector3 }) => {
        e.stopPropagation();
        // À supprimer une fois les zones placées
        console.log('point:', e.point.toArray().map((n) => +n.toFixed(2)));
      }}
    />
  );
}

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <span className="text-sm font-semibold text-white">{Math.round(progress)} %</span>
    </Html>
  );
}

// Vol de caméra vers la zone choisie, interrompu dès que l'utilisateur reprend la main
function CameraRig({
  activeZone,
  controlsRef,
  flying,
}: {
  activeZone: string;
  controlsRef: RefObject<Controls | null>;
  flying: RefObject<boolean>;
}) {
  useFrame((state, delta) => {
    const controls = controlsRef.current;
    if (!flying.current || !controls) return;
    const zone = zones.find((z) => z.id === activeZone);
    if (!zone) return;

    const camTarget = new THREE.Vector3(...zone.camera);
    const lookTarget = new THREE.Vector3(...zone.point);
    const k = 1 - Math.exp(-4 * delta);
    state.camera.position.lerp(camTarget, k);
    controls.target.lerp(lookTarget, k);
    controls.update();
    if (state.camera.position.distanceTo(camTarget) < 0.05) flying.current = false;
  });
  return null;
}

type Props = {
  activeZone: string;
  onZoneSelect: (id: string) => void;
  labels: Record<string, string>;
};

export default function TourScene({ activeZone, onZoneSelect, labels }: Props) {
  const controlsRef = useRef<Controls>(null);
  const flying = useRef(false);
  const previousZone = useRef(activeZone);

  // Ne vole que lorsque la zone change réellement (pas au montage)
  useEffect(() => {
    if (previousZone.current !== activeZone) {
      previousZone.current = activeZone;
      flying.current = true;
    }
  }, [activeZone]);

  return (
    <Canvas dpr={[1, 2]} camera={{ position: [20, 14, 20], fov: 45, near: 0.1, far: 200 }}>
      <hemisphereLight args={['#ffffff', '#445566', 1.1]} />
      <directionalLight position={[10, 15, 5]} intensity={1.6} />

      <Suspense fallback={<Loader />}>
        <Model />
      </Suspense>

      {zones.map((z) => (
        <Html key={z.id} position={z.point} center zIndexRange={[10, 0]}>
          <button
            type="button"
            aria-label={labels[z.id]}
            aria-pressed={activeZone === z.id}
            onClick={() => onZoneSelect(z.id)}
            className={`h-5 w-5 rounded-full border-2 border-white transition ${
              activeZone === z.id ? 'scale-150 bg-amber-300' : 'bg-cyan-300'
            }`}
          />
        </Html>
      ))}

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        minDistance={4}
        maxDistance={45}
        maxPolarAngle={Math.PI / 2.05}
        onStart={() => {
          flying.current = false;
        }}
      />
      <CameraRig activeZone={activeZone} controlsRef={controlsRef} flying={flying} />
    </Canvas>
  );
}

useGLTF.preload(MODEL_URL);