'use client'

import { useLabStore, modeInfo } from '@/store/lab-store'
import { MathDisplay } from './math-display'
import { Badge } from '@/components/ui/badge'
import { useComputedValues } from '@/hooks/use-computed-values'
import { TrendingUp, Target, Calculator } from 'lucide-react'

export function InfoPanel() {
  const { mode } = useLabStore()
  const info = modeInfo[mode]
  const computed = useComputedValues()

  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-0 px-1.5 py-0">
          {info.section}
        </Badge>
        <h3 className="text-xs font-semibold text-foreground">{info.title}</h3>
      </div>

      <div className="bg-muted/50 dark:bg-muted/30 rounded-md p-2 overflow-x-auto">
        <MathDisplay math={info.math} display className="text-center" />
      </div>

      <p className="text-[11px] text-muted-foreground leading-relaxed">
        {info.description}
      </p>

      {/* Computed values section */}
      {computed && (
        <div className="bg-muted/30 dark:bg-muted/20 rounded-md p-2 space-y-1 border border-border/50">
          <div className="flex items-center gap-1.5 mb-1">
            <Calculator className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            <span className="text-[11px] font-semibold text-foreground">{computed.label}</span>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
            {/* Main value */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <TrendingUp className="h-2.5 w-2.5" />
                计算值
              </span>
              <span className="text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0 rounded">
                {computed.mainValue}
              </span>
            </div>

            {/* Exact value */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Target className="h-2.5 w-2.5" />
                精确值
              </span>
              <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400">
                {computed.exactValue}
              </span>
            </div>

            {/* Approx value (if different) */}
            {computed.approxValue !== computed.mainValue && (
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">近似值</span>
                <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400">
                  {computed.approxValue}
                </span>
              </div>
            )}

            {/* Error */}
            {computed.error !== '—' && computed.error !== '0' && (
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">误差</span>
                <span className="text-[11px] font-mono text-red-500 dark:text-red-400">
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
