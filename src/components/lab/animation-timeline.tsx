'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useLabStore, type LabMode } from '@/store/lab-store'
import { Play, Pause, Check, Grid3x3, Box, Infinity } from 'lucide-react'

const STEPS: { mode: LabMode; label: string; icon: React.ReactNode }[] = [
  { mode: 'step1', label: '区域划分', icon: <Grid3x3 className="h-3 w-3" /> },
  { mode: 'step2', label: '网格划分', icon: <Grid3x3 className="h-3 w-3" /> },
  { mode: 'step3', label: '方柱近似', icon: <Box className="h-3 w-3" /> },
  { mode: 'step4', label: '取极限', icon: <Infinity className="h-3 w-3" /> },
]

const STEP_MODES = new Set<string>(['step1', 'step2', 'step3', 'step4'])

interface AnimationTimelineProps {
  className?: string
}

export function AnimationTimeline({ className }: AnimationTimelineProps) {
  const { mode, setMode } = useLabStore()
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stepStartTimeRef = useRef<number>(0)

  // Check if we're in concept mode
  const isInConceptMode = STEP_MODES.has(mode)
  const currentStepIndex = STEPS.findIndex(s => s.mode === mode)

  // Effective playing state - stops if we leave concept modes
  const effectivePlaying = isPlaying && isInConceptMode

  // Auto-play logic: step through step1→step2→step3→step4 at 4-second intervals
  useEffect(() => {
    if (!effectivePlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (timerRef.current) clearTimeout(timerRef.current)
      intervalRef.current = null
      timerRef.current = null
      return
    }

    // Reset progress tracking
    stepStartTimeRef.current = Date.now()

    // Progress animation interval (update every 50ms for smooth animation)
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - stepStartTimeRef.current
      const stepDuration = 4000
      const pct = Math.min(100, (elapsed / stepDuration) * 100)
      setProgress(pct)
    }, 50)

    // Step transition timer
    const advance = () => {
      const idx = STEPS.findIndex(s => s.mode === useLabStore.getState().mode)
      if (idx < STEPS.length - 1) {
        const nextMode = STEPS[idx + 1].mode
        setMode(nextMode)
        stepStartTimeRef.current = Date.now()
        // Schedule next transition
        timerRef.current = setTimeout(advance, 4000)
      } else {
        // Reached the end, stop playing
        setIsPlaying(false)
      }
    }

    timerRef.current = setTimeout(advance, 4000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (timerRef.current) clearTimeout(timerRef.current)
      intervalRef.current = null
      timerRef.current = null
    }
  }, [effectivePlaying, setMode])

  // Reset progress when mode changes or playing stops
  const prevModeRef = useRef(mode)
  const prevPlayingRef = useRef(effectivePlaying)
  if (mode !== prevModeRef.current || effectivePlaying !== prevPlayingRef.current) {
    prevModeRef.current = mode
    prevPlayingRef.current = effectivePlaying
    stepStartTimeRef.current = Date.now()
    // Reset progress via ref-based approach instead of setState in effect
    // We use requestAnimationFrame to avoid synchronous setState
    requestAnimationFrame(() => setProgress(0))
  }

  // If isPlaying is true but we left concept mode, auto-stop
  // This is derived, not a setState-in-effect
  if (isPlaying && !isInConceptMode) {
    // We'll handle this via the effectivePlaying variable
    // and clean up the auto-play in the next render cycle
    setIsPlaying(false)
  }

  const togglePlay = useCallback(() => {
    if (!isInConceptMode) return
    setIsPlaying(prev => {
      if (!prev) {
        // If at the last step, restart from step1
        const currentIdx = STEPS.findIndex(s => s.mode === useLabStore.getState().mode)
        if (currentIdx === STEPS.length - 1) {
          setMode('step1')
        }
      }
      return !prev
    })
  }, [isInConceptMode, setMode])

  // Expose toggle play for external keyboard shortcut
  useEffect(() => {
    const handler = () => {
      togglePlay()
    }
    window.addEventListener('timeline-toggle-play', handler)
    return () => window.removeEventListener('timeline-toggle-play', handler)
  }, [togglePlay])

  if (!isInConceptMode) return null

  const completedSteps = currentStepIndex

  return (
    <div
      className={`
        absolute bottom-8 left-3 right-3 z-20
        animate-[slide-up_0.3s_ease-out_forwards]
        ${className ?? ''}
      `}
      style={{ pointerEvents: 'auto' }}
    >
      <div
        className="
          bg-background/80 backdrop-blur-md
          border border-emerald-200/50 dark:border-emerald-800/40
          rounded-lg shadow-lg shadow-emerald-500/5
          px-3 py-2
          relative
          overflow-hidden
        "
      >
        {/* Top gradient border */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent" />

        <div className="flex items-center gap-2">
          {/* Timeline nodes */}
          <div className="flex-1 flex items-center gap-0 relative">
            {/* Background connector line */}
            <div className="absolute top-[11px] left-[12px] right-[12px] h-[2px] bg-muted-foreground/15 rounded-full" />

            {/* Completed connector line */}
            <div
              className="absolute top-[11px] left-[12px] h-[2px] bg-emerald-500 rounded-full transition-all duration-300 ease-out"
              style={{
                width: completedSteps > 0
                  ? `calc(${(completedSteps / (STEPS.length - 1)) * 100}% - ${(1 - completedSteps / (STEPS.length - 1)) * 24}px)`
                  : '0px'
              }}
            />

            {/* In-progress connector line */}
            {effectivePlaying && currentStepIndex < STEPS.length - 1 && (
              <div
                className="absolute top-[11px] h-[2px] bg-emerald-400/50 rounded-full transition-none"
                style={{
                  left: `calc(${(currentStepIndex / (STEPS.length - 1)) * 100}% + ${12 - (currentStepIndex / (STEPS.length - 1)) * 24}px)`,
                  width: `calc(${(1 / (STEPS.length - 1)) * 100}% - ${24 / (STEPS.length - 1)}px)`,
                  transformOrigin: 'left',
                  transform: `scaleX(${progress / 100})`,
                }}
              />
            )}

            {/* Step nodes */}
            {STEPS.map((step, i) => {
              const isCompleted = i < currentStepIndex
              const isCurrent = i === currentStepIndex

              return (
                <div
                  key={step.mode}
                  className="flex-1 flex flex-col items-center relative cursor-pointer group"
                  onClick={() => {
                    if (!effectivePlaying) setMode(step.mode)
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`跳转到${step.label}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      if (!effectivePlaying) setMode(step.mode)
                    }
                  }}
                >
                  {/* Node circle */}
                  <div
                    className={`
                      w-6 h-6 rounded-full flex items-center justify-center
                      transition-all duration-300 relative z-10
                      ${isCompleted
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                        : isCurrent
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 ring-2 ring-emerald-300 dark:ring-emerald-700 ring-offset-1 ring-offset-background'
                          : 'bg-muted-foreground/15 text-muted-foreground/50 group-hover:bg-muted-foreground/25 group-hover:text-muted-foreground/70'
                      }
                    `}
                  >
                    {isCompleted ? (
                      <Check className="h-3 w-3" />
                    ) : isCurrent ? (
                      step.icon
                    ) : (
                      <span className="text-[9px] font-bold">{i + 1}</span>
                    )}
                  </div>

                  {/* Label */}
                  <span
                    className={`
                      text-[9px] mt-0.5 leading-tight text-center transition-colors duration-300
                      ${isCurrent
                        ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                        : isCompleted
                          ? 'text-emerald-600/70 dark:text-emerald-400/70'
                          : 'text-muted-foreground/40 group-hover:text-muted-foreground/60'
                      }
                    `}
                  >
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Play/Pause button */}
          <button
            className="
              flex items-center gap-1 h-6 px-2
              rounded-md text-[10px] font-medium
              bg-emerald-500/10 text-emerald-600 dark:text-emerald-400
              hover:bg-emerald-500/20
              border border-emerald-500/20 dark:border-emerald-500/30
              transition-all duration-200
              shrink-0
            "
            onClick={togglePlay}
            aria-label={isPlaying ? '暂停动画' : '播放动画'}
          >
            {effectivePlaying ? (
              <>
                <Pause className="h-3 w-3" />
                <span>暂停</span>
              </>
            ) : (
              <>
                <Play className="h-3 w-3" />
                <span>播放</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
