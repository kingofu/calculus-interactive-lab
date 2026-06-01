'use client'

import { useLabStore, modeInfo } from '@/store/lab-store'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'

export function ControlsPanel() {
  const { mode, paramValue, paramValue2, setParamValue, setParamValue2 } = useLabStore()
  const info = modeInfo[mode]

  return (
    <div className="px-4 py-2 space-y-1.5">
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
        <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded min-w-[32px] text-center">
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
          <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded min-w-[32px] text-center">
            {paramValue2.toFixed((info.paramStep2 ?? 1) < 1 ? 1 : 0)}
          </span>
        </div>
      )}
    </div>
  )
}
