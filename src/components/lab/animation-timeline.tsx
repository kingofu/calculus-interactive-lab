'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useLabStore, type LabMode } from '@/store/lab-store'
import { Play, Pause, RotateCcw, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const conceptSteps: LabMode[] = ['step1', 'step2', 'step3', 'step4']
const stepNames = ['区域划分', '网格划分', '方柱近似', '取极限']
const STEP_DURATION = 3000 // 3 seconds per step

export function AnimationTimeline() {
  const { mode, setMode } = useLabStore()
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stepStartTimeRef = useRef<number>(0)
  const activePlayIdRef = useRef(0)

  // Only show for concept step modes
  const isConceptStep = conceptSteps.includes(mode)
  const currentStepIndex = conceptSteps.indexOf(mode)

  // Derived: animation is complete when at last step and not playing
  const isComplete = currentStepIndex >= 3 && !isPlaying && isConceptStep

  // Effective playing: only play if we're in concept mode
  const effectivePlaying = isPlaying && isConceptStep

  // Clean up timers helper
  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // Stop playing when leaving concept modes
  useEffect(() => {
    if (!isConceptStep) {
      clearTimers()
      activePlayIdRef.current += 1
      // We need to reset isPlaying but can't call setState in effect body
      // Use a microtask to defer it
      queueMicrotask(() => {
        setIsPlaying(false)
      })
    }
  }, [isConceptStep, clearTimers])

  // Auto-advance logic with smooth progress
  useEffect(() => {
    if (!effectivePlaying) {
      clearTimers()
      return
    }

    const playId = ++activePlayIdRef.current
    stepStartTimeRef.current = Date.now()
    // Defer setState to avoid synchronous setState in effect body
    requestAnimationFrame(() => setProgress(0))

    // Progress animation interval (update every 50ms for smooth animation)
    intervalRef.current = setInterval(() => {
      // Check if this play session is still active
      if (activePlayIdRef.current !== playId) {
        clearTimers()
        return
      }
      const elapsed = Date.now() - stepStartTimeRef.current
      const pct = Math.min(100, (elapsed / STEP_DURATION) * 100)
      setProgress(pct)
    }, 50)

    // Step transition via recursive setTimeout
    const scheduleNextStep = () => {
      timerRef.current = setTimeout(() => {
        // Validate play session
        if (activePlayIdRef.current !== playId) return

        const currentMode = useLabStore.getState().mode
        const idx = conceptSteps.indexOf(currentMode)

        if (idx < conceptSteps.length - 1) {
          // Advance to next step
          setMode(conceptSteps[idx + 1])
          stepStartTimeRef.current = Date.now()
          setProgress(0)
          // Schedule next step
          scheduleNextStep()
        } else {
          // Animation complete
          setIsPlaying(false)
          setProgress(0)
        }
      }, STEP_DURATION)
    }

    scheduleNextStep()

    return () => {
      clearTimers()
    }
  }, [effectivePlaying, clearTimers, setMode])

  // Reset progress when mode changes during non-play
  const prevModeRef = useRef(mode)
  useEffect(() => {
    if (mode !== prevModeRef.current) {
      prevModeRef.current = mode
      if (!effectivePlaying) {
        // Defer to avoid synchronous setState in effect body
        requestAnimationFrame(() => setProgress(0))
      }
    }
  }, [mode, effectivePlaying])

  const togglePlay = useCallback(() => {
    if (!isConceptStep) return

    if (currentStepIndex >= 3) {
      // Restart from beginning
      setMode(conceptSteps[0])
      setIsPlaying(true)
    } else {
      setIsPlaying(prev => !prev)
    }
  }, [isConceptStep, currentStepIndex, setMode])

  const reset = useCallback(() => {
    setIsPlaying(false)
    activePlayIdRef.current += 1
    clearTimers()
    setMode(conceptSteps[0])
  }, [clearTimers, setMode])

  // Expose toggle play for external keyboard shortcut
  useEffect(() => {
    const handler = () => {
      togglePlay()
    }
    window.addEventListener('timeline-toggle-play', handler)
    return () => window.removeEventListener('timeline-toggle-play', handler)
  }, [togglePlay])

  if (!isConceptStep) return null

  const completedSteps = currentStepIndex

  return (
    <div
      className="absolute bottom-8 left-3 right-3 z-20 animate-[slide-up_0.3s_ease-out_forwards]"
      style={{ pointerEvents: 'auto' }}
    >
      <div
        className={cn(
          "bg-background/85 backdrop-blur-md rounded-xl px-4 py-2.5 shadow-lg relative overflow-hidden transition-all duration-300",
          isComplete
            ? "border border-emerald-300/50 dark:border-emerald-700/40 shadow-emerald-500/10"
            : "border border-border/50 shadow-black/5"
        )}
      >
        {/* Top gradient border */}
        <div className={cn(
          "absolute top-0 left-0 right-0 h-[2px] rounded-full transition-colors duration-500",
          isComplete
            ? "bg-gradient-to-r from-transparent via-emerald-500 to-transparent"
            : "bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent"
        )} />

        <div className="flex items-center gap-3">
          {/* Play/Pause button */}
          <button
            type="button"
            onClick={togglePlay}
            className={cn(
              "h-8 w-8 flex items-center justify-center rounded-full transition-all active:scale-90 shrink-0",
              isComplete
                ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30 hover:bg-emerald-600"
                : effectivePlaying
                  ? "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/60"
                  : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/60"
            )}
            aria-label={effectivePlaying ? '暂停动画' : '播放动画'}
          >
            {isComplete ? (
              <Check className="h-4 w-4" />
            ) : effectivePlaying ? (
              <Pause className="h-3.5 w-3.5" />
            ) : (
              <Play className="h-3.5 w-3.5 ml-0.5" />
            )}
          </button>

          {/* Status label */}
          {isComplete && (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 shrink-0 animate-[fade-in_0.3s_ease-out]">
              ✅ 完成
            </span>
          )}

          {/* Timeline */}
          <div className="flex-1 flex items-center gap-0 relative min-w-0">
            {/* Background connector line */}
            <div className="absolute top-[10px] left-[13px] right-[13px] h-[2px] bg-muted-foreground/15 rounded-full" />

            {/* Completed connector line */}
            <div
              className="absolute top-[10px] left-[13px] h-[2px] bg-emerald-500 rounded-full transition-all duration-500 ease-out"
              style={{
                width: completedSteps > 0
                  ? `calc(${(completedSteps / (conceptSteps.length - 1)) * 100}% - ${(1 - completedSteps / (conceptSteps.length - 1)) * 26}px)`
                  : '0px'
              }}
            />

            {/* In-progress connector line (animated) */}
            {effectivePlaying && currentStepIndex < conceptSteps.length - 1 && (
              <div
                className="absolute top-[10px] h-[2px] bg-emerald-400/50 rounded-full"
                style={{
                  left: `calc(${(currentStepIndex / (conceptSteps.length - 1)) * 100}% + ${13 - (currentStepIndex / (conceptSteps.length - 1)) * 26}px)`,
                  width: `calc(${(1 / (conceptSteps.length - 1)) * 100}% - ${26 / (conceptSteps.length - 1)}px)`,
                  transformOrigin: 'left',
                  transform: `scaleX(${progress / 100})`,
                }}
              />
            )}

            {/* Step nodes */}
            {stepNames.map((name, idx) => {
              const isCompleted = idx < currentStepIndex
              const isCurrent = idx === currentStepIndex

              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center relative cursor-pointer group"
                  onClick={() => {
                    if (!effectivePlaying) {
                      setMode(conceptSteps[idx])
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`跳转到${name}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      if (!effectivePlaying) {
                        setMode(conceptSteps[idx])
                      }
                    }
                  }}
                >
                  {/* Pulsing ring for current step */}
                  {isCurrent && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-emerald-400/20 animate-ping" />
                  )}

                  {/* Node circle */}
                  <div
                    className={cn(
                      "w-[22px] h-[22px] rounded-full flex items-center justify-center",
                      "transition-all duration-300 relative z-10 text-[9px] font-bold border-2",
                      isCompleted
                        ? "bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/30"
                        : isCurrent
                          ? "bg-emerald-100 dark:bg-emerald-900/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-md shadow-emerald-500/20"
                          : "bg-muted/50 border-muted-foreground/20 text-muted-foreground/40 group-hover:bg-muted-foreground/10 group-hover:border-muted-foreground/30"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-2.5 w-2.5" />
                    ) : (
                      idx + 1
                    )}
                  </div>

                  {/* Label */}
                  <span
                    className={cn(
                      "text-[8px] mt-0.5 leading-tight text-center transition-colors duration-300 whitespace-nowrap",
                      isCurrent
                        ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                        : isCompleted
                          ? "text-emerald-600/70 dark:text-emerald-400/70"
                          : "text-muted-foreground/40 group-hover:text-muted-foreground/60"
                    )}
                  >
                    {name}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Reset button */}
          <button
            type="button"
            onClick={reset}
            className="h-6 w-6 flex items-center justify-center rounded-full text-muted-foreground/40 hover:text-foreground hover:bg-muted transition-all active:scale-90 shrink-0"
            aria-label="重置动画"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  )
}
