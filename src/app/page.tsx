'use client'

import { useState, useEffect, useCallback } from 'react'
import { Sidebar } from '@/components/lab/sidebar'
import { Viewport } from '@/components/lab/viewport'
import { ControlsPanel } from '@/components/lab/controls-panel'
import { InfoPanel } from '@/components/lab/info-panel'
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
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'

// All mode keys in order for keyboard navigation
const allModes: LabMode[] = [
  'step1', 'step2', 'step3', 'step4',
  'prop1', 'prop2', 'prop3', 'prop4', 'prop5', 'prop6', 'prop7',
  'parity1', 'parity2',
  'cartesian1', 'cartesian2',
  'rect_approx',
  'sphere_cyl1', 'sphere_cyl2',
  'polar1', 'polar2',
  'convergence1', 'convergence2',
  'triple1',
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
            ['Space', '展开/收起详情面板'],
            ['D', '切换深色/浅色模式'],
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

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [infoExpanded, setInfoExpanded] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const { mode, setMode, paramValue, setParamValue, setParamValue2, visitedModes, autoTourActive, setAutoTourActive } = useLabStore()
  const info = modeInfo[mode]

  const currentIndex = allModes.indexOf(mode)
  const visitedCount = visitedModes.size
  const totalModes = allModes.length
  const progressPercent = Math.round((visitedCount / totalModes) * 100)

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
      case '?': {
        setShortcutsOpen(prev => !prev)
        break
      }
    }
  }, [autoTourActive, currentIndex, info, paramValue, setAutoTourActive, setMode, setParamValue, setParamValue2])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const handleReset = () => {
    setParamValue(info.paramDefault)
    if (info.paramDefault2 !== undefined) setParamValue2(info.paramDefault2)
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="h-screen flex flex-col bg-background overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-3 sm:px-4 py-1.5 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shrink-0">
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
              <div className="relative">
                <Box className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <Sparkles className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 text-amber-500" />
              </div>
              <h1 className="text-xs sm:text-sm font-bold tracking-tight">
                二重积分互动实验室
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Progress indicator */}
            <div className="hidden sm:flex items-center gap-1.5">
              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-[9px] text-muted-foreground font-mono">{visitedCount}/{totalModes}</span>
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

            {/* Current mode badge */}
            <Badge variant="outline" className="hidden sm:flex items-center gap-1 text-[10px] px-1.5 py-0 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-900/20">
              <span className="font-mono">{currentIndex + 1}/{allModes.length}</span>
              <span className="text-muted-foreground">·</span>
              <span className="truncate max-w-[80px]">{info.title}</span>
            </Badge>

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
                  "overflow-y-auto transition-all duration-300",
                  infoExpanded ? "max-h-[calc(50vh-100px)]" : "max-h-[60px]"
                )}>
                  <InfoPanel />
                </div>
              </div>
            </div>
          </main>
        </div>

        {/* Shortcuts Dialog */}
        <ShortcutsDialog open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      </div>
    </TooltipProvider>
  )
}
