'use client'

import { useLabStore } from '@/store/lab-store'

/**
 * SceneTooltip - An HTML overlay that appears when hovering over 3D objects.
 * Positioned absolutely over the canvas using screen coordinates from the Zustand store.
 * Uses pointer-events: none so it doesn't interfere with 3D interactions.
 * Smooth fade-in/fade-out transitions via CSS only (no state-in-effect).
 */
export function SceneTooltip() {
  const { tooltip } = useLabStore()

  if (!tooltip) return null

  // Offset the tooltip slightly from cursor so it doesn't flicker
  const offsetX = 16
  const offsetY = 16

  // Clamp position so tooltip stays within viewport
  // Use a large fallback to avoid hydration mismatch (tooltip will reposition on client)
  const maxX = typeof window !== 'undefined' ? window.innerWidth - 220 : 9999
  const maxY = typeof window !== 'undefined' ? window.innerHeight - 120 : 9999
  const x = Math.min(tooltip.x + offsetX, maxX)
  const y = Math.min(tooltip.y + offsetY, maxY)

  return (
    <div
      className="fixed z-[9999] pointer-events-none animate-[fade-in_0.2s_ease-out_forwards]"
      style={{ left: x, top: y }}
    >
      <div className="bg-background/95 dark:bg-slate-900/95 backdrop-blur-md border border-emerald-500/30 rounded-lg shadow-xl shadow-emerald-500/10 overflow-hidden min-w-[140px] max-w-[220px]">
        {/* Emerald accent border on left */}
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-l-lg" />
        <div
          className="px-3 py-2 text-[11px] leading-relaxed whitespace-pre-line pl-4"
          dangerouslySetInnerHTML={{ __html: tooltip.content }}
        />
      </div>
    </div>
  )
}
