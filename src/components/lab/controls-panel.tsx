'use client'

import { useState, useRef, useCallback } from 'react'
import { useLabStore, modeInfo } from '@/store/lab-store'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { RotateCcw, SlidersHorizontal, Minus, Plus, Zap, Share2 } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { modePresets, type Preset } from '@/lib/presets'
import { useToast } from '@/components/lab/toast-provider'

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

  // Keyboard-only parameter input state
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const [hasError, setHasError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Format display value based on step precision
  const formatValue = useCallback((v: number) => step < 1 ? v.toFixed(step < 0.1 ? 2 : 1) : v.toFixed(0), [step])

  // Start editing: copy current value into the input
  const startEditing = useCallback(() => {
    setEditValue(formatValue(value))
    setHasError(false)
    setIsEditing(true)
    // Focus the input on next tick after it renders
    requestAnimationFrame(() => {
      inputRef.current?.select()
    })
  }, [value, formatValue])

  // Apply the typed value
  const applyValue = useCallback(() => {
    const num = parseFloat(editValue)
    if (isNaN(num) || num < min || num > max) {
      setHasError(true)
      return
    }
    // Round to step precision
    const rounded = Math.round(num / step) * step
    const clamped = Math.round(Math.min(max, Math.max(min, rounded)) / step) * step
    onValueChange([parseFloat(clamped.toFixed(10))])
    setIsEditing(false)
    setHasError(false)
  }, [editValue, min, max, step, onValueChange])

  // Cancel editing
  const cancelEditing = useCallback(() => {
    setIsEditing(false)
    setHasError(false)
    setEditValue('')
  }, [])

  // Handle key events in the input
  const handleInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      applyValue()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelEditing()
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
      e.preventDefault()
      incrementFn()
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
      e.preventDefault()
      decrementFn()
    }
  }, [applyValue, cancelEditing, incrementFn, decrementFn])

  // Validate on change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newInput = e.target.value
    setEditValue(newInput)
    const num = parseFloat(newInput)
    setHasError(newInput !== '' && (isNaN(num) || num < min || num > max))
  }, [min, max])

  const valueColorClasses = colorClass === 'bg-amber-500'
    ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30'
    : 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30'

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
          aria-label={label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
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
      {/* Editable value display: click to type, Enter to apply, Escape to cancel */}
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={editValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onBlur={() => {
            // Apply on blur if valid, otherwise cancel
            const num = parseFloat(editValue)
            if (!isNaN(num) && num >= min && num <= max) {
              applyValue()
            } else {
              cancelEditing()
            }
          }}
          aria-label={`${label} 数值输入，范围 ${min} 到 ${max}`}
          aria-invalid={hasError}
          aria-describedby={hasError ? `param-error-${label}` : undefined}
          className={cn(
            "text-[11px] font-mono px-1.5 py-0.5 rounded-md min-w-[40px] text-center font-semibold shadow-sm tabular-nums outline-none transition-colors",
            "w-[52px]",
            hasError
              ? "border-2 border-red-500 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400"
              : valueColorClasses + " border border-border/40"
          )}
        />
      ) : (
        <button
          type="button"
          onClick={startEditing}
          className={cn(
            "text-[11px] font-mono px-1.5 py-0.5 rounded-md min-w-[40px] text-center font-semibold shadow-sm tabular-nums cursor-text transition-colors",
            valueColorClasses,
            "hover:ring-1 hover:ring-emerald-400/50 dark:hover:ring-emerald-500/50"
          )}
          aria-label={`${label}: ${formatValue(value)}，点击编辑数值`}
          title="点击输入精确数值"
        >
          {formatValue(value)}
        </button>
      )}
      {/* Error hint for screen readers */}
      {hasError && (
        <span id={`param-error-${label}`} className="sr-only" role="alert">
          数值超出范围，请输入 {min} 到 {max} 之间的值
        </span>
      )}
    </div>
  )
}

export function ControlsPanel() {
  const { mode, paramValue, paramValue2, setParamValue, setParamValue2 } = useLabStore()
  const info = modeInfo[mode]
  const presets = modePresets[mode]
  const { toast } = useToast()

  const handleShare = useCallback(() => {
    const url = new URL(window.location.href)
    url.searchParams.set('mode', mode)
    url.searchParams.set('param1', String(paramValue))
    if (info.paramLabel2) {
      url.searchParams.set('param2', String(paramValue2))
    }
    navigator.clipboard.writeText(url.toString()).then(() => {
      toast('链接已复制！', 'success')
    })
  }, [mode, paramValue, paramValue2, info, toast])

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
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 px-1.5 text-[10px] text-muted-foreground hover:text-foreground gap-1 transition-all hover:scale-105 active:scale-95"
                onClick={handleShare}
              >
                <Share2 className="h-2.5 w-2.5" />
                分享
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">复制当前模式链接</TooltipContent>
          </Tooltip>
        </div>

        {presets && presets.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-amber-500" />
              <span className="text-[9px] font-medium text-muted-foreground">预设方案</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {presets.map((preset: Preset, idx: number) => {
                const isActive = Math.abs(paramValue - preset.param1) < 0.01
                  && (!preset.param2 || Math.abs(paramValue2 - preset.param2) < 0.01)
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setParamValue(preset.param1)
                      if (preset.param2 !== undefined) setParamValue2(preset.param2)
                    }}
                    className={cn(
                      "text-[9px] px-2 py-1 rounded-md border transition-all active:scale-95",
                      isActive
                        ? "bg-amber-100 dark:bg-amber-900/40 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 font-medium shadow-sm"
                        : "bg-muted/30 border-border/40 text-muted-foreground hover:bg-accent hover:text-foreground hover:border-border"
                    )}
                  >
                    {preset.emoji} {preset.name}
                  </button>
                )
              })}
            </div>
          </div>
        )}

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
