# Task ID: 2 - SVG 2D Viewport Agent

## Task
Create `/home/z/my-project/src/components/lab/viewport-2d.tsx` — a pure SVG-based 2D rendering engine to replace R3F Canvas with orthographic camera for 2D modes.

## Work Log

### File Created
- `/home/z/my-project/src/components/lab/viewport-2d.tsx` (complete, ~880 lines)

### Components Implemented

1. **`Viewport2D`** (main export)
   - Full-width, full-height container div with mode-dependent gradient background
   - SVG element filling the container with `preserveAspectRatio="xMidYMid meet"`
   - Scene2D component rendered inside SVG
   - DraggableOverlay2D positioned absolutely on top
   - Mouse event handlers: pan (left drag), zoom (wheel), reset (double-click)
   - Touch support for mobile panning
   - Mode indicator in top-left corner with "2D" badge
   - Top-right buttons: reset view, fullscreen toggle, screenshot
   - Bottom-right controls hint "拖拽平移 · 滚轮缩放"
   - Bottom-left zoom level indicator "XXpx/u"
   - ARIA labels for accessibility
   - Mode transition animation overlay (matches 3D viewport style)
   - Gradient corner accents (matches 3D viewport style)

2. **`DraggableOverlay2D`** (exported)
   - Pure HTML/CSS div with `position: absolute`
   - Mouse drag handlers (mousedown/mousemove/mouseup) for repositioning
   - Green drag handle bar at top (`w-10 h-1 rounded-full bg-emerald-500/60`)
   - Visual feedback: shadow-xl + emerald ring while dragging
   - Key-based reset: parent passes `key={mode}` to force remount on mode change (avoids setState-in-effect lint error)
   - Backdrop blur, border, rounded corners

3. **`SVGAxes`** (exported)
   - SVG lines for x-axis and y-axis with arrow heads (polygon elements)
   - Tick marks with integer labels
   - Subtle grid lines (opacity 0.08)
   - Origin label "O"
   - Axis labels "x" and "y" (italic)
   - Props: `xRange`, `yRange`, `scale`, `offsetX`, `offsetY`

4. **`Scene2D`** (exported)
   - Placeholder component that renders `SVGAxes` for all modes
   - Switch on mode ready for future per-mode 2D scenes
   - Props: `mode`, `scale`, `offsetX`, `offsetY`

### Coordinate System
- `scale` = 50 pixels per math unit (adjustable with zoom, range 10-500)
- `offsetX`, `offsetY` = pan offset in pixels (initialized to center of viewport)
- Math to SVG: `svgX = mathX * scale + offsetX`, `svgY = -mathY * scale + offsetY`
- SVG to Math: `mathX = (svgX - offsetX) / scale`, `mathY = -(svgY - offsetY) / scale`
- Zoom keeps the mouse point fixed (calculates new offset after scale change)

### State Management
- React useState for: `offsetX`, `offsetY`, `scale`
- Pan: mousemove while dragging updates offsetX/Y
- Zoom: wheel adjusts scale and repositions to keep mouse point fixed
- Reset: double-click or reset button resets to default (center + scale=50)
- Touch: single-touch pan support

### Styling
- Same gradient backgrounds as 3D viewport (`getBackgroundForMode` copied from viewport.tsx)
- Same accent colors (`getModeAccentColor` copied from viewport.tsx)
- Mode indicator with "2D" badge
- Smooth transitions, backdrop blur, shadow effects
- Responsive design

### Key Design Decisions
1. **No R3F/drei/three imports** — Pure SVG + HTML/CSS
2. **key={mode} pattern** for DraggableOverlay2D reset — avoids setState-in-effect lint error
3. **Screenshot via SVG serialization** — XMLSerializer → Blob → Canvas → PNG (instead of WebGL canvas.toDataURL)
4. **SVG uses no viewBox** — Instead, all coordinates are in pixel space with manual transform via offset/scale props passed down to child components

### Lint
- Zero errors, zero warnings
