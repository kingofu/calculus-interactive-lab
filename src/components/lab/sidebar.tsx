'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useLabStore, type LabMode, modeInfo } from '@/store/lab-store'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
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
  Compass,
  TrendingUp,
  LineChart,
  Box,
  RefreshCw,
  BookOpen,
  FlaskConical,
  Move3d,
  Sigma,
  Puzzle,
  Orbit,
  Waypoints,
  ChevronRight,
  ChevronDown,
  ChevronsUpDown,
  Mountain,
  GitMerge,
} from 'lucide-react'

const sections = [
  {
    title: '概念理解',
    subtitle: '二重积分定义与步骤',
    icon: BookOpen,
    color: 'emerald',
    modes: [
      { mode: 'step1' as LabMode, label: '区域划分', icon: Grid3x3 },
      { mode: 'step2' as LabMode, label: '网格划分', icon: LayoutGrid },
      { mode: 'step3' as LabMode, label: '方柱近似', icon: BarChart3 },
      { mode: 'step4' as LabMode, label: '取极限', icon: Layers },
    ],
  },
  {
    title: '基本性质',
    subtitle: '线性、可加性、比较等',
    icon: FlaskConical,
    color: 'sky',
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
    subtitle: '对称性化简积分',
    icon: Move3d,
    color: 'orange',
    modes: [
      { mode: 'parity1' as LabMode, label: '奇函数', icon: ToggleLeft },
      { mode: 'parity2' as LabMode, label: '偶函数', icon: ToggleRight },
    ],
  },
  {
    title: '直角坐标',
    subtitle: 'X型/Y型区域计算',
    icon: Sigma,
    color: 'amber',
    modes: [
      { mode: 'cartesian1' as LabMode, label: 'X型区域', icon: LayoutList },
      { mode: 'cartesian2' as LabMode, label: 'Y型区域', icon: LayoutGrid },
    ],
  },
  {
    title: '极坐标',
    subtitle: '极坐标系下计算',
    icon: Orbit,
    color: 'rose',
    modes: [
      { mode: 'polar1' as LabMode, label: '极坐标区域', icon: CircleDot },
      { mode: 'polar2' as LabMode, label: '极坐标黎曼和', icon: Compass },
    ],
  },
  {
    title: '矩形近似',
    subtitle: '一维定积分近似',
    icon: Puzzle,
    color: 'teal',
    modes: [
      { mode: 'rect_approx' as LabMode, label: '矩形近似面积', icon: BoxSelect },
    ],
  },
  {
    title: '球柱相交',
    subtitle: 'Viviani体与截面法',
    icon: Layers,
    color: 'violet',
    modes: [
      { mode: 'sphere_cyl1' as LabMode, label: '相交体', icon: CircleDot },
      { mode: 'sphere_cyl2' as LabMode, label: '截面法', icon: ScanLine },
    ],
  },
  {
    title: '收敛演示',
    subtitle: '数值积分收敛分析',
    icon: TrendingUp,
    color: 'cyan',
    modes: [
      { mode: 'convergence1' as LabMode, label: '收敛动画', icon: TrendingUp },
      { mode: 'convergence2' as LabMode, label: '误差分析', icon: LineChart },
    ],
  },
  {
    title: '三重积分',
    subtitle: '体积分可视化',
    icon: Box,
    color: 'purple',
    modes: [
      { mode: 'triple1' as LabMode, label: '三重积分', icon: Box },
    ],
  },
  {
    title: '变量代换',
    subtitle: '雅可比行列式与坐标变换',
    icon: RefreshCw,
    color: 'lime',
    modes: [
      { mode: 'jacobian1' as LabMode, label: '变量代换', icon: RefreshCw },
    ],
  },
  {
    title: '格林公式',
    subtitle: '线积分与面积分的关系',
    icon: Waypoints,
    color: 'red',
    modes: [
      { mode: 'green1' as LabMode, label: '格林公式', icon: Waypoints },
    ],
  },
  {
    title: '曲面面积',
    subtitle: '曲面面积与弧长',
    icon: Mountain,
    color: 'indigo',
    modes: [
      { mode: 'surface_area1' as LabMode, label: '曲面面积计算', icon: Mountain },
    ],
  },
  {
    title: '富比尼定理',
    subtitle: '富比尼定理与累次积分',
    icon: GitMerge,
    color: 'fuchsia',
    modes: [
      { mode: 'fubini1' as LabMode, label: '富比尼定理', icon: GitMerge },
    ],
  },
]

