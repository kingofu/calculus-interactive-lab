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
  Activity,
  Wind,
  Trophy,
  RotateCw,
  Shield,
  Calculator,
  type LucideIcon,
} from 'lucide-react'

// ── Two-level directory: Chapters → Sections → Modes ──

interface ModeEntry {
  mode: LabMode
  label: string
  icon: LucideIcon
}

interface SectionEntry {
  title: string
  subtitle: string
  color: string
  modes: ModeEntry[]
}

interface ChapterEntry {
  title: string
  subtitle: string
  icon: LucideIcon
  color: string
  sections: SectionEntry[]
}

const chapters: ChapterEntry[] = [
  {
    title: '函数与极限',
    subtitle: '极限、连续与间断点',
    icon: Target,
    color: 'rose',
    sections: [
      {
        title: '极限概念',
        subtitle: '数列极限与函数极限',
        color: 'rose',
        modes: [
          { mode: 'limit1' as LabMode, label: '数列极限', icon: Target },
          { mode: 'limit2' as LabMode, label: '函数极限ε-δ', icon: Crosshair },

        ],
      },
      {
        title: '连续性',
        subtitle: '函数连续与间断点',
        color: 'pink',
        modes: [
          { mode: 'continuity1' as LabMode, label: '函数连续性', icon: Activity },
          { mode: 'discontinuity1' as LabMode, label: '间断点类型', icon: Shield },
        ],
      },
    ],
  },
  {
    title: '导数与微分',
    subtitle: '导数定义与几何意义',
    icon: TrendingUp,
    color: 'amber',
    sections: [
      {
        title: '导数概念',
        subtitle: '导数定义与几何意义',
        color: 'amber',
        modes: [
          { mode: 'derivative1' as LabMode, label: '导数定义', icon: Spline },
          { mode: 'derivative2' as LabMode, label: '切线与导函数', icon: Navigation },
          { mode: 'derivative3' as LabMode, label: '微分与线性近似', icon: ArrowRightLeft },
        ],
      },
    ],
  },
  {
    title: '微分中值定理',
    subtitle: '罗尔、拉格朗日与泰勒',
    icon: BookOpen,
    color: 'red',
    sections: [
      {
        title: '中值定理',
        subtitle: '罗尔定理与拉格朗日中值定理',
        color: 'red',
        modes: [
          { mode: 'rolle1' as LabMode, label: '罗尔定理', icon: Target },
          { mode: 'lagrange1' as LabMode, label: '拉格朗日中值定理', icon: Waypoints },
        ],
      },
    ],
  },
  {
    title: '导数的应用',
    subtitle: '单调性、极值、凹凸性与曲率',
    icon: LineChart,
    color: 'teal',
    sections: [
      {
        title: '单调性与极值',
        subtitle: '函数增减与极值判定',
        color: 'teal',
        modes: [
          { mode: 'monotonicity1' as LabMode, label: '函数单调性', icon: TrendingUp },
          { mode: 'extrema1' as LabMode, label: '函数极值', icon: Target },
        ],
      },
      {
        title: '凹凸性与曲率',
        subtitle: '函数凹凸性与曲率计算',
        color: 'cyan',
        modes: [
          { mode: 'concavity1' as LabMode, label: '凹凸性与拐点', icon: Spline },
          { mode: 'curvature1' as LabMode, label: '曲率', icon: CircleDot },
        ],
      },
    ],
  },
  {
    title: '不定积分',
    subtitle: '原函数族',
    icon: Sigma,
    color: 'purple',
    sections: [
      {
        title: '原函数',
        subtitle: '原函数族与不定积分',
        color: 'purple',
        modes: [
          { mode: 'indef_integral1' as LabMode, label: '原函数族', icon: Layers },
        ],
      },
    ],
  },
  {
    title: '定积分',
    subtitle: '定积分概念、性质与计算',
    icon: BarChart3,
    color: 'emerald',
    sections: [
      {
        title: '定积分概念与性质',
        subtitle: '矩形近似、微积分基本定理与积分中值',
        color: 'emerald',
        modes: [
          { mode: 'rect_approx' as LabMode, label: '矩形近似', icon: BoxSelect },
          { mode: 'ftc1' as LabMode, label: '微积分基本定理', icon: GitMerge },
          { mode: 'mean_value_integral1' as LabMode, label: '积分中值定理', icon: Target },
          { mode: 'improper_integral1' as LabMode, label: '反常积分', icon: Waves },
        ],
      },
    ],
  },
  {
    title: '定积分的应用',
    subtitle: '面积、体积、弧长与极坐标',
    icon: FlaskConical,
    color: 'sky',
    sections: [
      {
        title: '面积与体积',
        subtitle: '曲线间面积与旋转体体积',
        color: 'sky',
        modes: [
          { mode: 'area1' as LabMode, label: '曲线间面积', icon: BoxSelect },
          { mode: 'volume_rev1' as LabMode, label: '旋转体体积', icon: Cylinder },
          { mode: 'polar_area1' as LabMode, label: '极坐标面积', icon: CircleDot },
        ],
      },
      {
        title: '弧长',
        subtitle: '弧长计算',
        color: 'pink',
        modes: [
          { mode: 'arc_length1' as LabMode, label: '弧长计算', icon: Spline },
        ],
      },
    ],
  },
  {
    title: '二重积分基础',
    subtitle: '定义、性质与对称性',
    icon: BookOpen,
    color: 'emerald',
    sections: [
      {
        title: '概念理解',
        subtitle: '二重积分定义与步骤',
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
        color: 'sky',
        modes: [
          { mode: 'prop3' as LabMode, label: '区域可加', icon: Split },
          { mode: 'prop6' as LabMode, label: '估值', icon: Gauge },
          { mode: 'prop7' as LabMode, label: '中值', icon: Target },
        ],
      },
      {
        title: '奇偶性',
        subtitle: '对称性化简积分',
        color: 'orange',
        modes: [
          { mode: 'parity1' as LabMode, label: '奇函数', icon: ToggleLeft },
          { mode: 'parity2' as LabMode, label: '偶函数', icon: ToggleRight },
        ],
      },
    ],
  },
  {
    title: '积分计算方法',
    subtitle: '坐标变换与累次积分',
    icon: Calculator,
    color: 'sky',
    sections: [
      {
        title: '直角坐标',
        subtitle: 'X型/Y型区域计算',
        color: 'amber',
        modes: [
          { mode: 'cartesian1' as LabMode, label: 'X型区域', icon: LayoutList },
          { mode: 'cartesian2' as LabMode, label: 'Y型区域', icon: LayoutGrid },
        ],
      },
      {
        title: '极坐标',
        subtitle: '极坐标系下计算',
        color: 'rose',
        modes: [
          { mode: 'polar1' as LabMode, label: '极坐标区域', icon: CircleDot },
          { mode: 'polar2' as LabMode, label: '极坐标黎曼和', icon: Compass },
        ],
      },
      {
        title: '变量代换',
        subtitle: '雅可比行列式与坐标变换',
        color: 'lime',
        modes: [
          { mode: 'jacobian1' as LabMode, label: '变量代换', icon: RefreshCw },
        ],
      },
      {
        title: '富比尼定理',
        subtitle: '富比尼定理与累次积分',
        color: 'fuchsia',
        modes: [
          { mode: 'fubini1' as LabMode, label: '富比尼定理', icon: GitMerge },
        ],
      },
    ],
  },
  {
    title: '积分应用',
    subtitle: '曲面面积、质心与球柱相交',
    icon: FlaskConical,
    color: 'amber',
    sections: [
      {
        title: '曲面面积',
        subtitle: '曲面面积与弧长',
        color: 'indigo',
        modes: [
          { mode: 'surface_area1' as LabMode, label: '曲面面积计算', icon: Mountain },
        ],
      },
      {
        title: '质心与转动惯量',
        subtitle: '变密度质心与惯量计算',
        color: 'cyan',
        modes: [
          { mode: 'mass_center1' as LabMode, label: '质心计算', icon: Crosshair },
          { mode: 'moment_of_inertia1' as LabMode, label: '转动惯量', icon: Crosshair },
        ],
      },
      {
        title: '球柱相交',
        subtitle: 'Viviani体与截面法',
        color: 'violet',
        modes: [
          { mode: 'sphere_cyl1' as LabMode, label: '相交体', icon: CircleDot },
          { mode: 'sphere_cyl2' as LabMode, label: '截面法', icon: ScanLine },
        ],
      },
    ],
  },
  {
    title: '三重积分',
    subtitle: '体积分与坐标变换',
    icon: Box,
    color: 'purple',
    sections: [
      {
        title: '三重积分',
        subtitle: '体积分可视化',
        color: 'purple',
        modes: [
          { mode: 'triple1' as LabMode, label: '三重积分', icon: Box },
        ],
      },
      {
        title: '柱坐标系',
        subtitle: '柱坐标系下体积计算',
        color: 'sky',
        modes: [
          { mode: 'cylindrical1' as LabMode, label: '柱坐标计算', icon: Cylinder },
        ],
      },
      {
        title: '球坐标系计算',
        subtitle: '球坐标体积元素与积分',
        color: 'green',
        modes: [
          { mode: 'spherical1' as LabMode, label: '球坐标计算', icon: Globe },
        ],
      },
    ],
  },
  {
    title: '积分定理',
    subtitle: '格林、斯托克斯、高斯',
    icon: Waypoints,
    color: 'red',
    sections: [
      {
        title: '格林公式',
        subtitle: '线积分与面积分的关系',
        color: 'red',
        modes: [
          { mode: 'green1' as LabMode, label: '格林公式', icon: Waypoints },
        ],
      },
      {
        title: '斯托克斯定理',
        subtitle: '环量与旋度通量',
        color: 'violet',
        modes: [
          { mode: 'stokes1' as LabMode, label: '斯托克斯定理', icon: Waypoints },
        ],
      },
      {
        title: '高斯散度定理',
        subtitle: '通量与散度积分',
        color: 'orange',
        modes: [
          { mode: 'divergence1' as LabMode, label: '高斯散度定理', icon: Atom },
        ],
      },
    ],
  },
  {
    title: '向量场与微分算子',
    subtitle: '梯度、旋度、散度与势函数',
    icon: Navigation,
    color: 'teal',
    sections: [
      {
        title: '梯度场与方向导数',
        subtitle: '梯度向量场与方向导数',
        color: 'yellow',
        modes: [
          { mode: 'gradient1' as LabMode, label: '梯度场可视化', icon: Navigation },
          { mode: 'directional1' as LabMode, label: '方向导数', icon: Compass },
        ],
      },
      {
        title: '向量场线积分',
        subtitle: '向量场线积分计算',
        color: 'teal',
        modes: [
          { mode: 'vector_field1' as LabMode, label: '向量场线积分', icon: Wind },
        ],
      },
      {
        title: '旋度场与散度场',
        subtitle: '旋度与散度可视化',
        color: 'rose',
        modes: [
          { mode: 'curl1' as LabMode, label: '旋度场可视化', icon: RotateCw },
          { mode: 'divergence_field1' as LabMode, label: '散度场可视化', icon: RotateCw },
        ],
      },
      {
        title: '保守场与势函数',
        subtitle: '保守场、势函数与路径无关性',
        color: 'emerald',
        modes: [
          { mode: 'conservative1' as LabMode, label: '保守场与势函数', icon: Shield },
        ],
      },
      {
        title: '拉普拉斯方程',
        subtitle: '调和函数与拉普拉斯算子',
        color: 'slate',
        modes: [
          { mode: 'laplace1' as LabMode, label: '拉普拉斯算子', icon: Waves },
        ],
      },
    ],
  },
  {
    title: '级数与逼近',
    subtitle: '收敛、傅里叶与等值面',
    icon: TrendingUp,
    color: 'orange',
    sections: [
      {
        title: '收敛演示',
        subtitle: '数值积分收敛过程',
        color: 'cyan',
        modes: [
          { mode: 'convergence1' as LabMode, label: '收敛动画', icon: TrendingUp },
        ],
      },
      {
        title: '傅里叶级数与逼近',
        subtitle: '傅里叶级数展开与近似',
        color: 'orange',
        modes: [
          { mode: 'fourier1' as LabMode, label: '傅里叶级数逼近', icon: Activity },
        ],
      },
      {
        title: '等值面与等高线',
        subtitle: '等值面与等高线可视化',
        color: 'cyan',
        modes: [
          { mode: 'isosurface1' as LabMode, label: '等值面与等高线', icon: Layers },
        ],
      },
      {
        title: '曲面积分',
        subtitle: '对面积的曲面积分',
        color: 'violet',
        modes: [
          { mode: 'surface_integral1' as LabMode, label: '对面积的曲面积分', icon: Mountain },
        ],
      },
    ],
  },
]

