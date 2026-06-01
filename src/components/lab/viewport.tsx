'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { SceneRenderer } from './scene-renderer'
import { Suspense } from 'react'
import { useLabStore } from '@/store/lab-store'
import { Loader2 } from 'lucide-react'

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
      return { position: [5, 5, 5], fov: 50 }
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
  if (mode === 'rect_approx') {
    return 'from-teal-50 to-slate-100 dark:from-teal-950/30 dark:to-slate-900'
  }
  if (mode.startsWith('sphere_cyl')) {
    return 'from-violet-50 to-slate-100 dark:from-violet-950/30 dark:to-slate-900'
  }
  return 'from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800'
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
  const cameraConfig = getCameraForMode(mode)
  const bgClass = getBackgroundForMode(mode)

  return (
    <div className={`w-full h-full bg-gradient-to-br ${bgClass} rounded-lg overflow-hidden relative shadow-inner`}>
      <Suspense fallback={<LoadingIndicator />}>
        <Canvas
          camera={{ position: cameraConfig.position, fov: cameraConfig.fov, near: 0.1, far: 100 }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 2]}
        >
          <SceneRenderer />
          <OrbitControls
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
