# Task 2: InstancedMesh Performance Optimization

## Agent: InstancedMesh Agent

## Summary
Replaced individual `<mesh>` elements with `<instancedMesh>` in 5 target modes in `/home/z/my-project/src/components/lab/scene-renderer.tsx` to improve GPU rendering performance.

## Changes Made

### 1. Import Update
- Added `useEffect` to React imports

### 2. RiemannBars (used by step3, convergence1)
- Replaced n² individual `<mesh>` elements with single `<instancedMesh>` using `BoxGeometry(1,1,1)`
- Per-instance position, scale, color via `setMatrixAt`/`setColorAt`
- Hover: `onPointerMove` + `e.instanceId` for tracking, color change + 1.06x scale on hover
- Tooltip content preserved exactly

### 3. RectApproxBars (rect_approx)
- Replaced n `<mesh>` groups with two `<instancedMesh>`: main 3D bars + floor projections
- Main bars support hover/tooltip via `onPointerMove`/`instanceId`
- Floor projections are non-interactive

### 4. PolarRiemannScene (polar2)
- Replaced nR×nTheta custom geometry wedge meshes with single `<instancedMesh>` using BoxGeometry
- Each wedge approximated as rotated/scaled box: position at (rMid·cos(θMid), h/2, rMid·sin(θMid)), rotation -θMid around Y, scale (dr, h, rMid·dTheta)
- Curved arc edges replaced with straight edges (acceptable trade-off)

### 5. ErrorAnalysisScene (convergence2)
- Replaced 2·maxN bar meshes with two `<instancedMesh>`: midpoint (emerald) + left endpoint (amber)
- Sparse n-labels kept as individual `<Text>` elements

### 6. TripleIntegralScene (triple1)
- Replaced n³ voxel meshes with single `<instancedMesh>` using BoxGeometry
- Heat map colors preserved via per-instance colors
- Hover: color change to '#c084fc' + 1.08x scale

## Lint Fixes
- Moved ref updates from render-time to `useEffect` callbacks (react-hooks/refs rule)
- Added missing `yRange` dependency to RiemannBars `handlePointerMove` useCallback

## Draw Call Reduction
| Mode | Before | After |
|------|--------|-------|
| step3 | n² meshes | 1 InstancedMesh |
| convergence1 | n² meshes | 1 InstancedMesh |
| rect_approx | 2n meshes | 2 InstancedMesh |
| polar2 | nR×nTheta meshes | 1 InstancedMesh |
| convergence2 | 2×maxN meshes | 2 InstancedMesh |
| triple1 | n³ meshes | 1 InstancedMesh |

## Lint Status
All lint checks pass with zero errors.
