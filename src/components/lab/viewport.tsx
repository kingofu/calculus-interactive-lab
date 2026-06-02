'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, OrthographicCamera } from '@react-three/drei'
import * as THREE from 'three'
import { SceneRenderer } from './scene-renderer'
import { SceneErrorBoundary } from './scene-error-boundary'
import { SceneTooltip } from './scene-tooltip'
import { AnimationTimeline } from './animation-timeline'
import { Viewport2D } from './viewport-2d'
import { Suspense, useCallback, useRef, useState, useEffect } from 'react'
import { useLabStore, modeInfo, type LabMode } from '@/store/lab-store'
import { Loader2, Move3d, Camera, RotateCcw, Maximize2, Minimize2, RotateCw, Pause } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useToast } from './toast-provider'

// Check if a mode uses 2D viewing (orthographic, no rotation)
function is2DMode(mode: string): boolean {
  const info = modeInfo[mode as keyof typeof modeInfo]
  return info?.viewType === '2d'
}

// Concept step modes share a stable camera key to prevent origin jumps
const conceptSteps: LabMode[] = ['step1', 'step2', 'step3', 'step4']

// Camera presets for different modes
function getCameraForMode(mode: string): { position: [number, number, number]; fov: number; is2D?: boolean } {
  // 2D modes use orthographic camera looking at XY plane
  if (is2DMode(mode)) {
    return { position: [0, 0, 10], fov: 50, is2D: true }
  }
  switch (mode) {
    // 一元微积分 3D modes
    case 'volume_rev1':
      return { position: [6, 5, 6], fov: 50 }
    // 多元微积分 modes
    case 'rect_approx':
      return { position: [6, 4, 6], fov: 50 }
    case 'sphere_cyl1':
    case 'sphere_cyl2':
      return { position: [7, 5, 7], fov: 45 }
    case 'step1':
    case 'step2':
    case 'step3':
    case 'step4':
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
    case 'surface_area1':
    case 'fubini1':
    case 'stokes1':
    case 'divergence1':
    case 'arc_length1':
    case 'mass_center1':
    case 'moment_of_inertia1':
    case 'cylindrical1':
    case 'gradient1':
    case 'spherical1':
    case 'laplace1':
    case 'fourier1':
    case 'vector_field1':
    case 'directional1':
    case 'isosurface1':
    case 'curl1':
    case 'divergence_field1':
    case 'conservative1':
    case 'surface_integral1':
      return { position: [6, 8, 4], fov: 50 }
    default:
      return { position: [8, 6, 8], fov: 50 }
  }
}

// Background class based on mode
function getBackgroundForMode(mode: string): string {
  // 一元微积分 backgrounds
  if (mode === 'limit1' || mode === 'limit2') {
    return 'from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/20'
  }
  if (mode === 'derivative1' || mode === 'derivative2' || mode === 'derivative3') {
    return 'from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20'
  }
  if (mode === 'rolle1' || mode === 'lagrange1') {
    return 'from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20'
  }
  if (mode === 'indef_integral1') {
    return 'from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/20'
  }
  if (mode === 'ftc1' || mode === 'mean_value_integral1') {
    return 'from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20'
  }
  if (mode === 'area1') {
    return 'from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/20'
  }
  if (mode === 'volume_rev1') {
    return 'from-sky-50 to-cyan-50 dark:from-sky-950/30 dark:to-cyan-950/20'
  }
  if (mode === 'continuity1' || mode === 'discontinuity1') {
    return 'from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/20'
  }
  if (mode === 'monotonicity1' || mode === 'extrema1' || mode === 'concavity1' || mode === 'curvature1') {
    return 'from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/20'
  }

  if (mode === 'improper_integral1') {
    return 'from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20'
  }
  if (mode === 'polar_area1') {
    return 'from-sky-50 to-cyan-50 dark:from-sky-950/30 dark:to-cyan-950/20'
  }
  // 多元微积分 backgrounds
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
  if (mode === 'surface_area1') {
    return 'from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/20'
  }
  if (mode === 'fubini1') {
    return 'from-slate-50 to-violet-50 dark:from-slate-900/50 dark:to-violet-950/20'
  }
  if (mode === 'stokes1') {
    return 'from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/20'
  }
  if (mode === 'divergence1') {
    return 'from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20'
  }
  if (mode === 'arc_length1') {
    return 'from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/20'
  }
  if (mode === 'mass_center1' || mode === 'moment_of_inertia1') {
    return 'from-cyan-50 to-teal-50 dark:from-cyan-950/30 dark:to-teal-950/20'
  }
  if (mode === 'cylindrical1') {
    return 'from-sky-50 to-cyan-50 dark:from-sky-950/30 dark:to-cyan-950/20'
  }
  if (mode === 'gradient1') {
    return 'from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/20'
  }
  if (mode === 'spherical1') {
    return 'from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/20'
  }
  if (mode === 'laplace1') {
    return 'from-slate-50 to-zinc-50 dark:from-slate-900/50 dark:to-zinc-900/30'
  }
  if (mode === 'fourier1') {
    return 'from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20'
  }
  if (mode === 'vector_field1') {
    return 'from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/20'
  }
  if (mode === 'isosurface1') {
    return 'from-cyan-50 to-teal-50 dark:from-cyan-950/30 dark:to-teal-950/20'
  }
  if (mode === 'directional1') {
    return 'from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/20'
  }
  if (mode === 'curl1') {
    return 'from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/20'
  }
  if (mode === 'divergence_field1') {
    return 'from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/20'
  }
  if (mode === 'conservative1') {
    return 'from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20'
  }
  if (mode === 'surface_integral1') {
    return 'from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/20'
  }
  return 'from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800'
}

