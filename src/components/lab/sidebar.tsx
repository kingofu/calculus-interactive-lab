'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
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
  Atom,
  Spline,
  Crosshair,
  Cylinder,
  Search,
  X,
  Navigation,
  Globe,
  Waves,
  Star,
  Check,
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
  {
    title: '斯托克斯定理',
    subtitle: '环量与旋度通量',
    icon: Waypoints,
    color: 'violet',
    modes: [
      { mode: 'stokes1' as LabMode, label: '斯托克斯定理', icon: Waypoints },
    ],
  },
  {
    title: '高斯散度定理',
    subtitle: '通量与散度积分',
    icon: Atom,
    color: 'orange',
    modes: [
      { mode: 'divergence1' as LabMode, label: '高斯散度定理', icon: Atom },
    ],
  },
  {
    title: '弧长与曲线积分',
    subtitle: '弧长近似与精确计算',
    icon: Spline,
    color: 'pink',
    modes: [
      { mode: 'arc_length1' as LabMode, label: '弧长计算', icon: Spline },
    ],
  },
  {
    title: '质心与转动惯量',
    subtitle: '变密度质心与惯量计算',
    icon: Crosshair,
    color: 'cyan',
    modes: [
      { mode: 'mass_center1' as LabMode, label: '质心计算', icon: Crosshair },
      { mode: 'moment_of_inertia1' as LabMode, label: '转动惯量', icon: Crosshair },
    ],
  },
  {
    title: '柱坐标系',
    subtitle: '柱坐标系下体积计算',
    icon: Cylinder,
    color: 'sky',
    modes: [
      { mode: 'cylindrical1' as LabMode, label: '柱坐标计算', icon: Cylinder },
    ],
  },
  {
    title: '梯度场与方向导数',
    subtitle: '梯度向量场与方向导数',
    icon: Navigation,
    color: 'yellow',
    modes: [
      { mode: 'gradient1' as LabMode, label: '梯度场可视化', icon: Navigation },
    ],
  },
  {
    title: '球坐标系计算',
    subtitle: '球坐标体积元素与积分',
    icon: Globe,
    color: 'green',
    modes: [
      { mode: 'spherical1' as LabMode, label: '球坐标计算', icon: Globe },
    ],
  },
  {
    title: '拉普拉斯方程',
    subtitle: '调和函数与拉普拉斯算子',
    icon: Waves,
    color: 'slate',
    modes: [
      { mode: 'laplace1' as LabMode, label: '拉普拉斯算子', icon: Waves },
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
  pink: {
    activeBg: 'bg-pink-100 dark:bg-pink-900/40',
    activeText: 'text-pink-800 dark:text-pink-300',
    border: 'before:bg-pink-500',
    dot: 'bg-pink-500',
    badge: 'bg-pink-200/60 dark:bg-pink-800/40',
    badgeText: 'text-pink-700 dark:text-pink-300',
  },
  yellow: {
    activeBg: 'bg-yellow-100 dark:bg-yellow-900/40',
    activeText: 'text-yellow-800 dark:text-yellow-300',
    border: 'before:bg-yellow-500',
    dot: 'bg-yellow-500',
    badge: 'bg-yellow-200/60 dark:bg-yellow-800/40',
    badgeText: 'text-yellow-700 dark:text-yellow-300',
  },
  green: {
    activeBg: 'bg-green-100 dark:bg-green-900/40',
    activeText: 'text-green-800 dark:text-green-300',
    border: 'before:bg-green-500',
    dot: 'bg-green-500',
    badge: 'bg-green-200/60 dark:bg-green-800/40',
    badgeText: 'text-green-700 dark:text-green-300',
  },
  slate: {
    activeBg: 'bg-slate-100 dark:bg-slate-900/40',
    activeText: 'text-slate-800 dark:text-slate-300',
    border: 'before:bg-slate-500',
    dot: 'bg-slate-500',
    badge: 'bg-slate-200/60 dark:bg-slate-800/40',
    badgeText: 'text-slate-700 dark:text-slate-300',
  },
}

interface SidebarProps {
  className?: string
  onModeSelect?: () => void
}

export function Sidebar({ className, onModeSelect }: SidebarProps) {
  const { mode, setMode, visitedModes, favorites, toggleFavorite, hydrateFavorites } = useLabStore()
  const activeRef = useRef<HTMLButtonElement>(null)
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  const [favoritesCollapsed, setFavoritesCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Hydrate favorites from localStorage on mount
  useEffect(() => {
    hydrateFavorites()
  }, [hydrateFavorites])

  // Debounce search input by 200ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 200)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Filter sections based on search query
  const filteredSections = debouncedQuery
    ? sections.map(s => ({
        ...s,
        modes: s.modes.filter(m =>
          m.label.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
          s.title.toLowerCase().includes(debouncedQuery.toLowerCase())
        )
      })).filter(s => s.modes.length > 0)
    : sections

  const hasNoResults = debouncedQuery.length > 0 && filteredSections.length === 0

  // Build a map from mode to section color for favorites
  const modeToSectionColor = useMemo(() => {
    const map: Record<string, string> = {}
    for (const section of sections) {
      for (const m of section.modes) {
        map[m.mode] = section.color
      }
    }
    return map
  }, [])

  // Build a map from mode to icon component for favorites
  const modeToIcon = useMemo(() => {
    const map: Record<string, typeof Star> = {}
    for (const section of sections) {
      for (const m of section.modes) {
        map[m.mode] = m.icon
      }
    }
    return map
  }, [])

  // Build a map from mode to label for favorites
  const modeToLabel = useMemo(() => {
    const map: Record<string, string> = {}
    for (const section of sections) {
      for (const m of section.modes) {
        map[m.mode] = m.label
      }
    }
    return map
  }, [])

  // Favorites list (ordered by sections order)
  const favoriteModes = useMemo(() => {
    const ordered: LabMode[] = []
    for (const section of sections) {
      for (const m of section.modes) {
        if (favorites.has(m.mode)) {
          ordered.push(m.mode)
        }
      }
    }
    return ordered
  }, [favorites])

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

  // A section should be expanded if it contains the active mode, is not collapsed, or has search matches
  const isSectionExpanded = (section: typeof sections[number]) =>
    isSectionActive(section) || !collapsedSections.has(section.title) || debouncedQuery.length > 0

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

        {/* Search input */}
        <div className="relative px-1 mb-1.5">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-2.5 w-2.5 text-muted-foreground/60" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="搜索模式..."
            className="w-full h-6 pl-6 pr-5 text-[10px] bg-muted/50 border border-border/40 rounded-md placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground/60 hover:text-foreground transition-colors"
              onClick={() => {
                setSearchQuery('')
                searchInputRef.current?.focus()
              }}
            >
              <X className="h-2.5 w-2.5" />
            </button>
          )}
        </div>

        {/* Favorites section */}
        {favoriteModes.length > 0 && (
          <div className="mb-1 pt-1 border-t border-border/30">
            <button
              type="button"
              className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md transition-colors cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-900/20"
              onClick={() => setFavoritesCollapsed(prev => !prev)}
            >
              <Star className="h-3 w-3 shrink-0 text-amber-500 fill-amber-500" />
              <div className="flex-1 min-w-0 text-left">
                <h3 className="text-[10px] font-semibold leading-none text-amber-700 dark:text-amber-300">
                  收藏
                </h3>
              </div>
              <span className="text-[8px] font-mono px-1 py-0 rounded-full shrink-0 bg-amber-200/60 dark:bg-amber-800/40 text-amber-700 dark:text-amber-300">
                {favoriteModes.length}
              </span>
              {favoritesCollapsed ? (
                <ChevronRight className="h-3 w-3 shrink-0 text-amber-500/50" />
              ) : (
                <ChevronDown className="h-3 w-3 shrink-0 text-amber-500/50" />
              )}
            </button>
            <div className={cn(
              "overflow-hidden transition-all duration-200 ease-in-out",
              favoritesCollapsed ? "max-h-0 opacity-0" : "max-h-96 opacity-100"
            )}>
              <div className="space-y-0.5 mt-0.5">
                {favoriteModes.map(favMode => {
                  const isActive = mode === favMode
                  const FavIcon = modeToIcon[favMode]
                  const sectionColor = modeToSectionColor[favMode] || 'emerald'
                  const colors = colorMap[sectionColor] || colorMap.emerald
                  return (
                    <div key={favMode} className="relative">
                      <Button
                        ref={isActive ? activeRef : undefined}
                        variant="ghost"
                        size="sm"
                        className={cn(
                          'w-full justify-start gap-2 text-xs h-7 px-2 pr-7 transition-all relative group',
                          isActive
                            ? `${colors.activeBg} ${colors.activeText} font-semibold shadow-sm before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-[3px] before:h-4 before:rounded-r ${colors.border}`
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        )}
                        onClick={() => {
                          setMode(favMode)
                          onModeSelect?.()
                        }}
                      >
                        {FavIcon && <FavIcon className={cn(
                          "h-3.5 w-3.5 shrink-0 transition-colors",
                          isActive ? '' : 'text-muted-foreground/60 group-hover:text-foreground'
                        )} />}
                        <span className="truncate">{modeToLabel[favMode]}</span>
                      </Button>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 h-4 w-4 flex items-center justify-center rounded-full hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all active:scale-75"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleFavorite(favMode)
                            }}
                          >
                            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="text-xs">取消收藏</TooltipContent>
                      </Tooltip>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {hasNoResults && (
          <div className="text-center py-3 text-[10px] text-muted-foreground/60">
            无匹配结果
          </div>
        )}

        {filteredSections.map((section, sectionIndex) => {
          const colors = colorMap[section.color] || colorMap.emerald
          const SectionIcon = section.icon
          const sectionActive = isSectionActive(section)
          const expanded = isSectionExpanded(section)
          const modeCount = section.modes.length
          const visitedInSection = section.modes.filter(m => visitedModes.has(m.mode)).length
          const allVisited = visitedInSection === modeCount

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
                      {/* Progress bar below section title */}
                      <div className="mt-1 w-full h-[2px] bg-muted/50 rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all duration-500", sectionActive ? colors.dot : 'bg-muted-foreground/30')}
                          style={{ width: `${modeCount > 0 ? (visitedInSection / modeCount) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                    {/* Section count badge: visited/total */}
                    <span className={cn(
                      "text-[8px] font-mono px-1 py-0 rounded-full shrink-0 flex items-center gap-0.5",
                      sectionActive
                        ? cn(colors.badge, colors.badgeText)
                        : 'bg-muted/50 text-muted-foreground/50'
                    )}>
                      {allVisited && <Check className="h-2 w-2 text-emerald-500" />}
                      {visitedInSection}/{modeCount}
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
                    const isFavorited = favorites.has(m)
                    return (
                      <div key={m} className="relative">
                        <Button
                          ref={isActive ? activeRef : undefined}
                          variant="ghost"
                          size="sm"
                          className={cn(
                            'w-full justify-start gap-2 text-xs h-7 px-2 pr-7 transition-all relative group',
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
                        {/* Star toggle button */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className={cn(
                                "absolute right-1.5 top-1/2 -translate-y-1/2 h-4 w-4 flex items-center justify-center rounded-full transition-all active:scale-75",
                                isFavorited
                                  ? 'text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/40'
                                  : 'text-muted-foreground/20 hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                              )}
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleFavorite(m)
                              }}
                            >
                              <Star className={cn(
                                "h-3 w-3 transition-all",
                                isFavorited && 'fill-amber-500'
                              )} />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="text-xs">
                            {isFavorited ? '取消收藏' : '收藏'}
                          </TooltipContent>
                        </Tooltip>
                      </div>
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