// Flatten for utility lookups
const flatSections = chapters.flatMap(ch =>
  ch.sections.map(sec => ({ ...sec, chapterTitle: ch.title, chapterColor: ch.color }))
)

// Color map for section accent
const colorMap: Record<string, { activeBg: string; activeText: string; border: string; dot: string; badge: string; badgeText: string; hoverBg: string }> = {
  emerald: {
    activeBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    activeText: 'text-emerald-800 dark:text-emerald-300',
    border: 'before:bg-emerald-500',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-200/60 dark:bg-emerald-800/40',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    hoverBg: 'hover:bg-gradient-to-r hover:from-emerald-50/80 hover:to-emerald-50/30 dark:hover:from-emerald-900/20 dark:hover:to-emerald-900/10',
  },
  sky: {
    activeBg: 'bg-sky-100 dark:bg-sky-900/40',
    activeText: 'text-sky-800 dark:text-sky-300',
    border: 'before:bg-sky-500',
    dot: 'bg-sky-500',
    badge: 'bg-sky-200/60 dark:bg-sky-800/40',
    badgeText: 'text-sky-700 dark:text-sky-300',
    hoverBg: 'hover:bg-gradient-to-r hover:from-sky-50/80 hover:to-sky-50/30 dark:hover:from-sky-900/20 dark:hover:to-sky-900/10',
  },
  orange: {
    activeBg: 'bg-orange-100 dark:bg-orange-900/40',
    activeText: 'text-orange-800 dark:text-orange-300',
    border: 'before:bg-orange-500',
    dot: 'bg-orange-500',
    badge: 'bg-orange-200/60 dark:bg-orange-800/40',
    badgeText: 'text-orange-700 dark:text-orange-300',
    hoverBg: 'hover:bg-gradient-to-r hover:from-orange-50/80 hover:to-orange-50/30 dark:hover:from-orange-900/20 dark:hover:to-orange-900/10',
  },
  amber: {
    activeBg: 'bg-amber-100 dark:bg-amber-900/40',
    activeText: 'text-amber-800 dark:text-amber-300',
    border: 'before:bg-amber-500',
    dot: 'bg-amber-500',
    badge: 'bg-amber-200/60 dark:bg-amber-800/40',
    badgeText: 'text-amber-700 dark:text-amber-300',
    hoverBg: 'hover:bg-gradient-to-r hover:from-amber-50/80 hover:to-amber-50/30 dark:hover:from-amber-900/20 dark:hover:to-amber-900/10',
  },
  rose: {
    activeBg: 'bg-rose-100 dark:bg-rose-900/40',
    activeText: 'text-rose-800 dark:text-rose-300',
    border: 'before:bg-rose-500',
    dot: 'bg-rose-500',
    badge: 'bg-rose-200/60 dark:bg-rose-800/40',
    badgeText: 'text-rose-700 dark:text-rose-300',
    hoverBg: 'hover:bg-gradient-to-r hover:from-rose-50/80 hover:to-rose-50/30 dark:hover:from-rose-900/20 dark:hover:to-rose-900/10',
  },
  teal: {
    activeBg: 'bg-teal-100 dark:bg-teal-900/40',
    activeText: 'text-teal-800 dark:text-teal-300',
    border: 'before:bg-teal-500',
    dot: 'bg-teal-500',
    badge: 'bg-teal-200/60 dark:bg-teal-800/40',
    badgeText: 'text-teal-700 dark:text-teal-300',
    hoverBg: 'hover:bg-gradient-to-r hover:from-teal-50/80 hover:to-teal-50/30 dark:hover:from-teal-900/20 dark:hover:to-teal-900/10',
  },
  violet: {
    activeBg: 'bg-violet-100 dark:bg-violet-900/40',
    activeText: 'text-violet-800 dark:text-violet-300',
    border: 'before:bg-violet-500',
    dot: 'bg-violet-500',
    badge: 'bg-violet-200/60 dark:bg-violet-800/40',
    badgeText: 'text-violet-700 dark:text-violet-300',
    hoverBg: 'hover:bg-gradient-to-r hover:from-violet-50/80 hover:to-violet-50/30 dark:hover:from-violet-900/20 dark:hover:to-violet-900/10',
  },
  cyan: {
    activeBg: 'bg-cyan-100 dark:bg-cyan-900/40',
    activeText: 'text-cyan-800 dark:text-cyan-300',
    border: 'before:bg-cyan-500',
    dot: 'bg-cyan-500',
    badge: 'bg-cyan-200/60 dark:bg-cyan-800/40',
    badgeText: 'text-cyan-700 dark:text-cyan-300',
    hoverBg: 'hover:bg-gradient-to-r hover:from-cyan-50/80 hover:to-cyan-50/30 dark:hover:from-cyan-900/20 dark:hover:to-cyan-900/10',
  },
  purple: {
    activeBg: 'bg-purple-100 dark:bg-purple-900/40',
    activeText: 'text-purple-800 dark:text-purple-300',
    border: 'before:bg-purple-500',
    dot: 'bg-purple-500',
    badge: 'bg-purple-200/60 dark:bg-purple-800/40',
    badgeText: 'text-purple-700 dark:text-purple-300',
    hoverBg: 'hover:bg-gradient-to-r hover:from-purple-50/80 hover:to-purple-50/30 dark:hover:from-purple-900/20 dark:hover:to-purple-900/10',
  },
  lime: {
    activeBg: 'bg-lime-100 dark:bg-lime-900/40',
    activeText: 'text-lime-800 dark:text-lime-300',
    border: 'before:bg-lime-500',
    dot: 'bg-lime-500',
    badge: 'bg-lime-200/60 dark:bg-lime-800/40',
    badgeText: 'text-lime-700 dark:text-lime-300',
    hoverBg: 'hover:bg-gradient-to-r hover:from-lime-50/80 hover:to-lime-50/30 dark:hover:from-lime-900/20 dark:hover:to-lime-900/10',
  },
  red: {
    activeBg: 'bg-red-100 dark:bg-red-900/40',
    activeText: 'text-red-800 dark:text-red-300',
    border: 'before:bg-red-500',
    dot: 'bg-red-500',
    badge: 'bg-red-200/60 dark:bg-red-800/40',
    badgeText: 'text-red-700 dark:text-red-300',
    hoverBg: 'hover:bg-gradient-to-r hover:from-red-50/80 hover:to-red-50/30 dark:hover:from-red-900/20 dark:hover:to-red-900/10',
  },
  indigo: {
    activeBg: 'bg-indigo-100 dark:bg-indigo-900/40',
    activeText: 'text-indigo-800 dark:text-indigo-300',
    border: 'before:bg-indigo-500',
    dot: 'bg-indigo-500',
    badge: 'bg-indigo-200/60 dark:bg-indigo-800/40',
    badgeText: 'text-indigo-700 dark:text-indigo-300',
    hoverBg: 'hover:bg-gradient-to-r hover:from-indigo-50/80 hover:to-indigo-50/30 dark:hover:from-indigo-900/20 dark:hover:to-indigo-900/10',
  },
  fuchsia: {
    activeBg: 'bg-fuchsia-100 dark:bg-fuchsia-900/40',
    activeText: 'text-fuchsia-800 dark:text-fuchsia-300',
    border: 'before:bg-fuchsia-500',
    dot: 'bg-fuchsia-500',
    badge: 'bg-fuchsia-200/60 dark:bg-fuchsia-800/40',
    badgeText: 'text-fuchsia-700 dark:text-fuchsia-300',
    hoverBg: 'hover:bg-gradient-to-r hover:from-fuchsia-50/80 hover:to-fuchsia-50/30 dark:hover:from-fuchsia-900/20 dark:hover:to-fuchsia-900/10',
  },
  pink: {
    activeBg: 'bg-pink-100 dark:bg-pink-900/40',
    activeText: 'text-pink-800 dark:text-pink-300',
    border: 'before:bg-pink-500',
    dot: 'bg-pink-500',
    badge: 'bg-pink-200/60 dark:bg-pink-800/40',
    badgeText: 'text-pink-700 dark:text-pink-300',
    hoverBg: 'hover:bg-gradient-to-r hover:from-pink-50/80 hover:to-pink-50/30 dark:hover:from-pink-900/20 dark:hover:to-pink-900/10',
  },
  yellow: {
    activeBg: 'bg-yellow-100 dark:bg-yellow-900/40',
    activeText: 'text-yellow-800 dark:text-yellow-300',
    border: 'before:bg-yellow-500',
    dot: 'bg-yellow-500',
    badge: 'bg-yellow-200/60 dark:bg-yellow-800/40',
    badgeText: 'text-yellow-700 dark:text-yellow-300',
    hoverBg: 'hover:bg-gradient-to-r hover:from-yellow-50/80 hover:to-yellow-50/30 dark:hover:from-yellow-900/20 dark:hover:to-yellow-900/10',
  },
  green: {
    activeBg: 'bg-green-100 dark:bg-green-900/40',
    activeText: 'text-green-800 dark:text-green-300',
    border: 'before:bg-green-500',
    dot: 'bg-green-500',
    badge: 'bg-green-200/60 dark:bg-green-800/40',
    badgeText: 'text-green-700 dark:text-green-300',
    hoverBg: 'hover:bg-gradient-to-r hover:from-green-50/80 hover:to-green-50/30 dark:hover:from-green-900/20 dark:hover:to-green-900/10',
  },
  slate: {
    activeBg: 'bg-slate-100 dark:bg-slate-900/40',
    activeText: 'text-slate-800 dark:text-slate-300',
    border: 'before:bg-slate-500',
    dot: 'bg-slate-500',
    badge: 'bg-slate-200/60 dark:bg-slate-800/40',
    badgeText: 'text-slate-700 dark:text-slate-300',
    hoverBg: 'hover:bg-gradient-to-r hover:from-slate-50/80 hover:to-slate-50/30 dark:hover:from-slate-900/20 dark:hover:to-slate-900/10',
  },
}

