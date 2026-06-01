'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/lab/sidebar'
import { Viewport } from '@/components/lab/viewport'
import { ControlsPanel } from '@/components/lab/controls-panel'
import { InfoPanel } from '@/components/lab/info-panel'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useLabStore, modeInfo } from '@/store/lab-store'
import {
  Menu,
  Moon,
  Sun,
  Box,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return (
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
  )
}

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [infoExpanded, setInfoExpanded] = useState(false)
  const { mode } = useLabStore()
  const info = modeInfo[mode]

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shrink-0">
        <div className="flex items-center gap-3">
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

          <div className="flex items-center gap-2">
            <Box className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <h1 className="text-sm font-bold tracking-tight sm:text-base">
              二重积分全功能互动实验室
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-xs text-muted-foreground">
            {info.title}
          </span>
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
          <div className="flex-1 min-h-[240px] p-2 sm:p-3">
            <Viewport />
          </div>

          {/* Bottom panels - collapsible with scroll */}
          <div className={cn(
            "border-t transition-all duration-300 ease-in-out",
            infoExpanded ? "max-h-[50vh]" : "max-h-[180px]"
          )}>
            {/* Controls always visible */}
            <ControlsPanel />
            
            {/* Expandable info panel */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-6 rounded-none text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 border-y"
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
    </div>
  )
}