// Color map for section accent
const colorMap: Record<string, { activeBg: string; activeText: string; border: string; dot: string; badge: string; badgeText: string }> = {
  emerald: {
    activeBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    activeText: 'text-emerald-800 dark:text-emerald-300',
    border: 'before:bg-emerald-500',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-200/60 dark:bg-emerald-800/40',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
  },
  sky: {
    activeBg: 'bg-sky-100 dark:bg-sky-900/40',
    activeText: 'text-sky-800 dark:text-sky-300',
    border: 'before:bg-sky-500',
    dot: 'bg-sky-500',
    badge: 'bg-sky-200/60 dark:bg-sky-800/40',
    badgeText: 'text-sky-700 dark:text-sky-300',
  },
  orange: {
    activeBg: 'bg-orange-100 dark:bg-orange-900/40',
    activeText: 'text-orange-800 dark:text-orange-300',
    border: 'before:bg-orange-500',
    dot: 'bg-orange-500',
    badge: 'bg-orange-200/60 dark:bg-orange-800/40',
    badgeText: 'text-orange-700 dark:text-orange-300',
  },
  amber: {
    activeBg: 'bg-amber-100 dark:bg-amber-900/40',
    activeText: 'text-amber-800 dark:text-amber-300',
    border: 'before:bg-amber-500',
    dot: 'bg-amber-500',
    badge: 'bg-amber-200/60 dark:bg-amber-800/40',
    badgeText: 'text-amber-700 dark:text-amber-300',
  },
  rose: {
    activeBg: 'bg-rose-100 dark:bg-rose-900/40',
    activeText: 'text-rose-800 dark:text-rose-300',
    border: 'before:bg-rose-500',
    dot: 'bg-rose-500',
    badge: 'bg-rose-200/60 dark:bg-rose-800/40',
    badgeText: 'text-rose-700 dark:text-rose-300',
  },
  teal: {
    activeBg: 'bg-teal-100 dark:bg-teal-900/40',
    activeText: 'text-teal-800 dark:text-teal-300',
    border: 'before:bg-teal-500',
    dot: 'bg-teal-500',
    badge: 'bg-teal-200/60 dark:bg-teal-800/40',
    badgeText: 'text-teal-700 dark:text-teal-300',
  },
  violet: {
    activeBg: 'bg-violet-100 dark:bg-violet-900/40',
    activeText: 'text-violet-800 dark:text-violet-300',
    border: 'before:bg-violet-500',
    dot: 'bg-violet-500',
    badge: 'bg-violet-200/60 dark:bg-violet-800/40',
    badgeText: 'text-violet-700 dark:text-violet-300',
  },
  cyan: {
    activeBg: 'bg-cyan-100 dark:bg-cyan-900/40',
    activeText: 'text-cyan-800 dark:text-cyan-300',
    border: 'before:bg-cyan-500',
    dot: 'bg-cyan-500',
    badge: 'bg-cyan-200/60 dark:bg-cyan-800/40',
    badgeText: 'text-cyan-700 dark:text-cyan-300',
  },
  purple: {
    activeBg: 'bg-purple-100 dark:bg-purple-900/40',
    activeText: 'text-purple-800 dark:text-purple-300',
    border: 'before:bg-purple-500',
    dot: 'bg-purple-500',
    badge: 'bg-purple-200/60 dark:bg-purple-800/40',
    badgeText: 'text-purple-700 dark:text-purple-300',
  },
  lime: {
    activeBg: 'bg-lime-100 dark:bg-lime-900/40',
    activeText: 'text-lime-800 dark:text-lime-300',
    border: 'before:bg-lime-500',
    dot: 'bg-lime-500',
    badge: 'bg-lime-200/60 dark:bg-lime-800/40',
    badgeText: 'text-lime-700 dark:text-lime-300',
  },
  red: {
    activeBg: 'bg-red-100 dark:bg-red-900/40',
    activeText: 'text-red-800 dark:text-red-300',
    border: 'before:bg-red-500',
    dot: 'bg-red-500',
    badge: 'bg-red-200/60 dark:bg-red-800/40',
    badgeText: 'text-red-700 dark:text-red-300',
  },
  indigo: {
    activeBg: 'bg-indigo-100 dark:bg-indigo-900/40',
    activeText: 'text-indigo-800 dark:text-indigo-300',
    border: 'before:bg-indigo-500',
    dot: 'bg-indigo-500',
    badge: 'bg-indigo-200/60 dark:bg-indigo-800/40',
    badgeText: 'text-indigo-700 dark:text-indigo-300',
  },
  fuchsia: {
    activeBg: 'bg-fuchsia-100 dark:bg-fuchsia-900/40',
    activeText: 'text-fuchsia-800 dark:text-fuchsia-300',
    border: 'before:bg-fuchsia-500',
    dot: 'bg-fuchsia-500',
    badge: 'bg-fuchsia-200/60 dark:bg-fuchsia-800/40',
    badgeText: 'text-fuchsia-700 dark:text-fuchsia-300',
  },
}

interface SidebarProps {
  className?: string
  onModeSelect?: () => void
}

