import { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, PerspectiveCamera, Environment, OrbitControls } from '@react-three/drei';
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

function MedicalScanLoader({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      <style>{`
        @keyframes hologram-scan {
          0%   { transform: translateY(-120%); opacity: 0; }
          15%  { opacity: 1; }
          85%  { opacity: 1; }
          100% { transform: translateY(120%); opacity: 0; }
        }
        @keyframes hologram-grid {
          0%, 100% { opacity: 0.18; }
          50%      { opacity: 0.32; }
        }
        @keyframes hologram-pulse {
          0%, 100% { transform: translate(-50%, 0) scale(1);    opacity: 0.75; }
          50%      { transform: translate(-50%, 0) scale(1.06); opacity: 1; }
        }
        @keyframes hologram-dash {
          to { stroke-dashoffset: -40; }
        }
        @keyframes hologram-dot {
          0%, 100% { opacity: 0.4; }
          50%      { opacity: 1; }
        }
      `}</style>

      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            `linear-gradient(${color}33 1px, transparent 1px),
             linear-gradient(90deg, ${color}33 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
          maskImage: 'radial-gradient(ellipse at center, black 35%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 35%, transparent 80%)',
          animation: 'hologram-grid 2.4s ease-in-out infinite',
        }}
      />

      <svg
        viewBox="0 0 100 240"
        className="h-[78%] relative z-10"
        fill="none"
        preserveAspectRatio="xMidYMid meet"
        style={{ filter: `drop-shadow(0 0 6px ${color}66)` }}
      >
        <g
          stroke={color}
          strokeWidth="0.9"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="3 2"
          opacity="0.55"
          style={{ animation: 'hologram-dash 4s linear infinite' }}
        >
          <circle cx="50" cy="28" r="13" />
          <path d="M 32 50 L 68 50 L 76 96 L 70 146 L 58 146 L 56 176 L 44 176 L 42 146 L 30 146 L 24 96 Z" />
          <path d="M 32 50 L 16 108 L 20 132" />
          <path d="M 68 50 L 84 108 L 80 132" />
          <path d="M 44 176 L 40 220 L 38 232" />
          <path d="M 56 176 L 60 220 L 62 232" />
        </g>
      </svg>

      <div
        className="absolute left-[8%] right-[8%] h-[2px] z-20"
        style={{
          top: '50%',
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          boxShadow: `0 0 16px ${color}, 0 0 32px ${color}88`,
          animation: 'hologram-scan 2.4s ease-in-out infinite',
        }}
      />

      <div
        className="absolute bottom-5 left-1/2 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-sm"
        style={{
          background: `${color}14`,
          border: `1px solid ${color}40`,
          animation: 'hologram-pulse 1.6s ease-in-out infinite',
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{
            background: color,
            boxShadow: `0 0 8px ${color}`,
            animation: 'hologram-dot 1.2s ease-in-out infinite',
          }}
        />
        <span
          className="text-[10px] font-mono uppercase tracking-[0.18em]"
          style={{ color }}
        >
          Calibrating hologram
        </span>
      </div>
    </div>
  );
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
  onReady?: (() => void) | undefined;
}

function HumanModel({ scanState, progress, color, onReady }: HumanModelProps) {
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

    onReady?.();
  }, [scene, color, onReady]);

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
  onModelReady?: (() => void) | undefined;
}

function Scene({ scanState, progress, color, onModelReady }: SceneProps) {
  const isScanning = scanState === 'scanning-down' || scanState === 'scanning-up';

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <directionalLight position={[-5, -5, -5]} intensity={0.3} />

      <PerspectiveCamera makeDefault position={[0, 0, 12]} fov={45} />

      <Suspense fallback={null}>
        <HumanModel scanState={scanState} progress={progress} color={color} onReady={onModelReady} />

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
  const [modelReady, setModelReady] = useState(false);

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
        position: 'relative',
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
        <Scene
          scanState={scanState}
          progress={progress}
          color={color}
          onModelReady={() => setModelReady(true)}
        />
      </Canvas>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: modelReady ? 0 : 1,
          transition: 'opacity 450ms ease-out',
          pointerEvents: 'none',
        }}
      >
        <MedicalScanLoader color={color} />
      </div>
    </div>
  );
}

useGLTF.preload(modelPath);
