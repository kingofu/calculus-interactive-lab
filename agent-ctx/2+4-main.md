# Task 2+4 - Green's Theorem Mode + Collapsible Sidebar

## Work Completed

### Task A: Green's Theorem Mode (green1)

1. **Store update** (`src/store/lab-store.ts`):
   - `'green1'` added to LabMode type
   - green1 modeInfo entry added with title '格林公式', paramLabel '区域变形' (0.3-2.0, step 0.1, default 1)

2. **3D Scene** (`src/components/lab/scene-renderer.tsx`):
   - Added `GreenScene` component before `SceneRenderer`
   - Boundary curve C: parametric deformed ellipse with 128-point resolution
   - Filled region D: triangulated mesh with 64-point fan
   - Vector field arrows: 24 boundary (amber) + 12 interior (green), P=-y/2, Q=x/2
   - Direction arrows: 8 red cone markers for counterclockwise orientation
   - Surface at z=1 showing ∂Q/∂x - ∂P/∂y = 1
   - Html overlay with numerical values and verification
   - Added `{mode === 'green1' && <GreenScene />}` in SceneRenderer

3. **Sidebar** (`src/components/lab/sidebar.tsx`):
   - Added "格林公式" section with Waypoints icon and red color
   - Added red colorMap entry

4. **Page** (`src/app/page.tsx`):
   - Added 'green1' to allModes array

5. **Viewport** (`src/components/lab/viewport.tsx`):
   - Camera preset: [6, 8, 4], fov 50
   - Background: from-red-50 to-orange-50
   - Accent: bg-red-500

6. **Computed values** (`src/hooks/use-computed-values.ts`):
   - green1 case: area computed via ∮ x dy (200-step numerical integration)

### Task B: Collapsible Sidebar Sections

1. **State management**: `collapsedSections` Set in local component state
2. **Toggle**: Clicking section header toggles its title in the Set
3. **Chevron icons**: ChevronDown (expanded) / ChevronRight (collapsed)
4. **Auto-expand**: Sections containing the active mode always expand
5. **Smooth animation**: `max-h-96 opacity-100` → `max-h-0 opacity-0` with 200ms transition

### Verification
- `bun run lint` passes with zero errors
- Dev server compiles successfully
