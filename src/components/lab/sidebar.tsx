'use client'

import { useEffect, useRef } from 'react'
import { useLabStore, type LabMode, modeInfo } from '@/store/lab-store'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Grid3x3,
  BarChart3,
  Layers,
  ArrowRightLeft,
  Plus,
  Split,
  Square,
  ArrowUpDown,
  Gauge,
  Target,
  ToggleLeft,
  ToggleRight,
  LayoutGrid,
  LayoutList,
  BoxSelect,
  CircleDot,
  ScanLine,
} from 'lucide-react'

const sections = [
  {
    title: '二重积分概念步骤',
    icon: '📐',
    modes: [
      { mode: 'step1' as LabMode, label: '区域划分', icon: Grid3x3 },
      { mode: 'step2' as LabMode, label: '网格划分', icon: LayoutGrid },
      { mode: 'step3' as LabMode, label: '方柱近似', icon: BarChart3 },
      { mode: 'step4' as LabMode, label: '取极限', icon: Layers },
    ],
  },
  {
    title: '二重积分基本性质',
    icon: '📊',
    modes: [
      { mode: 'prop1' as LabMode, label: '常数倍', icon: ArrowRightLeft },
      { mode: 'prop2' as LabMode, label: '加减', icon: Plus },
      { mode: 'prop3' as LabMode, label: '区域可加', icon: Split },
      { mode: 'prop4' as LabMode, label: '常函数', icon: Square },
      { mode: 'prop5' as LabMode, label: '比较', icon: ArrowUpDown },
      { mode: 'prop6' as LabMode, label: '估值', icon: Gauge },
      { mode: 'prop7' as LabMode, label: '中值', icon: Target },
    ],
  },
  {
    title: '奇偶性',
    icon: '🔄',
    modes: [
      { mode: 'parity1' as LabMode, label: '奇函数', icon: ToggleLeft },
      { mode: 'parity2' as LabMode, label: '偶函数', icon: ToggleRight },
    ],
  },
  {
    title: '直角坐标系计算',
    icon: '📏',
    modes: [
      { mode: 'cartesian1' as LabMode, label: 'X型区域', icon: LayoutList },
      { mode: 'cartesian2' as LabMode, label: 'Y型区域', icon: LayoutGrid },
    ],
  },
  {
    title: '矩形近似',
    icon: '🔲',
    modes: [
      { mode: 'rect_approx' as LabMode, label: '矩形近似面积', icon: BoxSelect },
    ],
  },
  {
    title: '球体与圆柱面',
    icon: '🔮',
    modes: [
      { mode: 'sphere_cyl1' as LabMode, label: '相交体', icon: CircleDot },
      { mode: 'sphere_cyl2' as LabMode, label: '截面法', icon: ScanLine },
    ],
  },
]

interface SidebarProps {
  className?: string
  onModeSelect?: () => void
}

export function Sidebar({ className, onModeSelect }: SidebarProps) {
  const { mode, setMode } = useLabStore()
  const activeRef = useRef<HTMLButtonElement>(null)

  // Auto-scroll to active mode when it changes
  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [mode])

  return (
    <ScrollArea className={cn('h-full', className)}>
      <div className="p-2 space-y-3">
        {sections.map((section) => (
          <div key={section.title}>
            <div className="flex items-center gap-1.5 px-2 mb-1">
              <span className="text-[10px]">{section.icon}</span>
              <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                {section.title}
              </h3>
            </div>
            <div className="space-y-0.5">
              {section.modes.map(({ mode: m, label, icon: Icon }) => {
                const isActive = mode === m
                return (
                  <Button
                    key={m}
                    ref={isActive ? activeRef : undefined}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'w-full justify-start gap-2 text-xs h-7 px-2 transition-all relative',
                      isActive
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 font-semibold shadow-sm before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-[3px] before:h-4 before:bg-emerald-500 before:rounded-r'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    )}
                    onClick={() => {
                      setMode(m)
                      onModeSelect?.()
                    }}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{label}</span>
                  </Button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