export function Sidebar({ className, onModeSelect }: SidebarProps) {
  const { mode, setMode } = useLabStore()
  const activeRef = useRef<HTMLButtonElement>(null)
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())

  // Auto-scroll to active mode when it changes
  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [mode])

  const toggleSection = useCallback((title: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev)
      if (next.has(title)) {
        next.delete(title)
      } else {
        next.add(title)
      }
      return next
    })
  }, [])

  const toggleAllSections = useCallback(() => {
    setCollapsedSections(prev => {
      // If any section is expanded, collapse all. Otherwise, expand all.
      const anyExpanded = sections.some(s => !prev.has(s.title))
      if (anyExpanded) {
        return new Set(sections.map(s => s.title))
      } else {
        return new Set()
      }
    })
  }, [])

  // Check if a section contains the active mode
  const isSectionActive = (section: typeof sections[number]) =>
    section.modes.some(m => m.mode === mode)

  // A section should be expanded if it contains the active mode or is not collapsed
  const isSectionExpanded = (section: typeof sections[number]) =>
    isSectionActive(section) || !collapsedSections.has(section.title)

  const allCollapsed = sections.every(s => collapsedSections.has(s.title))

  return (
    <ScrollArea className={cn('h-full', className)}>
      <div className="p-2 space-y-0">
        {/* Expand/Collapse all button */}
        <div className="flex items-center justify-between px-2 mb-1.5">
          <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">
            导航
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 px-1.5 text-[9px] text-muted-foreground hover:text-foreground gap-1"
            onClick={toggleAllSections}
          >
            <ChevronsUpDown className="h-2.5 w-2.5" />
            {allCollapsed ? '全部展开' : '全部收起'}
          </Button>
        </div>

        {sections.map((section, sectionIndex) => {
          const colors = colorMap[section.color] || colorMap.emerald
          const SectionIcon = section.icon
          const sectionActive = isSectionActive(section)
          const expanded = isSectionExpanded(section)
          const modeCount = section.modes.length

          return (
            <div key={section.title} className={cn(
              sectionIndex > 0 && "mt-1 pt-1 border-t border-border/30"
            )}>
              {/* Section header - clickable to toggle collapse */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md transition-colors cursor-pointer",
                      sectionActive ? colors.activeBg + ' ' + colors.activeText : 'hover:bg-accent/50'
                    )}
                    onClick={() => toggleSection(section.title)}
                  >
                    <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", sectionActive ? colors.dot : 'bg-muted-foreground/30')} />
                    <SectionIcon className={cn("h-3 w-3 shrink-0", sectionActive ? '' : 'text-muted-foreground')} />
                    <div className="flex-1 min-w-0 text-left">
                      <h3 className={cn(
                        "text-[10px] font-semibold leading-none",
                        sectionActive ? '' : 'text-muted-foreground'
                      )}>
                        {section.title}
                      </h3>
                      <p className={cn(
                        "text-[8px] leading-none mt-0.5 truncate",
                        sectionActive ? 'opacity-70' : 'text-muted-foreground/50'
                      )}>
                        {section.subtitle}
                      </p>
                    </div>
                    {/* Section count badge */}
                    <span className={cn(
                      "text-[8px] font-mono px-1 py-0 rounded-full shrink-0",
                      sectionActive
                        ? cn(colors.badge, colors.badgeText)
                        : 'bg-muted/50 text-muted-foreground/50'
                    )}>
                      {modeCount}
                    </span>
                    {expanded ? (
                      <ChevronDown className={cn("h-3 w-3 shrink-0", sectionActive ? '' : 'text-muted-foreground/50')} />
                    ) : (
                      <ChevronRight className={cn("h-3 w-3 shrink-0", sectionActive ? '' : 'text-muted-foreground/50')} />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs max-w-[200px]">
                  <span className="font-medium">{section.title}</span>
                  <span className="text-muted-foreground"> — {section.subtitle}</span>
                </TooltipContent>
              </Tooltip>

              {/* Mode buttons - collapsible */}
              <div
                className={cn(
                  "overflow-hidden transition-all duration-200 ease-in-out",
                  expanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                )}
              >
                <div className="space-y-0.5 mt-0.5">
                  {section.modes.map(({ mode: m, label, icon: Icon }) => {
                    const isActive = mode === m
                    return (
                      <Button
                        key={m}
                        ref={isActive ? activeRef : undefined}
                        variant="ghost"
                        size="sm"
                        className={cn(
                          'w-full justify-start gap-2 text-xs h-7 px-2 transition-all relative group',
                          isActive
                            ? `${colors.activeBg} ${colors.activeText} font-semibold shadow-sm before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-[3px] before:h-4 before:rounded-r ${colors.border}`
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        )}
                        onClick={() => {
                          setMode(m)
                          onModeSelect?.()
                        }}
                      >
                        <Icon className={cn(
                          "h-3.5 w-3.5 shrink-0 transition-colors",
                          isActive ? '' : 'text-muted-foreground/60 group-hover:text-foreground'
                        )} />
                        <span className="truncate">{label}</span>
                      </Button>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}