interface SidebarProps {
  className?: string
  onModeSelect?: () => void
}

export function Sidebar({ className, onModeSelect }: SidebarProps) {
  const { mode, setMode, visitedModes, favorites, toggleFavorite, hydrateFavorites } = useLabStore()
  const activeRef = useRef<HTMLButtonElement>(null)
  const [collapsedChapters, setCollapsedChapters] = useState<Set<string>>(() => new Set(chapters.map(ch => ch.title)))
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(() => {
    const all = new Set<string>()
    for (const ch of chapters) {
      for (const sec of ch.sections) {
        all.add(`${ch.title}/${sec.title}`)
      }
    }
    return all
  })
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

  // Total mode count for progress calculation
  const totalModeCount = flatSections.reduce((acc, s) => acc + s.modes.length, 0)

  // Build utility maps from flat sections
  const modeToSectionColor = useMemo(() => {
    const map: Record<string, string> = {}
    for (const sec of flatSections) {
      for (const m of sec.modes) {
        map[m.mode] = sec.color
      }
    }
    return map
  }, [])

  const modeToIcon = useMemo(() => {
    const map: Record<string, typeof Star> = {}
    for (const sec of flatSections) {
      for (const m of sec.modes) {
        map[m.mode] = m.icon
      }
    }
    return map
  }, [])

  const modeToLabel = useMemo(() => {
    const map: Record<string, string> = {}
    for (const sec of flatSections) {
      for (const m of sec.modes) {
        map[m.mode] = m.label
      }
    }
    return map
  }, [])

  // Favorites list (ordered by chapters/sections order)
  const favoriteModes = useMemo(() => {
    const ordered: LabMode[] = []
    for (const ch of chapters) {
      for (const sec of ch.sections) {
        for (const m of sec.modes) {
          if (favorites.has(m.mode)) {
            ordered.push(m.mode)
          }
        }
      }
    }
    return ordered
  }, [favorites])

  // Auto-scroll to active mode when it changes
  useEffect(() => {
    requestAnimationFrame(() => {
      if (activeRef.current) {
        activeRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    })
  }, [mode])

  // Handle mode change: set mode AND auto-expand the chapter+section
  const handleModeChange = useCallback((newMode: LabMode) => {
    setMode(newMode)
    // Find which chapter and section contain this mode
    for (const ch of chapters) {
      for (const sec of ch.sections) {
        if (sec.modes.some(m => m.mode === newMode)) {
          setCollapsedChapters(prev => {
            if (prev.has(ch.title)) {
              const next = new Set(prev)
              next.delete(ch.title)
              return next
            }
            return prev
          })
          setCollapsedSections(prev => {
            const key = `${ch.title}/${sec.title}`
            if (prev.has(key)) {
              const next = new Set(prev)
              next.delete(key)
              return next
            }
            return prev
          })
          return
        }
      }
    }
  }, [setMode])

  const toggleChapter = useCallback((title: string) => {
    setCollapsedChapters(prev => {
      const next = new Set(prev)
      if (next.has(title)) {
        next.delete(title)
      } else {
        next.add(title)
      }
      return next
    })
  }, [])

  const toggleSection = useCallback((key: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }, [])

  const toggleAllChapters = useCallback(() => {
    setCollapsedChapters(prev => {
      const anyExpanded = chapters.some(ch => !prev.has(ch.title))
      if (anyExpanded) {
        return new Set(chapters.map(ch => ch.title))
      } else {
        return new Set()
      }
    })
  }, [])

  // Check if a chapter contains the active mode
  const isChapterActive = (chapter: ChapterEntry) =>
    chapter.sections.some(sec => sec.modes.some(m => m.mode === mode))

  // Check if a section contains the active mode
  const isSectionActive = (section: SectionEntry) =>
    section.modes.some(m => m.mode === mode)

  // Chapter is expanded unless explicitly collapsed (search overrides)
  const isChapterExpanded = (chapter: ChapterEntry) => {
    if (debouncedQuery.length > 0) return true
    return !collapsedChapters.has(chapter.title)
  }

  // Section is expanded unless explicitly collapsed (search overrides)
  const isSectionExpanded = (chapterTitle: string, sectionTitle: string) => {
    if (debouncedQuery.length > 0) return true
    return !collapsedSections.has(`${chapterTitle}/${sectionTitle}`)
  }

  // Filter chapters based on search query
  const filteredChapters = useMemo(() => {
    if (!debouncedQuery) return chapters
    return chapters.map(ch => ({
      ...ch,
      sections: ch.sections.map(sec => ({
        ...sec,
        modes: sec.modes.filter(m =>
          m.label.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
          sec.title.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
          ch.title.toLowerCase().includes(debouncedQuery.toLowerCase())
        ),
      })).filter(sec => sec.modes.length > 0),
    })).filter(ch => ch.sections.length > 0)
  }, [debouncedQuery])

  const hasNoResults = debouncedQuery.length > 0 && filteredChapters.length === 0
  const allCollapsed = chapters.every(ch => collapsedChapters.has(ch.title))

  return (
    <ScrollArea className={cn('h-full', className)}>
      <nav role="navigation" aria-label="模式导航" className="p-2 space-y-0">
        {/* Expand/Collapse all button */}
        <div className="flex items-center justify-between px-2 mb-1.5">
          <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">
            导航
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 px-1.5 text-[9px] text-muted-foreground hover:text-foreground gap-1"
            onClick={toggleAllChapters}
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
              aria-expanded={!favoritesCollapsed}
              aria-controls="favorites-list"
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
            <div id="favorites-list" className={cn(
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
                    <div key={favMode} className="relative" role="treeitem" aria-selected={isActive}>
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
                          handleModeChange(favMode)
                          onModeSelect?.()
                        }}
                        aria-label={modeToLabel[favMode] + (isActive ? ' (当前)' : '')}
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

        {/* ── Two-level directory: Chapters → Sections → Modes ── */}
        {filteredChapters.map((chapter) => {
          const chapterColors = colorMap[chapter.color] || colorMap.emerald
          const ChapterIcon = chapter.icon
          const chapterActive = isChapterActive(chapter)
          const chapterExpanded = isChapterExpanded(chapter)
          const totalModes = chapter.sections.reduce((a, s) => a + s.modes.length, 0)
          const visitedModes_ = chapter.sections.flatMap(s => s.modes).filter(m => visitedModes.has(m.mode)).length
          const allVisited_ = visitedModes_ === totalModes

          return (
            <div key={chapter.title} className="mt-1 pt-1 border-t border-border/30">
              {/* ── Level 1: Chapter header ── */}
              <button
                type="button"
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-2 rounded-md transition-all cursor-pointer group",
                  chapterActive
                    ? cn(chapterColors.activeBg, chapterColors.activeText, 'shadow-sm')
                    : 'hover:bg-accent/50'
                )}
                onClick={() => toggleChapter(chapter.title)}
                aria-expanded={chapterExpanded}
                aria-controls={`chapter-${chapter.title}`}
              >
                <div className={cn(
                  "w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors",
                  chapterActive ? chapterColors.dot + ' text-white' : 'bg-muted-foreground/10 text-muted-foreground'
                )}>
                  <ChapterIcon className="h-3 w-3" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <h2 className={cn(
                    "text-[11px] font-bold leading-tight tracking-tight",
                    chapterActive ? '' : 'text-foreground/80'
                  )}>
                    {chapter.title}
                  </h2>
                  <p className={cn(
                    "text-[8px] leading-tight mt-0.5",
                    chapterActive ? 'opacity-70' : 'text-muted-foreground/60'
                  )}>
                    {chapter.subtitle}
                  </p>
                </div>
                <span className={cn(
                  "text-[8px] font-mono px-1.5 py-0.5 rounded-full shrink-0 flex items-center gap-0.5",
                  chapterActive
                    ? cn(chapterColors.badge, chapterColors.badgeText)
                    : 'bg-muted/50 text-muted-foreground/50'
                )}>
                  {allVisited_ && <Check className="h-2.5 w-2.5 text-emerald-500" />}
                  {visitedModes_}/{totalModes}
                </span>
                {chapterExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                )}
              </button>

              {/* ── Chapter body (collapsible) ── */}
              <div
                id={`chapter-${chapter.title}`}
                className={cn(
                  "overflow-hidden transition-all duration-200 ease-in-out",
                  chapterExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
                )}
              >
                <div className="ml-2 pl-2 border-l-2 border-border/30 space-y-0 mt-0.5 mb-1">
                  {chapter.sections.map((section) => {
                    const secColors = colorMap[section.color] || colorMap[chapter.color] || colorMap.emerald
                    const secActive = isSectionActive(section)
                    const secExpanded = isSectionExpanded(chapter.title, section.title)
                    const secKey = `${chapter.title}/${section.title}`
                    const modeCount = section.modes.length
                    const visitedInSection = section.modes.filter(m => visitedModes.has(m.mode)).length
                    const allVisited = visitedInSection === modeCount

                    return (
                      <div key={section.title} className="mt-0.5">
                        {/* ── Level 2: Section header ── */}
                        <button
                          type="button"
                          className={cn(
                            "w-full flex items-center gap-1.5 px-1.5 py-1 rounded transition-all cursor-pointer",
                            secActive ? secColors.activeBg + ' ' + secColors.activeText : secColors.hoverBg
                          )}
                          onClick={() => toggleSection(secKey)}
                          aria-expanded={secExpanded}
                          aria-controls={`section-${secKey}`}
                        >
                          <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", secActive ? secColors.dot : 'bg-muted-foreground/30')} />
                          <div className="flex-1 min-w-0 text-left">
                            <h3 className={cn(
                              "text-[10px] font-semibold leading-none",
                              secActive ? '' : 'text-muted-foreground'
                            )}>
                              {section.title}
                            </h3>
                          </div>
                          <span className={cn(
                            "text-[7px] font-mono px-1 py-0 rounded-full shrink-0 flex items-center gap-0.5",
                            secActive
                              ? cn(secColors.badge, secColors.badgeText)
                              : 'bg-muted/50 text-muted-foreground/50'
                          )}>
                            {allVisited && <Check className="h-2 w-2 text-emerald-500" />}
                            {visitedInSection}/{modeCount}
                          </span>
                          {secExpanded ? (
                            <ChevronDown className={cn("h-2.5 w-2.5 shrink-0", secActive ? '' : 'text-muted-foreground/50')} />
                          ) : (
                            <ChevronRight className={cn("h-2.5 w-2.5 shrink-0", secActive ? '' : 'text-muted-foreground/50')} />
                          )}
                        </button>

                        {/* ── Level 3: Mode items (collapsible) ── */}
                        <div
                          id={`section-${secKey}`}
                          className={cn(
                            "overflow-hidden transition-all duration-200 ease-in-out",
                            secExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                          )}
                        >
                          <div role="tree" aria-label={section.title} className="space-y-0.5 mt-0.5">
                            {section.modes.map(({ mode: m, label, icon: Icon }) => {
                              const isActive = mode === m
                              const isFavorited = favorites.has(m)
                              return (
                                <div key={m} className="relative" role="treeitem" aria-selected={isActive}>
                                  <Button
                                    ref={isActive ? activeRef : undefined}
                                    key={`btn-${m}`}
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                      'w-full justify-start gap-2 text-xs h-7 px-2 pr-8 transition-all relative group',
                                      isActive
                                        ? `${secColors.activeBg} ${secColors.activeText} font-semibold shadow-sm before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-[3px] before:h-4 before:rounded-r ${secColors.border} animate-[count-up_0.3s_ease-out]`
                                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                                    )}
                                    onClick={() => {
                                      handleModeChange(m)
                                      onModeSelect?.()
                                    }}
                                    aria-label={label + (isActive ? ' (当前)' : '')}
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
                                          "absolute right-1.5 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded-full transition-all active:scale-75 z-10",
                                          isFavorited
                                            ? 'text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/40'
                                            : 'opacity-0 group-hover:opacity-100 text-muted-foreground/30 hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'
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
              </div>
            </div>
          )
        })}

        {/* Completion progress at bottom with circular indicator */}
        <div className="mt-2 pt-2 border-t border-border/30 px-2">
          <div className="flex items-center gap-3">
            {/* Circular progress indicator */}
            <div className="relative shrink-0">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center"
                style={{
                  background: `conic-gradient(from 0deg, #10b981 0%, #14b8a6 ${Math.round((visitedModes.size / totalModeCount) * 100)}%, transparent ${Math.round((visitedModes.size / totalModeCount) * 100)}%, transparent 100%)`,
                  mask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 3px))',
                  WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 3px))',
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {Math.round((visitedModes.size / totalModeCount) * 100)}%
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-1.5">
                <Trophy className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                <span className="text-[9px] font-medium text-muted-foreground">总体进度</span>
              </div>
              <div className="flex items-center gap-2 text-[8px]">
                <span className="text-muted-foreground">
                  共 <span className="text-foreground font-mono font-medium">{totalModeCount}</span> 个
                </span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  已探索 <span className="font-mono font-medium">{visitedModes.size}</span>
                </span>
                <span className="text-muted-foreground/60">
                  剩余 <span className="font-mono">{totalModeCount - visitedModes.size}</span>
                </span>
              </div>
              {/* Thin progress bar */}
              <div className="w-full h-1 bg-muted/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${Math.round((visitedModes.size / totalModeCount) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </nav>
    </ScrollArea>
  )
}
