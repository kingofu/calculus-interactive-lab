# Task 4: Add surface_area1 and fubini1 visualization modes

## Agent: Surface Area & Fubini Agent

## Summary
Successfully added 2 new visualization modes to the Double Integral Interactive Lab, bringing the total from 25 to 27 modes.

## Changes Made

### 1. `/home/z/my-project/src/store/lab-store.ts`
- Added `'surface_area1' | 'fubini1'` to LabMode type
- Added modeInfo entries:
  - surface_area1: title='曲面面积计算', section='曲面面积与弧长', paramLabel='曲面陡度' (0.2-2.0, default 1)
  - fubini1: title='富比尼定理', section='富比尼定理与累次积分', paramLabel='切片数量' (3-20, default 8)

### 2. `/home/z/my-project/src/lib/math-computations.ts`
- Added `surfaceAreaApprox(a, xMin, xMax, yMin, yMax, n)` - numerical surface area for z=a(x²+y²)
- Added `fubiniDoubleIntegral(n)` - computes double integral with both orders and direct method

### 3. `/home/z/my-project/src/components/lab/scene-renderer.tsx`
- Added `SurfaceAreaScene` component:
  - Heat-mapped surface (teal→amber based on gradient magnitude)
  - Normal vectors at grid points with cone arrowheads
  - Flat domain on xy-plane with teal fill
  - Connecting lines at 4 corners showing "lift"
  - Html overlay with surface area, gradient values, and color legend
- Added `FubiniScene` component:
  - Surface z = (4-x²-y²)/2 over [-2,2]×[-2,2]
  - X-type vertical slices (green) on left half (x<0)
  - Y-type horizontal slices (amber) on right half (x>0)
  - Dividing plane at x=0 (violet semi-transparent)
  - Text labels and Html overlay with iterated integral verification
- Added mode cases in SceneRenderer

### 4. `/home/z/my-project/src/components/lab/sidebar.tsx`
- Added "曲面面积" section with AreaChart icon and teal color
- Added "富比尼定理" section with GitMerge icon and slate color
- Added slate colorMap entry
- Imported AreaChart and GitMerge icons

### 5. `/home/z/my-project/src/app/page.tsx`
- Added 'surface_area1' and 'fubini1' to allModes array

### 6. `/home/z/my-project/src/components/lab/viewport.tsx`
- Added camera preset [6,8,4] fov 50 for both new modes
- Added teal gradient background for surface_area1
- Added slate-to-violet gradient background for fubini1
- Added bg-teal-500 accent for surface_area1
- Added bg-slate-500 accent for fubini1
- Fixed pre-existing lint error (setFadeIn(false) in useEffect)

### 7. `/home/z/my-project/src/hooks/use-computed-values.ts`
- Added surface_area1 case: surface area, flat area ratio
- Added fubini1 case: both iterated integral values and their difference

## Verification
- Lint passes with zero errors
- Dev server compiles successfully
