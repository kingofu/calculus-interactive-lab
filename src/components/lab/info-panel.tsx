'use client'

import { useLabStore, modeInfo, type LabMode } from '@/store/lab-store'
import { MathDisplay } from './math-display'
import { Badge } from '@/components/ui/badge'
import { useComputedValues } from '@/hooks/use-computed-values'
import { TrendingUp, Target, Calculator, Info, Sparkles, BookOpen, Zap, ChevronRight } from 'lucide-react'

// Section color configuration for badges
const sectionColors: Record<string, { bg: string; text: string; border: string; glow: string; computedBg: string; computedBorder: string }> = {
  '二重积分概念步骤': {
    bg: 'bg-emerald-100 dark:bg-emerald-900/40',
    text: 'text-emerald-800 dark:text-emerald-300',
    border: 'border-0',
    glow: 'shadow-emerald-500/20',
    computedBg: 'from-emerald-50/50 via-muted/30 to-teal-50/50 dark:from-emerald-950/20 dark:via-muted/20 dark:to-teal-950/20',
    computedBorder: 'border-emerald-200/40 dark:border-emerald-800/30',
  },
  '二重积分基本性质': {
    bg: 'bg-sky-100 dark:bg-sky-900/40',
    text: 'text-sky-800 dark:text-sky-300',
    border: 'border-0',
    glow: 'shadow-sky-500/20',
    computedBg: 'from-sky-50/50 via-muted/30 to-blue-50/50 dark:from-sky-950/20 dark:via-muted/20 dark:to-blue-950/20',
    computedBorder: 'border-sky-200/40 dark:border-sky-800/30',
  },
  '二重积分与奇偶性': {
    bg: 'bg-orange-100 dark:bg-orange-900/40',
    text: 'text-orange-800 dark:text-orange-300',
    border: 'border-0',
    glow: 'shadow-orange-500/20',
    computedBg: 'from-orange-50/50 via-muted/30 to-cyan-50/50 dark:from-orange-950/20 dark:via-muted/20 dark:to-cyan-950/20',
    computedBorder: 'border-orange-200/40 dark:border-orange-800/30',
  },
  '直角坐标系计算': {
    bg: 'bg-amber-100 dark:bg-amber-900/40',
    text: 'text-amber-800 dark:text-amber-300',
    border: 'border-0',
    glow: 'shadow-amber-500/20',
    computedBg: 'from-amber-50/50 via-muted/30 to-yellow-50/50 dark:from-amber-950/20 dark:via-muted/20 dark:to-yellow-950/20',
    computedBorder: 'border-amber-200/40 dark:border-amber-800/30',
  },
  '极坐标系计算': {
    bg: 'bg-rose-100 dark:bg-rose-900/40',
    text: 'text-rose-800 dark:text-rose-300',
    border: 'border-0',
    glow: 'shadow-rose-500/20',
    computedBg: 'from-rose-50/50 via-muted/30 to-pink-50/50 dark:from-rose-950/20 dark:via-muted/20 dark:to-pink-950/20',
    computedBorder: 'border-rose-200/40 dark:border-rose-800/30',
  },
  '矩形近似面积演示': {
    bg: 'bg-teal-100 dark:bg-teal-900/40',
    text: 'text-teal-800 dark:text-teal-300',
    border: 'border-0',
    glow: 'shadow-teal-500/20',
    computedBg: 'from-teal-50/50 via-muted/30 to-cyan-50/50 dark:from-teal-950/20 dark:via-muted/20 dark:to-cyan-950/20',
    computedBorder: 'border-teal-200/40 dark:border-teal-800/30',
  },
  '球体与圆柱面相交': {
    bg: 'bg-violet-100 dark:bg-violet-900/40',
    text: 'text-violet-800 dark:text-violet-300',
    border: 'border-0',
    glow: 'shadow-violet-500/20',
    computedBg: 'from-violet-50/50 via-muted/30 to-purple-50/50 dark:from-violet-950/20 dark:via-muted/20 dark:to-purple-950/20',
    computedBorder: 'border-violet-200/40 dark:border-violet-800/30',
  },
  '数值积分收敛演示': {
    bg: 'bg-cyan-100 dark:bg-cyan-900/40',
    text: 'text-cyan-800 dark:text-cyan-300',
    border: 'border-0',
    glow: 'shadow-cyan-500/20',
    computedBg: 'from-cyan-50/50 via-muted/30 to-teal-50/50 dark:from-cyan-950/20 dark:via-muted/20 dark:to-teal-950/20',
    computedBorder: 'border-cyan-200/40 dark:border-cyan-800/30',
  },
  '三重积分概念': {
    bg: 'bg-purple-100 dark:bg-purple-900/40',
    text: 'text-purple-800 dark:text-purple-300',
    border: 'border-0',
    glow: 'shadow-purple-500/20',
    computedBg: 'from-purple-50/50 via-muted/30 to-violet-50/50 dark:from-purple-950/20 dark:via-muted/20 dark:to-violet-950/20',
    computedBorder: 'border-purple-200/40 dark:border-purple-800/30',
  },
  '变量代换': {
    bg: 'bg-lime-100 dark:bg-lime-900/40',
    text: 'text-lime-800 dark:text-lime-300',
    border: 'border-0',
    glow: 'shadow-lime-500/20',
    computedBg: 'from-lime-50/50 via-muted/30 to-green-50/50 dark:from-lime-950/20 dark:via-muted/20 dark:to-green-950/20',
    computedBorder: 'border-lime-200/40 dark:border-lime-800/30',
  },
  '格林公式与线积分': {
    bg: 'bg-red-100 dark:bg-red-900/40',
    text: 'text-red-800 dark:text-red-300',
    border: 'border-0',
    glow: 'shadow-red-500/20',
    computedBg: 'from-red-50/50 via-muted/30 to-orange-50/50 dark:from-red-950/20 dark:via-muted/20 dark:to-orange-950/20',
    computedBorder: 'border-red-200/40 dark:border-red-800/30',
  },
}

