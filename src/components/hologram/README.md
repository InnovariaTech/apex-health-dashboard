# Hologram

A self-contained 3D holographic-person visualization with a scan animation. Drop it into any React + Vite project.

## What's in this folder

| File | Purpose |
| --- | --- |
| `BodyModel3D.tsx` | The 3D wireframe person, blue glow material, scan-ring effect, auto-rotation during scan, WebGL fallback to a static image |
| `useHealthScanState.ts` | State machine that drives the animation: `idle → scanning-down → scanning-up → calculating → complete` with a 0–100 progress value |
| `wireframe_man.glb` | The 3D model asset (~3.5 MB) |
| `index.ts` | Barrel export |

## Dependencies

Install in the consuming project:

```bash
npm install react three @react-three/fiber @react-three/drei
```

Versions this was built against:

```json
{
  "react": "^18.3.1",
  "three": "^0.181.2",
  "@react-three/fiber": "^8.18.0",
  "@react-three/drei": "^9.122.0"
}
```

Build tool: **Vite** is required because `BodyModel3D.tsx` imports the GLB via `import modelPath from './wireframe_man.glb?url'`. If you use Webpack/Next.js/etc., replace that import with whatever asset-URL convention your bundler uses (e.g. `new URL('./wireframe_man.glb', import.meta.url).href`, or move the GLB to `/public/` and reference it by path).

## External hook to vendor

`BodyModel3D.tsx` imports `useIsMobile` from `@/hooks/use-mobile`. Either copy this 15-line hook into your project, or replace the import. Source:

```tsx
// hooks/use-mobile.ts
import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
```

## Path alias

The `@/` alias in the imports points to `src/` (configured in `vite.config.ts` + `tsconfig.json`). If your project doesn't have it, either set it up or rewrite the imports as relative paths.

## Drop-in install

1. Copy this `hologram/` folder into `src/components/` of the target project.
2. Copy `use-mobile.ts` into `src/hooks/` (or refactor the import).
3. Make sure the four npm packages above are installed.
4. Done.

## Usage

```tsx
import { useState } from 'react';
import { BodyModel3D, useHealthScanState } from '@/components/hologram';

export function MyPage() {
  const { scanState, progress, startScan, resetScan, completeScan } = useHealthScanState();
  const [done, setDone] = useState(false);

  // After the scan animation hits "calculating", do your work, then call completeScan().
  // For a pure-visual demo:
  if (scanState === 'calculating' && !done) {
    setDone(true);
    setTimeout(completeScan, 500);
  }

  return (
    <div className="relative w-full h-[800px]">
      <BodyModel3D
        className="w-full h-full"
        scanState={scanState}
        progress={progress}
      />

      <button
        onClick={scanState === 'idle' ? startScan : resetScan}
        className="absolute top-4 right-4"
      >
        {scanState === 'idle' ? 'Run Scan' : 'Cancel'}
      </button>
    </div>
  );
}
```

## API

### `<BodyModel3D />`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `scanState` | `'idle' \| 'scanning-down' \| 'scanning-up' \| 'calculating' \| 'complete'` | `'idle'` | Drives rotation + scan-ring visibility |
| `progress` | `number` (0–100) | `0` | Drives the scan-ring vertical position and the model's Y rotation |
| `className` | `string` | — | Sizing wrapper class — set width/height here |

Behavior:
- **Idle / complete**: model is static, `OrbitControls` enabled (drag to rotate).
- **Scanning**: `OrbitControls` disabled, model rotates one full turn synced to `progress` (0–100% → 0–360°), a glowing blue scan ring sweeps down (0–50%) then back up (50–100%).
- **Calculating**: model returns to front-facing, scan ring hidden.
- Auto-falls back to a static `/assets/body-male.png` image if WebGL is unavailable or the context is lost. Replace that path or asset to match your project.

### `useHealthScanState()`

Returns:

| Field | Type | Description |
| --- | --- | --- |
| `scanState` | `ScanState` | Current phase |
| `progress` | `number` | 0–100 |
| `startScan()` | `() => void` | Kick off scanning-down → scanning-up (~4.8s total) → calculating |
| `resetScan()` | `() => void` | Force back to `idle`, progress 0 |
| `triggerCalculating()` | `() => void` | Jump straight to `calculating` |
| `completeScan()` | `() => void` | Mark done, return to `idle` (consumer tracks completion) |

The hook auto-runs the visual phases. `calculating` is the hand-off point — that's where you do real async work, then call `completeScan()`. If your work fails, call `resetScan()`.

## Tweaking the look

- **Color**: search `#0088ff` in `BodyModel3D.tsx` (model material + scan-ring glow).
- **Scale / position**: `computedScale` (0.72), `xPosition` / `yPosition` constants in `HumanModel`.
- **Scan ring radius / glow**: `ringRadius` and the `meshStandardMaterial` props in `ScanRing`.
- **Scan duration**: the `2400` ms values in `useHealthScanState.ts` (one for each half).
- **Camera**: `<PerspectiveCamera position={[0, 0, 12]} fov={45} />` in `Scene`.

## Replacing the model

The GLB is loaded with `useGLTF` from `@react-three/drei`. Any rigged or static GLB will work — drop yours in next to `wireframe_man.glb`, update the import, and adjust `computedScale` + `yPosition` to fit. The component recolors every mesh with a `MeshStandardMaterial`, so the source model's textures are ignored by design.