// Mode indicator color
function getModeAccentColor(mode: string): string {
  // 一元微积分 accent colors
  if (mode === 'limit1' || mode === 'limit2') return 'bg-rose-500'
  if (mode === 'derivative1' || mode === 'derivative2' || mode === 'derivative3') return 'bg-amber-500'
  if (mode === 'rolle1' || mode === 'lagrange1') return 'bg-red-500'
  if (mode === 'indef_integral1') return 'bg-purple-500'
  if (mode === 'ftc1' || mode === 'mean_value_integral1') return 'bg-emerald-500'
  if (mode === 'area1') return 'bg-sky-500'
  if (mode === 'volume_rev1') return 'bg-sky-500'
  if (mode === 'continuity1' || mode === 'discontinuity1') return 'bg-rose-500'
  if (mode === 'monotonicity1' || mode === 'extrema1') return 'bg-teal-500'
  if (mode === 'concavity1' || mode === 'curvature1') return 'bg-cyan-500'

  if (mode === 'improper_integral1') return 'bg-emerald-500'
  if (mode === 'polar_area1') return 'bg-sky-500'
  // 多元微积分 accent colors
  if (mode.startsWith('step')) return 'bg-emerald-500'
  if (mode.startsWith('prop')) return 'bg-sky-500'
  if (mode.startsWith('parity')) return 'bg-orange-500'
  if (mode.startsWith('cartesian')) return 'bg-amber-500'
  if (mode.startsWith('polar')) return 'bg-rose-500'
  if (mode === 'rect_approx') return 'bg-emerald-500'
  if (mode.startsWith('sphere_cyl')) return 'bg-violet-500'
  if (mode === 'convergence1') return 'bg-cyan-500'
  if (mode.startsWith('triple')) return 'bg-purple-500'
  if (mode === 'jacobian1') return 'bg-lime-500'
  if (mode === 'green1') return 'bg-red-500'
  if (mode === 'surface_area1') return 'bg-indigo-500'
  if (mode === 'fubini1') return 'bg-fuchsia-500'
  if (mode === 'stokes1') return 'bg-violet-500'
  if (mode === 'divergence1') return 'bg-orange-500'
  if (mode === 'arc_length1') return 'bg-sky-500'
  if (mode === 'mass_center1' || mode === 'moment_of_inertia1') return 'bg-cyan-500'
  if (mode === 'cylindrical1') return 'bg-sky-500'
  if (mode === 'gradient1') return 'bg-yellow-500'
  if (mode === 'spherical1') return 'bg-green-500'
  if (mode === 'laplace1') return 'bg-slate-500'
  if (mode === 'fourier1') return 'bg-orange-500'
  if (mode === 'vector_field1') return 'bg-teal-500'
  if (mode === 'isosurface1') return 'bg-cyan-500'
  if (mode === 'directional1') return 'bg-yellow-500'
  if (mode === 'curl1') return 'bg-rose-500'
  if (mode === 'divergence_field1') return 'bg-pink-500'
  if (mode === 'conservative1') return 'bg-emerald-500'
  if (mode === 'surface_integral1') return 'bg-violet-500'
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
  const { mode, autoRotate, setAutoRotate, overlayDragging } = useLabStore()
  const info = modeInfo[mode]
  const cameraConfig = getCameraForMode(mode)
  const bgClass = getBackgroundForMode(mode)
  const accentColor = getModeAccentColor(mode)
  const containerRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [sceneKey, setSceneKey] = useState(0)

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const handleScreenshot = useCallback(() => {
    const canvas = containerRef.current?.querySelector('canvas')
    if (!canvas) return
    try {
      const dataUrl = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = `double-integral-${mode}-${Date.now()}.png`
      link.href = dataUrl
      link.click()
      toast('截图已保存！', 'success')
    } catch (e) {
      console.warn('Screenshot failed:', e)
    }
  }, [mode, toast])

  const handleResetCamera = useCallback(() => {
    // Force re-creation of OrbitControls by bumping the key
    setSceneKey(prev => prev + 1)
  }, [setSceneKey])

  const handleFullscreen = useCallback(() => {
    if (!containerRef.current) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      containerRef.current.requestFullscreen()
    }
  }, [])

  // Accessibility: generate ARIA description for the current mode
  const ariaLabel = `${cameraConfig.is2D ? '2D' : '3D'}可视化: ${info.title} - 交互式数学可视化，${cameraConfig.is2D ? '可拖拽平移和滚轮缩放' : '可拖拽旋转和滚轮缩放'}`
  const ariaDescription = `${info.section}类别的${info.title}模式。${info.description} ${cameraConfig.is2D ? '使用鼠标拖拽可平移视图，滚轮可缩放。' : '使用鼠标拖拽可旋转3D视图，滚轮可缩放。'}`

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={ariaLabel}
      className={`w-full h-full bg-gradient-to-br ${bgClass} rounded-lg overflow-hidden relative shadow-inner transition-all duration-500 ${isFullscreen ? 'rounded-none' : ''}`}
    >
      {/* Mode transition animation overlay */}
      <div key={`transition-${mode}`} className="absolute inset-0 z-[5] pointer-events-none animate-[mode-switch_0.4s_ease-out_forwards]" />

      {/* Transition shimmer overlay */}
      <div key={`shimmer-${mode}`} className="absolute inset-0 z-[6] pointer-events-none animate-[shimmer_0.8s_ease-out]" />

      {/* Gradient corner accents */}
      <div className="absolute top-0 left-0 w-24 h-24 pointer-events-none z-[4]">
        <div className={cn("w-full h-full rounded-tl-lg opacity-20", `bg-gradient-to-br ${bgClass}`)} />
      </div>
      <div className="absolute bottom-0 right-0 w-24 h-24 pointer-events-none z-[4]">
        <div className={cn("w-full h-full rounded-br-lg opacity-10", `bg-gradient-to-tl ${bgClass}`)} />
      </div>

      {/* Mode indicator overlay */}
      <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 pointer-events-none">
        <div className={cn("w-2 h-2 rounded-full", accentColor, "animate-pulse")} />
        <span className="text-[10px] font-medium text-foreground/60 bg-background/60 backdrop-blur-sm px-1.5 py-0.5 rounded transition-all duration-300">
          {info.title}
        </span>
      </div>

      {/* Top-right buttons */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
        {!cameraConfig.is2D && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-7 w-7 backdrop-blur-sm hover:bg-background/70 ${autoRotate ? 'bg-background/40 text-emerald-600 dark:text-emerald-400' : 'bg-background/60 text-muted-foreground'}`}
                onClick={() => setAutoRotate(!autoRotate)}
              >
                {autoRotate ? <RotateCw className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                <span className="sr-only">{autoRotate ? '自动旋转中' : '已暂停旋转'}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">{autoRotate ? '自动旋转 (点击暂停)' : '旋转已暂停 (点击恢复)'}</TooltipContent>
          </Tooltip>
        )}
        {!cameraConfig.is2D && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 bg-background/40 backdrop-blur-sm hover:bg-background/70"
                onClick={handleResetCamera}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="sr-only">重置视角</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">重置视角</TooltipContent>
          </Tooltip>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 bg-background/40 backdrop-blur-sm hover:bg-background/70"
              onClick={handleFullscreen}
            >
              {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              <span className="sr-only">{isFullscreen ? '退出全屏' : '全屏'}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">{isFullscreen ? '退出全屏' : '全屏'}</TooltipContent>
        </Tooltip>
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

      {/* Animation timeline for concept modes (step1-step4) */}
      <AnimationTimeline />

      {/* Controls hint */}
      <div className="absolute bottom-2 right-2 z-10 pointer-events-none">
        <div className="flex items-center gap-1 text-[9px] text-muted-foreground/50 bg-background/40 backdrop-blur-sm px-1.5 py-0.5 rounded">
          <Move3d className="h-2.5 w-2.5" />
          {cameraConfig.is2D ? '拖拽平移 · 滚轮缩放' : '拖拽旋转 · 滚轮缩放'}
        </div>
      </div>

      {/* 2D mode: pure SVG rendering engine — NO Three.js */}
      {cameraConfig.is2D ? (
        <Viewport2D />
      ) : (
        /* 3D mode: perspective Canvas with orbit controls */
        <div className="w-full h-full" style={{ pointerEvents: overlayDragging ? 'none' : 'auto' }}>
        <SceneErrorBoundary onRetry={() => setSceneKey(prev => prev + 1)}>
          <Suspense fallback={<LoadingIndicator />}>
            <Canvas
              key="canvas-3d"
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
                key={`orbit-3d-${conceptSteps.includes(mode as LabMode) ? 'concept' : mode}-${sceneKey}`}
                enabled={!overlayDragging}
                enableDamping
                dampingFactor={0.1}
                rotateSpeed={0.5}
                minDistance={3}
                maxDistance={25}
                enableRotate={true}
                enablePan={true}
                target={[0, 0, 0]}
              />
            </Canvas>
          </Suspense>
        </SceneErrorBoundary>
        </div>
      )}

      {/* Interactive hover tooltip overlay */}
      <SceneTooltip />

      {/* Visually hidden description for screen readers */}
      <div id={`viewport-desc-${mode}`} className="sr-only" aria-live="polite">
        {ariaDescription}
      </div>
    </div>
  )
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ')
}
