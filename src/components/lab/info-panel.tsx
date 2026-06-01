'use client'

import { useLabStore, modeInfo } from '@/store/lab-store'
import { MathDisplay } from './math-display'
import { Badge } from '@/components/ui/badge'
import { useComputedValues } from '@/hooks/use-computed-values'
import { TrendingUp, Target, Calculator, Info, Sparkles, BookOpen, Zap } from 'lucide-react'

export function InfoPanel() {
  const { mode } = useLabStore()
  const info = modeInfo[mode]
  const computed = useComputedValues()

  return (
    <div className="p-3 space-y-2.5">
      {/* Title row with section badge and mode title */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-0 px-1.5 py-0 gap-1 shadow-sm">
          <BookOpen className="h-2.5 w-2.5" />
          {info.section}
        </Badge>
        <h3 className="text-xs font-bold text-foreground flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-amber-500" />
          {info.title}
        </h3>
      </div>

      {/* Math formula with enhanced styling */}
      <div className="relative bg-gradient-to-r from-muted/60 via-muted/40 to-muted/60 dark:from-muted/35 dark:via-muted/25 dark:to-muted/35 rounded-lg p-3 overflow-x-auto border border-border/40 shadow-sm">
        <div className="absolute top-1 left-2 flex items-center gap-0.5">
          <Zap className="h-2 w-2 text-amber-500/60" />
          <span className="text-[8px] text-muted-foreground/60 font-medium">公式</span>
        </div>
        <MathDisplay math={info.math} display className="text-center mt-1" />
      </div>

      {/* Description */}
      <p className="text-[11px] text-muted-foreground leading-relaxed bg-background/30 rounded-md px-2 py-1.5 border border-border/20">
        {info.description}
      </p>

      {/* Computed values section */}
      {computed && (
        <div className="bg-gradient-to-br from-emerald-50/50 via-muted/30 to-teal-50/50 dark:from-emerald-950/20 dark:via-muted/20 dark:to-teal-950/20 rounded-lg p-2.5 space-y-1.5 border border-emerald-200/40 dark:border-emerald-800/30 shadow-sm">
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
    </div>
  )
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ')
}
