'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { SceneRenderer } from './scene-renderer'
import { Suspense, useMemo, useCallback, useRef, useState, useEffect } from 'react'
import { useLabStore, modeInfo } from '@/store/lab-store'
import { Loader2, Move3d, Camera, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

// Camera presets for different modes
function getCameraForMode(mode: string): { position: [number, number, number]; fov: number } {
  switch (mode) {
    case 'rect_approx':
      return { position: [6, 4, 6], fov: 50 }
    case 'sphere_cyl1':
    case 'sphere_cyl2':
      return { position: [7, 5, 7], fov: 45 }
    case 'step1':
    case 'step2':
      return { position: [6, 8, 4], fov: 50 }
    case 'cartesian1':
    case 'cartesian2':
    case 'polar1':
    case 'polar2':
      return { position: [5, 5, 5], fov: 50 }
    case 'triple1':
      return { position: [6, 5, 6], fov: 45 }
    case 'jacobian1':
    case 'green1':
      return { position: [6, 8, 4], fov: 50 }
    default:
      return { position: [8, 6, 8], fov: 50 }
  }
}

// Background class based on mode
function getBackgroundForMode(mode: string): string {
  if (mode.startsWith('step')) {
    return 'from-emerald-50 to-slate-100 dark:from-emerald-950/50 dark:to-slate-900'
  }
  if (mode.startsWith('prop')) {
    return 'from-sky-50 to-slate-100 dark:from-sky-950/30 dark:to-slate-900'
  }
  if (mode.startsWith('parity')) {
    return 'from-orange-50 to-cyan-50 dark:from-orange-950/20 dark:to-cyan-950/20'
  }
  if (mode.startsWith('cartesian')) {
    return 'from-amber-50 to-slate-100 dark:from-amber-950/30 dark:to-slate-900'
  }
  if (mode.startsWith('polar')) {
    return 'from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/20'
  }
  if (mode === 'rect_approx') {
    return 'from-teal-50 to-slate-100 dark:from-teal-950/30 dark:to-slate-900'
  }
  if (mode.startsWith('sphere_cyl')) {
    return 'from-violet-50 to-slate-100 dark:from-violet-950/30 dark:to-slate-900'
  }
  if (mode.startsWith('convergence')) {
    return 'from-cyan-50 to-teal-50 dark:from-cyan-950/30 dark:to-teal-950/20'
  }
  if (mode.startsWith('triple')) {
    return 'from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/20'
  }
  if (mode === 'jacobian1') {
    return 'from-lime-50 to-slate-100 dark:from-lime-950/30 dark:to-slate-900'
  }
  if (mode === 'green1') {
    return 'from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20'
  }
  return 'from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800'
}

// Mode indicator color
function getModeAccentColor(mode: string): string {
  if (mode.startsWith('step')) return 'bg-emerald-500'
  if (mode.startsWith('prop')) return 'bg-sky-500'
  if (mode.startsWith('parity')) return 'bg-orange-500'
  if (mode.startsWith('cartesian')) return 'bg-amber-500'
  if (mode.startsWith('polar')) return 'bg-rose-500'
  if (mode === 'rect_approx') return 'bg-teal-500'
  if (mode.startsWith('sphere_cyl')) return 'bg-violet-500'
  if (mode.startsWith('convergence')) return 'bg-cyan-500'
  if (mode.startsWith('triple')) return 'bg-purple-500'
  if (mode === 'jacobian1') return 'bg-lime-500'
  if (mode === 'green1') return 'bg-red-500'
  return 'bg-slate-500'
}

function LoadingIndicator() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600 dark:text-emerald-400" />
        <span className="text-xs text-muted-foreground">加载3D场景...</span>
      </div>
    </div>
  )
}

export function Viewport() {
  const { mode } = useLabStore()
  const info = modeInfo[mode]
  const cameraConfig = getCameraForMode(mode)
  const bgClass = getBackgroundForMode(mode)
  const accentColor = getModeAccentColor(mode)
  const containerRef = useRef<HTMLDivElement>(null)

  // Transition key - changes trigger CSS animation
  const transitionKey = mode

  const handleScreenshot = useCallback(() => {
    const canvas = containerRef.current?.querySelector('canvas')
    if (!canvas) return
    try {
      const dataUrl = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = `double-integral-${mode}-${Date.now()}.png`
      link.href = dataUrl
      link.click()
    } catch (e) {
      console.warn('Screenshot failed:', e)
    }
  }, [mode])



  return (
    <div ref={containerRef} className={`w-full h-full bg-gradient-to-br ${bgClass} rounded-lg overflow-hidden relative shadow-inner transition-all duration-500`}>
      {/* Transition shimmer overlay */}
      <div key={transitionKey} className="absolute inset-0 z-20 pointer-events-none animate-[shimmer_0.6s_ease-out]" />

      {/* Mode indicator overlay */}
      <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 pointer-events-none">
        <div className={cn("w-2 h-2 rounded-full", accentColor, "animate-pulse")} />
        <span className="text-[10px] font-medium text-foreground/60 bg-background/60 backdrop-blur-sm px-1.5 py-0.5 rounded transition-all duration-300">
          {info.title}
        </span>
      </div>

      {/* Screenshot button */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 bg-background/40 backdrop-blur-sm hover:bg-background/70"
              onClick={handleScreenshot}
            >
              <Camera className="h-3.5 w-3.5" />
              <span className="sr-only">截图保存</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">截图保存 (S)</TooltipContent>
        </Tooltip>
      </div>

      {/* Controls hint */}
      <div className="absolute bottom-2 right-2 z-10 pointer-events-none">
        <div className="flex items-center gap-1 text-[9px] text-muted-foreground/50 bg-background/40 backdrop-blur-sm px-1.5 py-0.5 rounded">
          <Move3d className="h-2.5 w-2.5" />
          拖拽旋转 · 滚轮缩放
        </div>
      </div>



      <Suspense fallback={<LoadingIndicator />}>
        <Canvas
          camera={{ position: cameraConfig.position, fov: cameraConfig.fov, near: 0.1, far: 100 }}
          gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
          dpr={[1, 2]}
        >
          {/* Enhanced lighting */}
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 15, 10]} intensity={0.8} color="#ffffff" />
          <directionalLight position={[-5, 10, -5]} intensity={0.3} color="#e0e7ff" />
          <pointLight position={[0, 10, 0]} intensity={0.4} color="#ffffff" />
          <SceneRenderer />
          <OrbitControls
            key={`orbit-${mode}`}
            enableDamping
            dampingFactor={0.1}
            rotateSpeed={0.5}
            minDistance={3}
            maxDistance={25}
          />
        </Canvas>
      </Suspense>
    </div>
  )
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ')
}
