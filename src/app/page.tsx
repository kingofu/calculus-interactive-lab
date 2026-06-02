'use client'

import { useState, useEffect, useCallback } from 'react'
import { Sidebar } from '@/components/lab/sidebar'
import { Viewport } from '@/components/lab/viewport'
import { ControlsPanel } from '@/components/lab/controls-panel'
import { InfoPanel } from '@/components/lab/info-panel'
import { ToastProvider, useToast } from '@/components/lab/toast-provider'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useLabStore, modeInfo, type LabMode } from '@/store/lab-store'
import {
  Menu,
  Moon,
  Sun,
  Box,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Keyboard,
  Sparkles,
  Play,
  Pause,
  GraduationCap,
  Heart,
  ChevronLeft,
  ChevronRight,
  Star,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'

// All mode keys in order for keyboard navigation
const allModes: LabMode[] = [
  'limit1', 'limit2', 'continuity1', 'discontinuity1',
  'derivative1', 'derivative2', 'derivative3',
  'rolle1', 'lagrange1', 'taylor1',
  'monotonicity1', 'extrema1', 'concavity1', 'curvature1',
  'indef_integral1',
  'rect_approx', 'ftc1', 'mean_value_integral1', 'improper_integral1',
  'area1', 'volume_rev1', 'polar_area1',
  'step1', 'step2', 'step3', 'step4',
  'prop3', 'prop6', 'prop7',
  'parity1', 'parity2',
  'cartesian1', 'cartesian2',
  'polar1', 'polar2',
  'jacobian1',
  'fubini1',
  'surface_area1',
  'sphere_cyl1', 'sphere_cyl2',
  'convergence1',
  'triple1',
  'cylindrical1', 'spherical1',
  'green1',
  'stokes1', 'divergence1',
  'gradient1', 'directional1',
  'vector_field1',
  'curl1', 'divergence_field1',
  'conservative1',
  'laplace1',
  'fourier1',
  'isosurface1',
  'mass_center1', 'moment_of_inertia1',
  'arc_length1',
  'surface_integral1',
]

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">切换主题</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        切换深色/浅色模式
      </TooltipContent>
    </Tooltip>
  )
}

function ShortcutsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-background border rounded-xl shadow-2xl p-5 max-w-sm mx-4 space-y-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Keyboard className="h-4 w-4 text-emerald-600" />
            键盘快捷键
          </h3>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-xs" onClick={onClose}>✕</Button>
        </div>
        <div className="space-y-1.5 text-xs">
          {[
            ['↑ / ↓', '上一个/下一个模式'],
            ['← / →', '调整参数值'],
            ['R', '重置参数 / 停止导览'],
            ['T', '开始/停止自动导览'],
            ['F', '收藏/取消收藏当前模式'],
            ['Space', '展开/收起详情面板'],
            ['D', '切换深色/浅色模式'],
            ['S', '截图保存3D视图'],
            ['A', '切换自动旋转/固定视角'],
            ['P', '播放/暂停概念步骤动画'],
            ['?', '显示快捷键帮助'],
          ].map(([key, desc]) => (
            <div key={key} className="flex items-center justify-between gap-4 py-0.5">
              <span className="text-muted-foreground">{desc}</span>
              <kbd className="bg-muted px-1.5 py-0.5 rounded text-[10px] font-mono border">{key}</kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function HomeContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [infoExpanded, setInfoExpanded] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const { mode, setMode, paramValue, setParamValue, setParamValue2, autoTourActive, setAutoTourActive, favorites, toggleFavorite, autoRotate, setAutoRotate } = useLabStore()
  const info = modeInfo[mode]
  const { toast } = useToast()

  // Onboarding tooltip: show once on first visit
  useEffect(() => {
    const seen = localStorage.getItem('lab-onboarding-seen')
    if (!seen) {
      const timer = setTimeout(() => {
        setShowOnboarding(true)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  // URL parameter support: load mode and params from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const modeParam = params.get('mode')
    const param1 = params.get('param1')
    const param2 = params.get('param2')

    if (modeParam && modeParam in modeInfo) {
      setMode(modeParam as LabMode)
      if (param1) setParamValue(Number(param1))
      if (param2) setParamValue2(Number(param2))
    }
  }, [])

  const dismissOnboarding = useCallback(() => {
    setShowOnboarding(false)
    localStorage.setItem('lab-onboarding-seen', 'true')
  }, [])

  const currentIndex = allModes.indexOf(mode)
  const totalModes = allModes.length
  const positionPercent = Math.round(((currentIndex + 1) / totalModes) * 100)

  // Auto tour
  useEffect(() => {
    if (!autoTourActive) return
    const timer = setInterval(() => {
      const currentIdx = allModes.indexOf(useLabStore.getState().mode)
      const nextIdx = (currentIdx + 1) % allModes.length
      setMode(allModes[nextIdx])
    }, 3000)
    return () => clearInterval(timer)
  }, [autoTourActive, setMode])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore if user is typing in an input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
    // Disable arrow keys during auto tour
    if (autoTourActive && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) return

    switch (e.key) {
      case 'ArrowUp': {
        e.preventDefault()
        const prev = Math.max(0, currentIndex - 1)
        setMode(allModes[prev])
        break
      }
      case 'ArrowDown': {
        e.preventDefault()
        const next = Math.min(allModes.length - 1, currentIndex + 1)
        setMode(allModes[next])
        break
      }
      case 'ArrowLeft': {
        e.preventDefault()
        const step = info.paramStep
        const newVal = Math.round((Math.max(info.paramMin, paramValue - step)) / step) * step
        setParamValue(parseFloat(newVal.toFixed(10)))
        break
      }
      case 'ArrowRight': {
        e.preventDefault()
        const step = info.paramStep
        const newVal = Math.round((Math.min(info.paramMax, paramValue + step)) / step) * step
        setParamValue(parseFloat(newVal.toFixed(10)))
        break
      }
      case 'r':
      case 'R': {
        if (autoTourActive) {
          setAutoTourActive(false)
        } else {
          setParamValue(info.paramDefault)
          if (info.paramDefault2 !== undefined) setParamValue2(info.paramDefault2)
        }
        break
      }
      case 't':
      case 'T': {
        setAutoTourActive(!autoTourActive)
        break
      }
      case ' ': {
        e.preventDefault()
        setInfoExpanded(prev => !prev)
        break
      }
      case 'd':
      case 'D': {
        const el = document.documentElement
        const isDark = el.classList.contains('dark')
        el.classList.toggle('dark', !isDark)
        localStorage.setItem('theme', isDark ? 'light' : 'dark')
        break
      }
      case 's':
      case 'S': {
        // Trigger screenshot from viewport
        const canvas = document.querySelector('canvas')
        if (canvas) {
          try {
            const dataUrl = canvas.toDataURL('image/png')
            const link = document.createElement('a')
            link.download = `double-integral-${mode}-${Date.now()}.png`
            link.href = dataUrl
            link.click()
            toast('截图已保存！', 'success')
          } catch {}
        }
        break
      }
      case 'f':
      case 'F': {
        toggleFavorite(mode)
        break
      }
      case 'a':
      case 'A': {
        setAutoRotate(!autoRotate)
        break
      }
      case 'p':
      case 'P': {
        window.dispatchEvent(new CustomEvent('timeline-toggle-play'))
        break
      }
      case '?': {
        setShortcutsOpen(prev => !prev)
        break
      }
    }
  }, [autoTourActive, currentIndex, info, mode, paramValue, setAutoTourActive, setMode, setParamValue, setParamValue2, toast, favorites, toggleFavorite, autoRotate, setAutoRotate])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const handleReset = () => {
    setParamValue(info.paramDefault)
    if (info.paramDefault2 !== undefined) setParamValue2(info.paramDefault2)
  }

  // Mode navigation helpers
  const goToPrevMode = () => {
    const prev = Math.max(0, currentIndex - 1)
    setMode(allModes[prev])
  }
  const goToNextMode = () => {
    const next = Math.min(allModes.length - 1, currentIndex + 1)
    setMode(allModes[next])
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Screen reader live region for mode changes */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        已切换到: {info.title} — {info.section}
      </div>
      {/* Header */}
      <header className="relative flex items-center justify-between px-3 sm:px-5 py-2 sm:py-2.5 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shrink-0 shadow-sm overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/[0.03] via-teal-400/[0.06] to-emerald-500/[0.03] bg-[length:200%_100%] animate-[header-gradient_8s_ease-in-out_infinite]" />
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile menu */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden">
                <Menu className="h-4 w-4" />
                <span className="sr-only">打开菜单</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetTitle className="px-4 pt-4 text-sm font-semibold">导航菜单</SheetTitle>
              <Sidebar onModeSelect={() => setSidebarOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="relative animate-[float_3s_ease-in-out_infinite]">
              <Box className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <Sparkles className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 text-amber-500 animate-pulse" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xs sm:text-sm font-bold tracking-tight leading-none">
                微积分互动实验室
              </h1>
              <span
                key={mode}
                className="text-[7px] sm:text-[8px] text-muted-foreground/60 font-medium tracking-wider mt-0.5 hidden sm:block animate-[subtitle-swap_0.4s_ease-out]"
              >
                CALCULUS INTERACTIVE LAB
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {/* Progress indicator */}
          <div className="hidden sm:flex items-center gap-1.5">
            <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                style={{ width: `${positionPercent}%` }}
              />
              {/* Shimmer animation when auto-tour is active */}
              {autoTourActive && (
                <div className="absolute inset-0 animate-[shimmer-progress_2s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              )}
            </div>
            <span className="text-[9px] text-muted-foreground font-mono">{currentIndex + 1}/{totalModes}</span>
          </div>

          {/* Auto tour button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-7 w-7", autoTourActive && "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30")}
                onClick={() => setAutoTourActive(!autoTourActive)}
              >
                {autoTourActive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                <span className="sr-only">{autoTourActive ? '停止导览' : '自动导览'}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">{autoTourActive ? '停止导览 (T)' : '自动导览 (T)'}</TooltipContent>
          </Tooltip>

          {/* Mode counter badge with animated number transitions */}
          <div className="hidden sm:flex items-center gap-1 animate-[pulse-soft_3s_ease-in-out_infinite]">
            <Badge
              key={`badge-${mode}`}
              variant="outline"
              className="items-center gap-1 text-[10px] px-1.5 py-0 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-900/20 animate-[slide-down_0.3s_ease-out]"
            >
              <span key={`idx-${currentIndex + 1}`} className="font-mono animate-[count-up_0.3s_ease-out]">{currentIndex + 1}</span>
              <span className="text-muted-foreground">/</span>
              <span className="font-mono">{allModes.length}</span>
              <span className="text-muted-foreground">·</span>
              <span className="truncate max-w-[80px]">{info.title}</span>
              {favorites.has(mode) && (
                <Star className="h-2.5 w-2.5 text-amber-500 fill-amber-500 ml-0.5" />
              )}
            </Badge>
          </div>

          {/* Reset button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleReset}>
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="sr-only">重置参数</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">重置参数 (R)</TooltipContent>
          </Tooltip>

          {/* Keyboard shortcuts */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShortcutsOpen(true)}>
                <Keyboard className="h-3.5 w-3.5" />
                <span className="sr-only">快捷键</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">快捷键 (?)</TooltipContent>
          </Tooltip>

          <ThemeToggle />
        </div>

        {/* Gradient line below header with animated shimmer */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 opacity-40" />
        <div className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden">
          <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_3s_ease-in-out_infinite]" />
        </div>
        {/* Subtle corner glow */}
        <div className="absolute bottom-0 left-0 w-16 h-2 bg-gradient-to-r from-emerald-500/20 to-transparent" />
        <div className="absolute bottom-0 right-0 w-16 h-2 bg-gradient-to-l from-teal-500/20 to-transparent" />
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-52 lg:w-56 border-r flex-col shrink-0">
          <Sidebar />
        </aside>

        {/* Right content */}
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* 3D Viewport - takes most space with minimum height */}
          <div className="flex-1 min-h-[240px] p-1.5 sm:p-2">
            <Viewport />
          </div>

          {/* Bottom panels - collapsible with scroll */}
          <div className={cn(
            "border-t transition-all duration-300 ease-in-out bg-background/80 backdrop-blur-sm",
            infoExpanded ? "max-h-[50vh]" : "max-h-[180px]"
          )}>
            {/* Controls always visible */}
            <ControlsPanel />

            {/* Expandable info panel */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-6 rounded-none text-[10px] text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 border-y border-dashed"
                onClick={() => setInfoExpanded(!infoExpanded)}
              >
                {infoExpanded ? (
                  <>
                    <ChevronDown className="h-3 w-3" />
                    收起详情
                    <ChevronDown className="h-3 w-3" />
                  </>
                ) : (
                  <>
                    <ChevronUp className="h-3 w-3" />
                    展开详情
                    <ChevronUp className="h-3 w-3" />
                  </>
                )}
              </Button>
              <div className={cn(
                "overflow-y-auto transition-all duration-300 custom-scrollbar",
                infoExpanded ? "max-h-[calc(50vh-100px)]" : "max-h-[60px]"
              )}>
                <InfoPanel />
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="relative flex flex-col bg-background/95 backdrop-blur shrink-0">
        {/* Mode progress bar - thin bar at very top */}
        <div className="w-full h-[3px] bg-muted/40">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 transition-all duration-700 ease-out relative overflow-hidden"
            style={{ width: `${positionPercent}%` }}
          >
            {autoTourActive && (
              <div className="absolute inset-0 animate-[shimmer-progress_2s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            )}
          </div>
        </div>

        <div className="flex items-center justify-between px-3 sm:px-5 py-1.5">
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <GraduationCap className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              <div className="absolute -bottom-0.5 -right-0.5 w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <span className="text-[9px] text-muted-foreground hidden sm:inline">
              微积分互动实验室
            </span>
            <span className="text-[9px] text-muted-foreground sm:hidden">
              微积分实验室
            </span>
          </div>

          {/* Current section + mode name with transition */}
          <div className="flex items-center gap-1.5">
            {/* Auto-tour animated dot indicator */}
            {autoTourActive && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            )}
            <span
              key={info.section}
              className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded transition-all duration-300 animate-[slide-down_0.3s_ease-out]"
            >
              {info.section}
            </span>
            <span className="text-[8px] text-muted-foreground/40 hidden sm:inline">·</span>
            <span
              key={mode}
              className="text-[9px] text-foreground/80 font-medium hidden sm:inline animate-[slide-down_0.3s_ease-out]"
            >
              {info.title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[9px] text-muted-foreground hidden sm:inline">
              {currentIndex + 1}/{totalModes}
            </span>

            {/* Mode navigation arrows with hover effects */}
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 transition-all hover:scale-110"
                onClick={goToPrevMode}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="h-3 w-3" />
                <span className="sr-only">上一个模式</span>
              </Button>
              <span className="text-[9px] font-mono text-muted-foreground min-w-[24px] text-center tabular-nums">
                {currentIndex + 1}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 transition-all hover:scale-110"
                onClick={goToNextMode}
                disabled={currentIndex === allModes.length - 1}
              >
                <ChevronRight className="h-3 w-3" />
                <span className="sr-only">下一个模式</span>
              </Button>
            </div>

            <div className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
              <span>用</span>
              <Heart className="h-2.5 w-2.5 text-red-400 animate-[bounce-subtle_2s_ease-in-out_infinite]" />
              <span>构建</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Onboarding Tooltip */}
      {showOnboarding && (
        <div className="fixed z-50 animate-[onboarding-in_0.5s_ease-out_forwards]">
          {/* Desktop: positioned near the sidebar */}
          <div className="hidden md:block" style={{ top: '80px', left: '220px' }}>
            <div className="relative">
              {/* Arrow pointing left (toward sidebar) */}
              <div className="absolute -left-2 top-4 w-0 h-0 border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-r-emerald-200 dark:border-r-emerald-800" />
              <div className="bg-emerald-50 dark:bg-emerald-900/80 border border-emerald-200 dark:border-emerald-800 rounded-lg shadow-lg backdrop-blur-sm p-3 max-w-[260px]">
                <p className="text-[11px] text-emerald-800 dark:text-emerald-200 leading-relaxed">
                  欢迎使用微积分互动实验室！← 侧边栏选择可视化模式，滑块调整参数，拖拽旋转3D场景
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 h-6 text-[10px] border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-800"
                  onClick={dismissOnboarding}
                >
                  知道了
                </Button>
              </div>
            </div>
          </div>
          {/* Mobile: positioned near the menu button */}
          <div className="md:hidden" style={{ top: '56px', left: '40px' }}>
            <div className="relative">
              {/* Arrow pointing left (toward menu button) */}
              <div className="absolute -left-2 top-4 w-0 h-0 border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-r-emerald-200 dark:border-r-emerald-800" />
              <div className="bg-emerald-50 dark:bg-emerald-900/80 border border-emerald-200 dark:border-emerald-800 rounded-lg shadow-lg backdrop-blur-sm p-3 max-w-[220px]">
                <p className="text-[11px] text-emerald-800 dark:text-emerald-200 leading-relaxed">
                  欢迎使用微积分互动实验室！点击菜单按钮选择模式，滑块调整参数，拖拽旋转3D场景
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 h-6 text-[10px] border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-800"
                  onClick={dismissOnboarding}
                >
                  知道了
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shortcuts Dialog */}
      <ShortcutsDialog open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  )
}

export default function Home() {
  return (
    <TooltipProvider delayDuration={300}>
      <ToastProvider>
        <HomeContent />
      </ToastProvider>
    </TooltipProvider>
  )
}