// Get the section color config, fallback to emerald
function getSectionColor(section: string) {
  return sectionColors[section] || sectionColors['二重积分概念步骤']!
}

// Map of modes in the same section for "related modes" feature
const sectionModes: Record<string, LabMode[]> = {
  '二重积分概念步骤': ['step1', 'step2', 'step3', 'step4'],
  '二重积分基本性质': ['prop1', 'prop2', 'prop3', 'prop4', 'prop5', 'prop6', 'prop7'],
  '二重积分与奇偶性': ['parity1', 'parity2'],
  '直角坐标系计算': ['cartesian1', 'cartesian2'],
  '极坐标系计算': ['polar1', 'polar2'],
  '矩形近似面积演示': ['rect_approx'],
  '球体与圆柱面相交': ['sphere_cyl1', 'sphere_cyl2'],
  '数值积分收敛演示': ['convergence1', 'convergence2'],
  '三重积分概念': ['triple1'],
  '变量代换': ['jacobian1'],
  '格林公式与线积分': ['green1'],
}

export function InfoPanel() {
  const { mode, setMode } = useLabStore()
  const info = modeInfo[mode]
  const computed = useComputedValues()
  const colors = getSectionColor(info.section)

  // Find related modes (previous and next in same section)
  const sameSectionModes = sectionModes[info.section] || []
  const currentIdx = sameSectionModes.indexOf(mode)
  const prevMode = currentIdx > 0 ? sameSectionModes[currentIdx - 1] : null
  const nextMode = currentIdx < sameSectionModes.length - 1 ? sameSectionModes[currentIdx + 1] : null

  return (
    <div className="p-3 space-y-2.5 font-[serif]">
      {/* Title row with section-colored badge and mode title */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0 gap-1 shadow-sm", colors.bg, colors.text, colors.border)}>
          <BookOpen className="h-2.5 w-2.5" />
          {info.section}
        </Badge>
        <h3 className="text-xs font-bold text-foreground flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-amber-500" />
          {info.title}
        </h3>
      </div>

      {/* Math formula with animated border glow */}
      <div className={cn(
        "relative bg-gradient-to-r from-muted/60 via-muted/40 to-muted/60 dark:from-muted/35 dark:via-muted/25 dark:to-muted/35 rounded-lg p-3 overflow-x-auto border border-border/40 shadow-sm",
        "transition-shadow duration-1000",
        "hover:shadow-md", colors.glow
      )}>
        {/* Animated border glow effect */}
        <div className="absolute inset-0 rounded-lg pointer-events-none animate-[glow-pulse_3s_ease-in-out_infinite] border border-transparent"
          style={{
            boxShadow: `inset 0 0 8px rgba(16, 185, 129, 0.1), 0 0 8px rgba(16, 185, 129, 0.05)`,
          }}
        />
        <div className="absolute top-1 left-2 flex items-center gap-0.5">
          <Zap className="h-2 w-2 text-amber-500/60" />
          <span className="text-[8px] text-muted-foreground/60 font-medium font-sans">公式</span>
        </div>
        <MathDisplay math={info.math} display className="text-center mt-1" />
      </div>

      {/* Description */}
      <p className="text-[11px] text-muted-foreground leading-relaxed bg-background/30 rounded-md px-2 py-1.5 border border-border/20">
        {info.description}
      </p>

      {/* Computed values section with section-colored styling */}
      {computed && (
        <div className={cn(
          "bg-gradient-to-br rounded-lg p-2.5 space-y-1.5 border shadow-sm",
          colors.computedBg, colors.computedBorder
        )}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Calculator className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-[11px] font-bold text-foreground">{computed.label}</span>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {/* Main value */}
            <div className="flex items-center justify-between gap-1">
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <TrendingUp className="h-2.5 w-2.5" />
                计算值
              </span>
              <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded-md shadow-sm">
                {computed.mainValue}
              </span>
            </div>

            {/* Exact value */}
            <div className="flex items-center justify-between gap-1">
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Target className="h-2.5 w-2.5" />
                精确值
              </span>
              <span className="text-[11px] font-mono text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 px-1.5 py-0.5 rounded-md shadow-sm">
                {computed.exactValue}
              </span>
            </div>

            {/* Approx value (if different) */}
            {computed.approxValue !== computed.mainValue && (
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] text-muted-foreground">近似值</span>
                <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded-md shadow-sm">
                  {computed.approxValue}
                </span>
              </div>
            )}

            {/* Error */}
            {computed.error !== '—' && computed.error !== '0' && (
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] text-muted-foreground">误差</span>
                <span className={cn(
                  "text-[11px] font-mono px-1.5 py-0.5 rounded-md shadow-sm",
                  parseFloat(computed.error) < 0.01
                    ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30"
                    : parseFloat(computed.error) < 0.1
                      ? "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30"
                      : "text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/30"
                )}>
                  {computed.error}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Related modes hint */}
      {(prevMode || nextMode) && (
        <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground bg-background/30 rounded-md px-2 py-1.5 border border-border/20 font-sans">
          <span className="flex items-center gap-1 shrink-0">
            <Info className="h-2.5 w-2.5" />
            同节模式:
          </span>
          <div className="flex items-center gap-1">
            {prevMode && (
              <button
                type="button"
                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setMode(prevMode)}
              >
                <ChevronRight className="h-2.5 w-2.5 rotate-180" />
                {modeInfo[prevMode].title}
              </button>
            )}
            {prevMode && nextMode && <span className="text-muted-foreground/30">|</span>}
            {nextMode && (
              <button
                type="button"
                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setMode(nextMode)}
              >
                {modeInfo[nextMode].title}
                <ChevronRight className="h-2.5 w-2.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ')
}
