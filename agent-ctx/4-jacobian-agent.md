# Task 4: Add Jacobian/Change of Variables Mode

## Work Record

### Changes Made

1. **`src/store/lab-store.ts`** - Added `'jacobian1'` to `LabMode` type union and added full mode info entry with title, section, math formula, description, and dual parameter config (变换缩放 0.3-2.0, 旋转角度 0-1.57).

2. **`src/components/lab/scene-renderer.tsx`** - Added `JacobianScene` component before the `SceneRenderer` export. The scene shows:
   - Regular grid (green, uv-space) 
   - Transformed grid (amber, xy-space) using x=a·u·cos(θ)-a·v·sin(θ), y=a·u·sin(θ)+a·v·cos(θ)
   - Original area element (green square) and deformed area element (amber parallelogram)
   - Html overlay with transformation formula, Jacobian value J=a², and area magnification
   - Added `{mode === 'jacobian1' && <JacobianScene />}` case in SceneRenderer

3. **`src/components/lab/sidebar.tsx`** - Added `RefreshCw` import, new "变量代换" section with lime color, and lime entry in colorMap.

4. **`src/app/page.tsx`** - Added `'jacobian1'` to allModes array after `'triple1'`.

5. **`src/components/lab/viewport.tsx`** - Added camera preset `[6, 8, 4]` fov 50, lime gradient background, and lime accent color for jacobian1 mode.

6. **`src/hooks/use-computed-values.ts`** - Added jacobian1 case computing J=a² with exact value display.

### Verification
- `bun run lint` passes with zero errors
- Dev server compiles successfully
