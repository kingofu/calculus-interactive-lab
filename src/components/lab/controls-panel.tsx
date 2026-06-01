'use client'

import { useLabStore, modeInfo } from '@/store/lab-store'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { RotateCcw, SlidersHorizontal } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export function ControlsPanel() {
  const { mode, paramValue, paramValue2, setParamValue, setParamValue2 } = useLabStore()
  const info = modeInfo[mode]

  const handleReset = () => {
    setParamValue(info.paramDefault)
    if (info.paramDefault2 !== undefined) setParamValue2(info.paramDefault2)
  }

  return (
    <div className="px-3 sm:px-4 py-1.5 space-y-1">
      <div className="flex items-center gap-1 mb-1">
        <SlidersHorizontal className="h-3 w-3 text-muted-foreground" />
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">参数控制</span>
        <div className="flex-1" />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 px-1.5 text-[10px] text-muted-foreground hover:text-foreground gap-1"
              onClick={handleReset}
            >
              <RotateCcw className="h-2.5 w-2.5" />
              重置
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">重置为默认值 (R)</TooltipContent>
        </Tooltip>
      </div>

      <div className="flex items-center gap-3">
        <Label className="text-[11px] font-medium text-muted-foreground whitespace-nowrap min-w-[60px]">
          {info.paramLabel}
        </Label>
        <Slider
          value={[paramValue]}
          min={info.paramMin}
          max={info.paramMax}
          step={info.paramStep}
          onValueChange={([v]) => setParamValue(v)}
          className="flex-1"
        />
        <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded min-w-[32px] text-center font-semibold">
          {paramValue.toFixed(info.paramStep < 1 ? 1 : 0)}
        </span>
      </div>

      {info.paramLabel2 && (
        <div className="flex items-center gap-3">
          <Label className="text-[11px] font-medium text-muted-foreground whitespace-nowrap min-w-[60px]">
            {info.paramLabel2}
          </Label>
          <Slider
            value={[paramValue2]}
            min={info.paramMin2 ?? 0}
            max={info.paramMax2 ?? 5}
            step={info.paramStep2 ?? 0.1}
            onValueChange={([v]) => setParamValue2(v)}
            className="flex-1"
          />
          <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded min-w-[32px] text-center font-semibold">
            {paramValue2.toFixed((info.paramStep2 ?? 1) < 1 ? 1 : 0)}
          </span>
        </div>
      )}
    </div>
  )
}
