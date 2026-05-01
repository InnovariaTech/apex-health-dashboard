import { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, PerspectiveCamera, Html, Environment, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useIsMobile } from '@/hooks/use-mobile';

import modelPath from './wireframe_man.glb?url';

type ScanState = 'idle' | 'scanning-down' | 'scanning-up' | 'calculating' | 'complete';

const DEFAULT_COLOR = '#0088ff';

interface BodyModel3DProps {
  scanState?: ScanState;
  className?: string;
  color?: string;
  progress?: number;
}

interface ScanRingProps {
  progress: number;
  scanRange: number;
  yOffset: number;
  color: string;
}

const ScanRing = ({ progress, scanRange, yOffset, color }: ScanRingProps) => {
  const isMobile = useIsMobile();

  const adjustedYOffset = isMobile ? yOffset + 0.7 : yOffset;
  const normalizedProgress = progress <= 50
    ? (progress / 50)
    : 2 - (progress / 50);

  const yPosition = adjustedYOffset + (scanRange / 2) - normalizedProgress * scanRange;
  const trailHeight = normalizedProgress * scanRange;
  const ringRadius = 1.32;

  return (
    <group position={[0, 0, 0]}>
      {normalizedProgress > 0.01 && (
        <mesh position={[0, yPosition + trailHeight / 2, 0]}>
          <cylinderGeometry args={[ringRadius, ringRadius, trailHeight, 64, 1, true]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.8}
            transparent
            opacity={0.15}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {normalizedProgress > 0.01 && (
        <mesh position={[0, yPosition + trailHeight / 2, 0]}>
          <cylinderGeometry args={[ringRadius - 0.3, ringRadius - 0.3, trailHeight, 64, 1, true]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={1.2}
            transparent
            opacity={0.1}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      <mesh position={[0, yPosition, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[ringRadius, 0.02, 16, 100]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={3}
          transparent
          opacity={0.9}
        />
      </mesh>

      <mesh position={[0, yPosition, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[ringRadius, 0.1, 16, 100]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.5}
          transparent
          opacity={0.3}
        />
      </mesh>
    </group>
  );
};

interface HumanModelProps {
  scanState: ScanState;
  progress: number;
  color: string;
}

function HumanModel({ scanState, progress, color }: HumanModelProps) {
  const modelRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(modelPath);
  const [computedScale, setComputedScale] = useState(1.8);
  const isMobile = useIsMobile();

  const xPosition = 0;
  const yPosition = isMobile ? -2.0 : -3.24;

  useEffect(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    if (maxDim > 0) {
      setComputedScale(0.72);
    }

    scene.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(color),
          metalness: 0.1,
          roughness: 0.6,
          side: THREE.DoubleSide,
        });
      }
    });
  }, [scene, color]);

  useEffect(() => {
    if (modelRef.current) {
      modelRef.current.rotation.y = 0;
    }
  }, []);

  useFrame(() => {
    if (!modelRef.current) return;

    const isScanning = scanState === 'scanning-down' || scanState === 'scanning-up';

    if (isScanning) {
      modelRef.current.rotation.y = (progress / 100) * Math.PI * 2;
    } else {
      modelRef.current.rotation.y = 0;
    }
  });

  return (
    <group ref={modelRef} position={[xPosition, yPosition, 0]}>
      <primitive object={scene} scale={computedScale} />
    </group>
  );
}

interface SceneProps {
  scanState: ScanState;
  progress: number;
  color: string;
}

function Scene({ scanState, progress, color }: SceneProps) {
  const isScanning = scanState === 'scanning-down' || scanState === 'scanning-up';

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <directionalLight position={[-5, -5, -5]} intensity={0.3} />

      <PerspectiveCamera makeDefault position={[0, 0, 12]} fov={45} />

      <Suspense fallback={
        <Html center>
          <div className="text-muted-foreground text-sm">Loading 3D model...</div>
        </Html>
      }>
        <HumanModel scanState={scanState} progress={progress} color={color} />

        {isScanning && <ScanRing progress={progress} scanRange={6.4} yOffset={0.54} color={color} />}

        <Environment preset="studio" />
      </Suspense>

      <OrbitControls
        enabled={scanState === 'idle' || scanState === 'complete'}
        enablePan={false}
        enableZoom={false}
        enableRotate={true}
        target={[0, 0, 0]}
      />
    </>
  );
}

export function BodyModel3D({
  scanState = 'idle',
  className,
  progress = 0,
  color = DEFAULT_COLOR,
}: BodyModel3DProps) {
  const [webglSupported, setWebglSupported] = useState(true);
  const [modelError, setModelError] = useState(false);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      setWebglSupported(!!gl);
    } catch {
      setWebglSupported(false);
    }
  }, []);

  const brightness = (scanState === 'scanning-down' ||
                     scanState === 'scanning-up' ||
                     scanState === 'calculating') ? 1.1 : 1.0;

  if (!webglSupported || modelError) {
    return (
      <div
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color,
          fontSize: 12,
          opacity: 0.7,
        }}
      >
        3D view unavailable
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        width: '100%',
        height: '100%',
        filter: `brightness(${brightness})`,
        transition: 'filter 0.3s ease-in-out',
      }}
    >
      <Canvas
        gl={{
          alpha: true,
          antialias: true,
          preserveDrawingBuffer: true,
          powerPreference: 'default',
        }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            setModelError(true);
          });
        }}
        onError={() => setModelError(true)}
        style={{ background: 'transparent' }}
      >
        <Scene scanState={scanState} progress={progress} color={color} />
      </Canvas>
    </div>
  );
}

useGLTF.preload(modelPath);
