'use client'

import { useLabStore, modeInfo } from '@/store/lab-store'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { RotateCcw, SlidersHorizontal, Minus, Plus } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

function SliderWithProgress({
  value,
  min,
  max,
  step,
  onValueChange,
  label,
  colorClass = 'bg-emerald-500',
  incrementFn,
  decrementFn,
  keyboardHint,
}: {
  value: number
  min: number
  max: number
  step: number
  onValueChange: (value: number[]) => void
  label: string
  colorClass?: string
  incrementFn: () => void
  decrementFn: () => void
  keyboardHint?: string
}) {
  const percent = ((value - min) / (max - min)) * 100

  return (
    <div className="flex items-center gap-2">
      <Label className="text-[11px] font-medium text-muted-foreground whitespace-nowrap min-w-[56px]">
        {label}
      </Label>
      <div className="relative flex items-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 shrink-0 transition-all hover:scale-110 active:scale-90 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
              onClick={decrementFn}
            >
              <Minus className="h-2.5 w-2.5" />
              <span className="sr-only">减少</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            减少 {keyboardHint ? `(${keyboardHint})` : ''}
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="flex-1 relative">
        <Slider
          value={[value]}
          min={min}
          max={max}
          step={step}
          onValueChange={onValueChange}
          className="relative z-10"
        />
        {/* Visual progress bar under slider */}
        <div className="absolute top-1/2 left-0 h-[3px] -translate-y-1/2 rounded-full pointer-events-none overflow-hidden" style={{ width: '100%' }}>
          <div
            className={cn("h-full rounded-full transition-all duration-150 opacity-30", colorClass)}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
      <div className="relative flex items-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 shrink-0 transition-all hover:scale-110 active:scale-90 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
              onClick={incrementFn}
            >
              <Plus className="h-2.5 w-2.5" />
              <span className="sr-only">增加</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            增加 {keyboardHint ? `(${keyboardHint})` : ''}
          </TooltipContent>
        </Tooltip>
      </div>
      <span className={cn(
        "text-[11px] font-mono px-1.5 py-0.5 rounded-md min-w-[40px] text-center font-semibold shadow-sm tabular-nums",
        colorClass === 'bg-amber-500'
          ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30'
          : 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30'
      )}>
        {step < 1 ? value.toFixed(step < 0.1 ? 2 : 1) : value.toFixed(0)}
      </span>
    </div>
  )
}

export function ControlsPanel() {
  const { mode, paramValue, paramValue2, setParamValue, setParamValue2 } = useLabStore()
  const info = modeInfo[mode]

  const handleReset = () => {
    setParamValue(info.paramDefault)
    if (info.paramDefault2 !== undefined) setParamValue2(info.paramDefault2)
  }

  const handleParamIncrement = (delta: number) => {
    const newVal = Math.round(Math.min(info.paramMax, Math.max(info.paramMin, paramValue + delta * info.paramStep)) / info.paramStep) * info.paramStep
    setParamValue(parseFloat(newVal.toFixed(10)))
  }

  const handleParam2Increment = (delta: number) => {
    const step2 = info.paramStep2 ?? 0.1
    const newVal = Math.round(Math.min((info.paramMax2 ?? 5), Math.max((info.paramMin2 ?? 0), paramValue2 + delta * step2)) / step2) * step2
    setParamValue2(parseFloat(newVal.toFixed(10)))
  }

  // Format value range display
  const formatRange = (min: number, max: number) => `[${min}, ${max}]`

  return (
    <div className="px-3 sm:px-4 py-1.5 space-y-1.5 relative">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/30 via-transparent to-teal-50/30 dark:from-emerald-950/10 dark:via-transparent dark:to-teal-950/10 pointer-events-none" />
      <div className="relative space-y-1.5">
        <div className="flex items-center gap-1 mb-1">
          <SlidersHorizontal className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">参数控制</span>
          <span className="text-[9px] text-muted-foreground/50 font-mono">
            {formatRange(info.paramMin, info.paramMax)}
          </span>
          <div className="flex-1" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 px-1.5 text-[10px] text-muted-foreground hover:text-foreground gap-1 transition-all hover:scale-105 active:scale-95"
                onClick={handleReset}
              >
                <RotateCcw className="h-2.5 w-2.5" />
                重置
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">重置为默认值 (R)</TooltipContent>
          </Tooltip>
        </div>

        <SliderWithProgress
          value={paramValue}
          min={info.paramMin}
          max={info.paramMax}
          step={info.paramStep}
          onValueChange={([v]) => setParamValue(v)}
          label={info.paramLabel}
          colorClass="bg-emerald-500"
          incrementFn={() => handleParamIncrement(1)}
          decrementFn={() => handleParamIncrement(-1)}
          keyboardHint="← →"
        />

        {info.paramLabel2 && (
          <SliderWithProgress
            value={paramValue2}
            min={info.paramMin2 ?? 0}
            max={info.paramMax2 ?? 5}
            step={info.paramStep2 ?? 0.1}
            onValueChange={([v]) => setParamValue2(v)}
            label={info.paramLabel2}
            colorClass="bg-amber-500"
            incrementFn={() => handleParam2Increment(1)}
            decrementFn={() => handleParam2Increment(-1)}
          />
        )}
      </div>
    </div>
  )
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ')
}
