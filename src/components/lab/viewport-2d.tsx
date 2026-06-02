'use client'

import { useState, useRef, useCallback, useEffect, useMemo, type ReactNode } from 'react'
import { useLabStore, modeInfo, type LabMode } from '@/store/lab-store'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Maximize2, Minimize2, Camera, RotateCcw, Move3d } from 'lucide-react'
import { useToast } from './toast-provider'
import {
  numericalIntegral1D,
  findRollePoint,
  findLagrangePoint,
  findMeanValueIntegralPoint,
  areaBetweenCurves,
} from '@/lib/math-computations'

// ─────────────────────────────────────────────────────
// Helper: cn (class name join)
// ─────────────────────────────────────────────────────
function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

// ─────────────────────────────────────────────────────
// SVG Path Helper Functions
// ─────────────────────────────────────────────────────

/** Convert math x to SVG x */
function sx(mathX: number, scale: number, offsetX: number): number {
  return mathX * scale + offsetX
}

/** Convert math y to SVG y (flipped) */
function sy(mathY: number, scale: number, offsetY: number): number {
  return -mathY * scale + offsetY
}

/** Generate SVG path d from y=f(x) */
function curveToPath(
  fn: (x: number) => number,
  xMin: number,
  xMax: number,
  steps: number,
  scale: number,
  offsetX: number,
  offsetY: number
): string {
  const dx = (xMax - xMin) / steps
  const parts: string[] = []
  for (let i = 0; i <= steps; i++) {
    const x = xMin + i * dx
    const y = fn(x)
    const px = sx(x, scale, offsetX)
    const py = sy(y, scale, offsetY)
    parts.push(i === 0 ? `M${px.toFixed(2)},${py.toFixed(2)}` : `L${px.toFixed(2)},${py.toFixed(2)}`)
  }
  return parts.join(' ')
}

/** Generate SVG path for filled area between y=f(x) and y=yBase */
function filledAreaPath(
  fn: (x: number) => number,
  xMin: number,
  xMax: number,
  yBase: number,
  steps: number,
  scale: number,
  offsetX: number,
  offsetY: number
): string {
  const dx = (xMax - xMin) / steps
  const parts: string[] = []
  // top curve left to right
  for (let i = 0; i <= steps; i++) {
    const x = xMin + i * dx
    const y = fn(x)
    const px = sx(x, scale, offsetX)
    const py = sy(y, scale, offsetY)
    parts.push(i === 0 ? `M${px.toFixed(2)},${py.toFixed(2)}` : `L${px.toFixed(2)},${py.toFixed(2)}`)
  }
  // close at yBase right to left
  const bx1 = sx(xMax, scale, offsetX)
  const by1 = sy(yBase, scale, offsetY)
  const bx0 = sx(xMin, scale, offsetX)
  parts.push(`L${bx1.toFixed(2)},${by1.toFixed(2)}`)
  parts.push(`L${bx0.toFixed(2)},${by1.toFixed(2)}`)
  parts.push('Z')
  return parts.join(' ')
}

/** Generate SVG path for filled area between two curves */
function filledAreaBetweenPath(
  fn1: (x: number) => number,
  fn2: (x: number) => number,
  xMin: number,
  xMax: number,
  steps: number,
  scale: number,
  offsetX: number,
  offsetY: number
): string {
  const dx = (xMax - xMin) / steps
  const parts: string[] = []
  // top curve (fn1) left to right
  for (let i = 0; i <= steps; i++) {
    const x = xMin + i * dx
    const y = fn1(x)
    const px = sx(x, scale, offsetX)
    const py = sy(y, scale, offsetY)
    parts.push(i === 0 ? `M${px.toFixed(2)},${py.toFixed(2)}` : `L${px.toFixed(2)},${py.toFixed(2)}`)
  }
  // bottom curve (fn2) right to left
  for (let i = steps; i >= 0; i--) {
    const x = xMin + i * dx
    const y = fn2(x)
    const px = sx(x, scale, offsetX)
    const py = sy(y, scale, offsetY)
    parts.push(`L${px.toFixed(2)},${py.toFixed(2)}`)
  }
  parts.push('Z')
  return parts.join(' ')
}

/** Generate SVG path for polar curve r=r(theta) */
function polarCurveToPath(
  rFn: (theta: number) => number,
  thetaMin: number,
  thetaMax: number,
  steps: number,
  scale: number,
  offsetX: number,
  offsetY: number
): string {
  const dTheta = (thetaMax - thetaMin) / steps
  const parts: string[] = []
  for (let i = 0; i <= steps; i++) {
    const theta = thetaMin + i * dTheta
    const r = rFn(theta)
    const x = r * Math.cos(theta)
    const y = r * Math.sin(theta)
    const px = sx(x, scale, offsetX)
    const py = sy(y, scale, offsetY)
    parts.push(i === 0 ? `M${px.toFixed(2)},${py.toFixed(2)}` : `L${px.toFixed(2)},${py.toFixed(2)}`)
  }
  return parts.join(' ')
}

/** Generate SVG path for filled polar area (closes to origin) */
function polarFilledPath(
  rFn: (theta: number) => number,
  thetaMin: number,
  thetaMax: number,
  steps: number,
  scale: number,
  offsetX: number,
  offsetY: number
): string {
  const dTheta = (thetaMax - thetaMin) / steps
  const parts: string[] = []
  const originX = sx(0, scale, offsetX)
  const originY = sy(0, scale, offsetY)
  parts.push(`M${originX.toFixed(2)},${originY.toFixed(2)}`)
  for (let i = 0; i <= steps; i++) {
    const theta = thetaMin + i * dTheta
    const r = rFn(theta)
    const x = r * Math.cos(theta)
    const y = r * Math.sin(theta)
    const px = sx(x, scale, offsetX)
    const py = sy(y, scale, offsetY)
    parts.push(`L${px.toFixed(2)},${py.toFixed(2)}`)
  }
  parts.push('Z')
  return parts.join(' ')
}

// ─────────────────────────────────────────────────────
// Background gradient for each mode
// ─────────────────────────────────────────────────────
function getBackgroundForMode(mode: string): string {
  if (mode === 'limit1' || mode === 'limit2') return 'from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/20'
  if (mode === 'derivative1' || mode === 'derivative2' || mode === 'derivative3') return 'from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20'
  if (mode === 'rolle1' || mode === 'lagrange1') return 'from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20'
  if (mode === 'indef_integral1') return 'from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/20'
  if (mode === 'ftc1' || mode === 'mean_value_integral1') return 'from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20'
  if (mode === 'area1') return 'from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/20'
  if (mode === 'volume_rev1') return 'from-sky-50 to-cyan-50 dark:from-sky-950/30 dark:to-cyan-950/20'
  if (mode === 'continuity1' || mode === 'discontinuity1' || mode === 'important_limits1') return 'from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/20'
  if (mode === 'lhopital1') return 'from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20'
  if (mode === 'monotonicity1' || mode === 'extrema1' || mode === 'concavity1' || mode === 'curvature1') return 'from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/20'
  if (mode === 'higher_derivative1') return 'from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20'
  if (mode === 'substitution1' || mode === 'integration_by_parts1') return 'from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/20'
  if (mode === 'improper_integral1') return 'from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20'
  if (mode === 'polar_area1') return 'from-sky-50 to-cyan-50 dark:from-sky-950/30 dark:to-cyan-950/20'
  if (mode.startsWith('step')) return 'from-emerald-50 to-slate-100 dark:from-emerald-950/50 dark:to-slate-900'
  if (mode.startsWith('prop')) return 'from-sky-50 to-slate-100 dark:from-sky-950/30 dark:to-slate-900'
  if (mode.startsWith('parity')) return 'from-orange-50 to-cyan-50 dark:from-orange-950/20 dark:to-cyan-950/20'
  if (mode.startsWith('cartesian')) return 'from-amber-50 to-slate-100 dark:from-amber-950/30 dark:to-slate-900'
  if (mode.startsWith('polar')) return 'from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/20'
  if (mode === 'rect_approx') return 'from-teal-50 to-slate-100 dark:from-teal-950/30 dark:to-slate-900'
  if (mode.startsWith('sphere_cyl')) return 'from-violet-50 to-slate-100 dark:from-violet-950/30 dark:to-slate-900'
  if (mode.startsWith('convergence')) return 'from-cyan-50 to-teal-50 dark:from-cyan-950/30 dark:to-teal-950/20'
  if (mode.startsWith('triple')) return 'from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/20'
  if (mode === 'jacobian1') return 'from-lime-50 to-slate-100 dark:from-lime-950/30 dark:to-slate-900'
  if (mode === 'green1') return 'from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20'
  if (mode === 'surface_area1') return 'from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/20'
  if (mode === 'fubini1') return 'from-slate-50 to-violet-50 dark:from-slate-900/50 dark:to-violet-950/20'
  if (mode === 'stokes1') return 'from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/20'
  if (mode === 'divergence1') return 'from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20'
  if (mode === 'arc_length1') return 'from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/20'
  if (mode === 'mass_center1' || mode === 'moment_of_inertia1') return 'from-cyan-50 to-teal-50 dark:from-cyan-950/30 dark:to-teal-950/20'
  if (mode === 'cylindrical1') return 'from-sky-50 to-cyan-50 dark:from-sky-950/30 dark:to-cyan-950/20'
  if (mode === 'gradient1') return 'from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/20'
  if (mode === 'spherical1') return 'from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/20'
  if (mode === 'laplace1') return 'from-slate-50 to-zinc-50 dark:from-slate-900/50 dark:to-zinc-900/30'
  if (mode === 'fourier1') return 'from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20'
  if (mode === 'vector_field1') return 'from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/20'
  if (mode === 'isosurface1') return 'from-cyan-50 to-teal-50 dark:from-cyan-950/30 dark:to-teal-950/20'
  if (mode === 'directional1') return 'from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/20'
  if (mode === 'curl1') return 'from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/20'
  if (mode === 'divergence_field1') return 'from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/20'
  if (mode === 'conservative1') return 'from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20'
  if (mode === 'surface_integral1') return 'from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/20'
  return 'from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800'
}

// ─────────────────────────────────────────────────────
// Mode accent color
// ─────────────────────────────────────────────────────
function getModeAccentColor(mode: string): string {
  if (mode === 'limit1' || mode === 'limit2') return 'bg-rose-500'
  if (mode === 'derivative1' || mode === 'derivative2' || mode === 'derivative3') return 'bg-amber-500'
  if (mode === 'rolle1' || mode === 'lagrange1') return 'bg-red-500'
  if (mode === 'indef_integral1') return 'bg-purple-500'
  if (mode === 'ftc1' || mode === 'mean_value_integral1') return 'bg-emerald-500'
  if (mode === 'area1') return 'bg-sky-500'
  if (mode === 'volume_rev1') return 'bg-sky-500'
  if (mode === 'continuity1' || mode === 'discontinuity1' || mode === 'important_limits1') return 'bg-rose-500'
  if (mode === 'lhopital1') return 'bg-amber-500'
  if (mode === 'monotonicity1' || mode === 'extrema1') return 'bg-teal-500'
  if (mode === 'concavity1' || mode === 'curvature1') return 'bg-cyan-500'
  if (mode === 'higher_derivative1') return 'bg-amber-500'
  if (mode === 'substitution1' || mode === 'integration_by_parts1') return 'bg-purple-500'
  if (mode === 'improper_integral1') return 'bg-emerald-500'
  if (mode === 'polar_area1') return 'bg-sky-500'
  if (mode.startsWith('step')) return 'bg-emerald-500'
  if (mode.startsWith('prop')) return 'bg-sky-500'
  if (mode.startsWith('parity')) return 'bg-orange-500'
  if (mode.startsWith('cartesian')) return 'bg-amber-500'
  if (mode.startsWith('polar')) return 'bg-rose-500'
  if (mode === 'rect_approx') return 'bg-emerald-500'
  if (mode.startsWith('sphere_cyl')) return 'bg-violet-500'
  if (mode.startsWith('convergence')) return 'bg-cyan-500'
  if (mode.startsWith('triple')) return 'bg-purple-500'
  if (mode === 'jacobian1') return 'bg-lime-500'
  if (mode === 'green1') return 'bg-red-500'
  if (mode === 'surface_area1') return 'bg-indigo-500'
  if (mode === 'fubini1') return 'bg-fuchsia-500'
  if (mode === 'stokes1') return 'bg-violet-500'
  if (mode === 'divergence1') return 'bg-orange-500'
  if (mode === 'arc_length1') return 'bg-sky-500'
  if (mode === 'mass_center1' || mode === 'moment_of_inertia1') return 'bg-cyan-500'
  if (mode === 'cylindrical1') return 'bg-sky-500'
  if (mode === 'gradient1') return 'bg-yellow-500'
  if (mode === 'spherical1') return 'bg-green-500'
  if (mode === 'laplace1') return 'bg-slate-500'
  if (mode === 'fourier1') return 'bg-orange-500'
  if (mode === 'vector_field1') return 'bg-teal-500'
  if (mode === 'isosurface1') return 'bg-cyan-500'
  if (mode === 'directional1') return 'bg-yellow-500'
  if (mode === 'curl1') return 'bg-rose-500'
  if (mode === 'divergence_field1') return 'bg-pink-500'
  if (mode === 'conservative1') return 'bg-emerald-500'
  if (mode === 'surface_integral1') return 'bg-violet-500'
  return 'bg-slate-500'
}

// ─────────────────────────────────────────────────────
// SVG Axes Component
// ─────────────────────────────────────────────────────
interface SVGAxesProps {
  xRange?: [number, number]
  yRange?: [number, number]
  scale: number
  offsetX: number
  offsetY: number
}

function SVGAxes({ xRange = [-6, 6], yRange = [-4, 4], scale, offsetX, offsetY }: SVGAxesProps) {
  const toSvgX = (mathX: number) => mathX * scale + offsetX
  const toSvgY = (mathY: number) => -mathY * scale + offsetY

  const xTicks: number[] = []
  const yTicks: number[] = []
  const xStart = Math.ceil(xRange[0])
  const xEnd = Math.floor(xRange[1])
  for (let i = xStart; i <= xEnd; i++) xTicks.push(i)
  const yStart = Math.ceil(yRange[0])
  const yEnd = Math.floor(yRange[1])
  for (let i = yStart; i <= yEnd; i++) yTicks.push(i)

  const tickLen = 4
  const axisOriginX = toSvgX(0)
  const axisOriginY = toSvgY(0)

  return (
    <g className="svg-axes">
      {xTicks.map((x) => (
        <line key={`grid-x-${x}`} x1={toSvgX(x)} y1={toSvgY(yRange[0])} x2={toSvgX(x)} y2={toSvgY(yRange[1])} stroke="currentColor" strokeWidth={0.5} opacity={0.08} className="text-foreground" />
      ))}
      {yTicks.map((y) => (
        <line key={`grid-y-${y}`} x1={toSvgX(xRange[0])} y1={toSvgY(y)} x2={toSvgX(xRange[1])} y2={toSvgY(y)} stroke="currentColor" strokeWidth={0.5} opacity={0.08} className="text-foreground" />
      ))}
      <line x1={toSvgX(xRange[0])} y1={axisOriginY} x2={toSvgX(xRange[1])} y2={axisOriginY} stroke="currentColor" strokeWidth={1.2} opacity={0.35} className="text-foreground" />
      <line x1={axisOriginX} y1={toSvgY(yRange[0])} x2={axisOriginX} y2={toSvgY(yRange[1])} stroke="currentColor" strokeWidth={1.2} opacity={0.35} className="text-foreground" />
      <polygon points={`${toSvgX(xRange[1])},${axisOriginY} ${toSvgX(xRange[1]) - 8},${axisOriginY - 4} ${toSvgX(xRange[1]) - 8},${axisOriginY + 4}`} fill="currentColor" opacity={0.35} className="text-foreground" />
      <polygon points={`${axisOriginX},${toSvgY(yRange[1])} ${axisOriginX - 4},${toSvgY(yRange[1]) + 8} ${axisOriginX + 4},${toSvgY(yRange[1]) + 8}`} fill="currentColor" opacity={0.35} className="text-foreground" />
      {xTicks.filter(x => x !== 0).map((x) => (
        <g key={`xtick-${x}`}>
          <line x1={toSvgX(x)} y1={axisOriginY - tickLen} x2={toSvgX(x)} y2={axisOriginY + tickLen} stroke="currentColor" strokeWidth={1} opacity={0.3} className="text-foreground" />
          <text x={toSvgX(x)} y={axisOriginY + tickLen + 12} textAnchor="middle" fontSize={10} fill="currentColor" opacity={0.4} className="text-foreground">{x}</text>
        </g>
      ))}
      {yTicks.filter(y => y !== 0).map((y) => (
        <g key={`ytick-${y}`}>
          <line x1={axisOriginX - tickLen} y1={toSvgY(y)} x2={axisOriginX + tickLen} y2={toSvgY(y)} stroke="currentColor" strokeWidth={1} opacity={0.3} className="text-foreground" />
          <text x={axisOriginX - tickLen - 4} y={toSvgY(y) + 4} textAnchor="end" fontSize={10} fill="currentColor" opacity={0.4} className="text-foreground">{y}</text>
        </g>
      ))}
      <text x={axisOriginX - 8} y={axisOriginY + 14} textAnchor="end" fontSize={10} fill="currentColor" opacity={0.4} className="text-foreground">O</text>
      <text x={toSvgX(xRange[1]) - 4} y={axisOriginY + 22} textAnchor="end" fontSize={13} fontStyle="italic" fill="currentColor" opacity={0.5} className="text-foreground">x</text>
      <text x={axisOriginX + 16} y={toSvgY(yRange[1]) + 6} textAnchor="start" fontSize={13} fontStyle="italic" fill="currentColor" opacity={0.5} className="text-foreground">y</text>
    </g>
  )
}

// ═══════════════════════════════════════════════════════
// 24 SVG Scene Components
// ═══════════════════════════════════════════════════════

// --- 1. limit1 (数列极限) ---
function Limit1SVG({ scale, offsetX, offsetY }: { scale: number; offsetX: number; offsetY: number }) {
  const { paramValue: c, paramValue2: L } = useLabStore()
  const eps = 0.3
  // Sequence: a_n = L + 1/n^c, where c = convergence speed (larger c → faster convergence)
  const xMax = 25

  const convergencePath = useMemo(() => curveToPath(
    (n) => L + 1 / Math.pow(Math.max(n, 0.01), c),
    0.5, xMax, 1000, scale, offsetX, offsetY
  ), [c, L, scale, offsetX, offsetY])

  const sequencePoints = useMemo(() => {
    const pts: { n: number; an: number }[] = []
    for (let n = 1; n <= 20; n++) {
      pts.push({ n, an: L + 1 / Math.pow(n, c) })
    }
    return pts
  }, [c, L])

  // Find N such that |a_N - L| < eps
  const nEps = useMemo(() => {
    for (let n = 1; n <= 1000; n++) {
      if (Math.abs(L + 1 / Math.pow(n, c) - L) < eps) return n
    }
    return 1000
  }, [c, L, eps])

  return (
    <g>
      <SVGAxes xRange={[-1, xMax + 1]} yRange={[L - 0.8, L + 1.8]} scale={scale} offsetX={offsetX} offsetY={offsetY} />
      {/* ε-band */}
      <rect x={sx(0, scale, offsetX)} y={sy(L + eps, scale, offsetY)} width={sx(xMax, scale, offsetX) - sx(0, scale, offsetX)} height={eps * scale * 2} fill="#10b981" opacity={0.12} />
      <line x1={sx(0, scale, offsetX)} y1={sy(L + eps, scale, offsetY)} x2={sx(xMax, scale, offsetX)} y2={sy(L + eps, scale, offsetY)} stroke="#10b981" strokeWidth={1.5} opacity={0.5} />
      <line x1={sx(0, scale, offsetX)} y1={sy(L - eps, scale, offsetY)} x2={sx(xMax, scale, offsetX)} y2={sy(L - eps, scale, offsetY)} stroke="#10b981" strokeWidth={1.5} opacity={0.5} />
      {/* Limit line */}
      <line x1={sx(0, scale, offsetX)} y1={sy(L, scale, offsetY)} x2={sx(xMax, scale, offsetX)} y2={sy(L, scale, offsetY)} stroke="#f59e0b" strokeWidth={2} />
      {/* Convergence curve */}
      <path d={convergencePath} fill="none" stroke="#64748b" strokeWidth={2} />
      {/* N_ε indicator line */}
      {nEps <= xMax && (
        <line x1={sx(nEps, scale, offsetX)} y1={sy(L - 0.8, scale, offsetY)} x2={sx(nEps, scale, offsetX)} y2={sy(L + 1.8, scale, offsetY)} stroke="#8b5cf6" strokeWidth={1} strokeDasharray="4,4" opacity={0.6} />
      )}
      {/* Sequence scatter points */}
      {sequencePoints.map((pt, idx) => {
        const withinEps = Math.abs(pt.an - L) < eps
        const cx = sx(pt.n, scale, offsetX)
        const cy = sy(pt.an, scale, offsetY)
        return <circle key={idx} cx={cx} cy={cy} r={4} fill={withinEps ? '#f97316' : '#ef4444'} stroke="white" strokeWidth={1.5} />
      })}
      {/* Drop lines from points to L */}
      {sequencePoints.map((pt, idx) => {
        const withinEps = Math.abs(pt.an - L) < eps
        const cx = sx(pt.n, scale, offsetX)
        return <line key={`drop-${idx}`} x1={cx} y1={sy(pt.an, scale, offsetY)} x2={cx} y2={sy(L, scale, offsetY)} stroke={withinEps ? '#f97316' : '#ef4444'} strokeWidth={0.8} opacity={0.35} />
      })}
      {/* Labels */}
      <text x={sx(xMax - 0.5, scale, offsetX)} y={sy(L + eps + 0.12, scale, offsetY)} fontSize={11} fill="#10b981" textAnchor="end">+ε</text>
      <text x={sx(xMax - 0.5, scale, offsetX)} y={sy(L - eps + 0.12, scale, offsetY)} fontSize={11} fill="#10b981" textAnchor="end">-ε</text>
      <text x={sx(xMax - 0.5, scale, offsetX)} y={sy(L + 0.15, scale, offsetY)} fontSize={11} fill="#f59e0b" textAnchor="end">L</text>
      {nEps <= xMax && (
        <text x={sx(nEps, scale, offsetX)} y={sy(L + 1.6, scale, offsetY)} fontSize={10} fill="#8b5cf6" textAnchor="middle">N_ε={nEps}</text>
      )}
      {/* x-axis label */}
      <text x={sx(xMax + 0.5, scale, offsetX)} y={sy(L - 0.8, scale, offsetY) - 4} fontSize={13} fontStyle="italic" fill="currentColor" opacity={0.5} className="text-foreground">n</text>
    </g>
  )
}

// --- 2. limit2 (函数极限 ε-δ) ---
function Limit2SVG({ scale, offsetX, offsetY }: { scale: number; offsetX: number; offsetY: number }) {
  const { paramValue: eps } = useLabStore()
  const x0 = Math.PI / 2
  const L = 2
  const fAt = (x: number) => Math.sin(x) + 1

  const delta = useMemo(() => {
    const n = 1000
    const maxD = 2
    const dd = maxD / n
    for (let i = n; i >= 1; i--) {
      const d = i * dd
      if (Math.abs(fAt(x0 - d) - L) <= eps && Math.abs(fAt(x0 + d) - L) <= eps) return d
    }
    return 0.01
  }, [eps])

  const curvePath = useMemo(() => curveToPath(fAt, -3, 3.5, 300, scale, offsetX, offsetY), [scale, offsetX, offsetY])

  return (
    <g>
      <SVGAxes xRange={[-3, 4]} yRange={[-0.5, 3.5]} scale={scale} offsetX={offsetX} offsetY={offsetY} />
      {/* Curve */}
      <path d={curvePath} fill="none" stroke="#14b8a6" strokeWidth={2} />
      {/* ε-band */}
      <rect x={sx(-3, scale, offsetX)} y={sy(L + eps, scale, offsetY)} width={sx(3.5, scale, offsetX) - sx(-3, scale, offsetX)} height={eps * scale} fill="#10b981" opacity={0.1} />
      <rect x={sx(-3, scale, offsetX)} y={sy(L, scale, offsetY)} width={sx(3.5, scale, offsetX) - sx(-3, scale, offsetX)} height={eps * scale} fill="#10b981" opacity={0.1} />
      <line x1={sx(-3, scale, offsetX)} y1={sy(L + eps, scale, offsetY)} x2={sx(3.5, scale, offsetX)} y2={sy(L + eps, scale, offsetY)} stroke="#10b981" strokeWidth={1.5} opacity={0.5} />
      <line x1={sx(-3, scale, offsetX)} y1={sy(L - eps, scale, offsetY)} x2={sx(3.5, scale, offsetX)} y2={sy(L - eps, scale, offsetY)} stroke="#10b981" strokeWidth={1.5} opacity={0.5} />
      {/* δ-interval */}
      <rect x={sx(x0 - delta, scale, offsetX)} y={sy(L + 1, scale, offsetY)} width={delta * 2 * scale} height={(L + 1.5) * scale} fill="#f97316" opacity={0.1} />
      <line x1={sx(x0 - delta, scale, offsetX)} y1={sy(-0.5, scale, offsetY)} x2={sx(x0 - delta, scale, offsetX)} y2={sy(L + 1, scale, offsetY)} stroke="#f97316" strokeWidth={1.5} />
      <line x1={sx(x0 + delta, scale, offsetX)} y1={sy(-0.5, scale, offsetY)} x2={sx(x0 + delta, scale, offsetX)} y2={sy(L + 1, scale, offsetY)} stroke="#f97316" strokeWidth={1.5} />
      {/* Point */}
      <circle cx={sx(x0, scale, offsetX)} cy={sy(L, scale, offsetY)} r={5} fill="#ef4444" />
      {/* Horizontal line at L */}
      <line x1={sx(-3, scale, offsetX)} y1={sy(L, scale, offsetY)} x2={sx(3.5, scale, offsetX)} y2={sy(L, scale, offsetY)} stroke="#f59e0b" strokeWidth={1} opacity={0.5} strokeDasharray="5,5" />
    </g>
  )
}

// --- 3. derivative1 (割线→切线) ---
function Derivative1SVG({ scale, offsetX, offsetY }: { scale: number; offsetX: number; offsetY: number }) {
  const { paramValue: deltaX } = useLabStore()
  const x0 = 1
  const fAt = (x: number) => Math.sin(x) + 0.5 * x

  const curvePath = useMemo(() => curveToPath(fAt, -3, 4, 300, scale, offsetX, offsetY), [scale, offsetX, offsetY])
  const tangentSlope = Math.cos(x0) + 0.5
  const secantSlope = (fAt(x0 + deltaX) - fAt(x0)) / deltaX

  return (
    <g>
      <SVGAxes xRange={[-3, 4]} yRange={[-2, 3.5]} scale={scale} offsetX={offsetX} offsetY={offsetY} />
      <path d={curvePath} fill="none" stroke="#14b8a6" strokeWidth={2} />
      {/* Tangent line */}
      <line x1={sx(x0 - 2, scale, offsetX)} y1={sy(fAt(x0) - tangentSlope * 2, scale, offsetY)} x2={sx(x0 + 2, scale, offsetX)} y2={sy(fAt(x0) + tangentSlope * 2, scale, offsetY)} stroke="#ef4444" strokeWidth={2} />
      {/* Secant line */}
      <line x1={sx(x0 - 1, scale, offsetX)} y1={sy(fAt(x0) - secantSlope, scale, offsetY)} x2={sx(x0 + deltaX + 1, scale, offsetX)} y2={sy(fAt(x0) + secantSlope * (deltaX + 1), scale, offsetY)} stroke="#3b82f6" strokeWidth={2} strokeDasharray="6,3" />
      {/* Points */}
      <circle cx={sx(x0, scale, offsetX)} cy={sy(fAt(x0), scale, offsetY)} r={5} fill="#ef4444" />
      <circle cx={sx(x0 + deltaX, scale, offsetX)} cy={sy(fAt(x0 + deltaX), scale, offsetY)} r={5} fill="#3b82f6" />
      {/* Δx indicator */}
      <line x1={sx(x0, scale, offsetX)} y1={sy(fAt(x0), scale, offsetY)} x2={sx(x0 + deltaX, scale, offsetX)} y2={sy(fAt(x0), scale, offsetY)} stroke="#3b82f6" strokeWidth={1} opacity={0.6} />
      <line x1={sx(x0 + deltaX, scale, offsetX)} y1={sy(fAt(x0), scale, offsetY)} x2={sx(x0 + deltaX, scale, offsetX)} y2={sy(fAt(x0 + deltaX), scale, offsetY)} stroke="#3b82f6" strokeWidth={1} opacity={0.6} />
    </g>
  )
}

// --- 4. derivative2 (切线与导函数) ---
function Derivative2SVG({ scale, offsetX, offsetY }: { scale: number; offsetX: number; offsetY: number }) {
  const { paramValue: x0 } = useLabStore()
  const fAt = (x: number) => x * x * x - 3 * x
  const dfAt = (x: number) => 3 * x * x - 3

  const fPath = useMemo(() => curveToPath(fAt, -2.5, 2.5, 300, scale, offsetX, offsetY), [scale, offsetX, offsetY])
  const dfPath = useMemo(() => curveToPath(dfAt, -2.5, 2.5, 300, scale, offsetX, offsetY), [scale, offsetX, offsetY])
  const tangentSlope = dfAt(x0)

  return (
    <g>
      <SVGAxes xRange={[-3, 3]} yRange={[-5, 5]} scale={scale} offsetX={offsetX} offsetY={offsetY} />
      <path d={fPath} fill="none" stroke="#3b82f6" strokeWidth={2} />
      <path d={dfPath} fill="none" stroke="#ef4444" strokeWidth={2} />
      {/* Tangent line */}
      <line x1={sx(x0 - 1.5, scale, offsetX)} y1={sy(fAt(x0) - tangentSlope * 1.5, scale, offsetY)} x2={sx(x0 + 1.5, scale, offsetX)} y2={sy(fAt(x0) + tangentSlope * 1.5, scale, offsetY)} stroke="#f59e0b" strokeWidth={2} />
      {/* Points */}
      <circle cx={sx(x0, scale, offsetX)} cy={sy(fAt(x0), scale, offsetY)} r={5} fill="#3b82f6" />
      <circle cx={sx(x0, scale, offsetX)} cy={sy(dfAt(x0), scale, offsetY)} r={5} fill="#ef4444" />
      {/* Vertical connecting line */}
      <line x1={sx(x0, scale, offsetX)} y1={sy(fAt(x0), scale, offsetY)} x2={sx(x0, scale, offsetX)} y2={sy(dfAt(x0), scale, offsetY)} stroke="#94a3b8" strokeWidth={1} opacity={0.4} strokeDasharray="3,3" />
      {/* Labels */}
      <text x={sx(-2.5, scale, offsetX) - 8} y={sy(3, scale, offsetY)} fontSize={12} fill="#3b82f6" fontWeight="bold">f(x)</text>
      <text x={sx(-2.5, scale, offsetX) - 8} y={sy(-1, scale, offsetY)} fontSize={12} fill="#ef4444" fontWeight="bold">f&apos;(x)</text>
    </g>
  )
}

// --- 5. derivative3 (微分与线性近似) ---
function Derivative3SVG({ scale, offsetX, offsetY }: { scale: number; offsetX: number; offsetY: number }) {
  const { paramValue: x0, paramValue2: deltaX } = useLabStore()
  const fAt = (x: number) => x * x
  const dfAt = (x: number) => 2 * x

  const curvePath = useMemo(() => curveToPath(fAt, 0, 4, 300, scale, offsetX, offsetY), [scale, offsetX, offsetY])
  const dy = dfAt(x0) * deltaX
  const deltaY = fAt(x0 + deltaX) - fAt(x0)

  return (
    <g>
      <SVGAxes xRange={[-0.5, 4]} yRange={[-0.5, 7]} scale={scale} offsetX={offsetX} offsetY={offsetY} />
      <path d={curvePath} fill="none" stroke="#14b8a6" strokeWidth={2} />
      {/* Points */}
      <circle cx={sx(x0, scale, offsetX)} cy={sy(fAt(x0), scale, offsetY)} r={5} fill="#14b8a6" />
      <circle cx={sx(x0 + deltaX, scale, offsetX)} cy={sy(fAt(x0 + deltaX), scale, offsetY)} r={5} fill="#ef4444" />
      {/* Δy (actual change, blue) */}
      <line x1={sx(x0 + deltaX, scale, offsetX)} y1={sy(fAt(x0), scale, offsetY)} x2={sx(x0 + deltaX, scale, offsetX)} y2={sy(fAt(x0 + deltaX), scale, offsetY)} stroke="#3b82f6" strokeWidth={2.5} />
      {/* dy (differential, red) */}
      <line x1={sx(x0 + deltaX, scale, offsetX)} y1={sy(fAt(x0), scale, offsetY)} x2={sx(x0 + deltaX, scale, offsetX)} y2={sy(fAt(x0) + dy, scale, offsetY)} stroke="#ef4444" strokeWidth={2.5} />
      {/* Tangent line */}
      <line x1={sx(x0 - 0.5, scale, offsetX)} y1={sy(fAt(x0) - dfAt(x0) * 0.5, scale, offsetY)} x2={sx(x0 + deltaX + 0.5, scale, offsetX)} y2={sy(fAt(x0) + dfAt(x0) * (deltaX + 0.5), scale, offsetY)} stroke="#f59e0b" strokeWidth={1.5} opacity={0.6} />
      {/* Δx indicator */}
      <line x1={sx(x0, scale, offsetX)} y1={sy(fAt(x0), scale, offsetY)} x2={sx(x0 + deltaX, scale, offsetX)} y2={sy(fAt(x0), scale, offsetY)} stroke="#94a3b8" strokeWidth={1.5} opacity={0.6} />
    </g>
  )
}

// --- 6. rolle1 (罗尔定理) ---
function Rolle1SVG({ scale, offsetX, offsetY }: { scale: number; offsetX: number; offsetY: number }) {
  const { paramValue: a } = useLabStore()
  const fAt = (x: number) => a * (x - 1) * (x - 3) * (x - 5)
  const { xi1, xi2, fXi1, fXi2 } = useMemo(() => findRollePoint(a), [a])

  const curvePath = useMemo(() => curveToPath((x) => a * (x - 1) * (x - 3) * (x - 5), 0.5, 6, 300, scale, offsetX, offsetY), [a, scale, offsetX, offsetY])

  return (
    <g>
      <SVGAxes xRange={[-1, 4]} yRange={[-5, 5]} scale={scale} offsetX={offsetX} offsetY={offsetY} />
      <path d={curvePath} fill="none" stroke="#14b8a6" strokeWidth={2} />
      {/* Endpoints */}
      <circle cx={sx(1, scale, offsetX)} cy={sy(0, scale, offsetY)} r={6} fill="#f59e0b" />
      <circle cx={sx(5, scale, offsetX)} cy={sy(0, scale, offsetY)} r={6} fill="#f59e0b" />
      {/* y=0 line */}
      <line x1={sx(-0.5, scale, offsetX)} y1={sy(0, scale, offsetY)} x2={sx(5.5, scale, offsetX)} y2={sy(0, scale, offsetY)} stroke="#94a3b8" strokeWidth={1} opacity={0.5} />
      {/* ξ1 point + tangent */}
      <circle cx={sx(xi1, scale, offsetX)} cy={sy(fXi1, scale, offsetY)} r={6} fill="#ef4444" />
      <line x1={sx(xi1 - 1, scale, offsetX)} y1={sy(fXi1, scale, offsetY)} x2={sx(xi1 + 1, scale, offsetX)} y2={sy(fXi1, scale, offsetY)} stroke="#ef4444" strokeWidth={2} />
      {/* ξ2 point + tangent */}
      <circle cx={sx(xi2, scale, offsetX)} cy={sy(fXi2, scale, offsetY)} r={6} fill="#ef4444" />
      <line x1={sx(xi2 - 1, scale, offsetX)} y1={sy(fXi2, scale, offsetY)} x2={sx(xi2 + 1, scale, offsetX)} y2={sy(fXi2, scale, offsetY)} stroke="#ef4444" strokeWidth={2} />
      {/* Labels */}
      <text x={sx(xi1, scale, offsetX)} y={sy(fXi1, scale, offsetY) - 10} fontSize={11} fill="#ef4444" textAnchor="middle">ξ₁</text>
      <text x={sx(xi2, scale, offsetX)} y={sy(fXi2, scale, offsetY) - 10} fontSize={11} fill="#ef4444" textAnchor="middle">ξ₂</text>
    </g>
  )
}

// --- 7. lagrange1 (拉格朗日中值定理) ---
function Lagrange1SVG({ scale, offsetX, offsetY }: { scale: number; offsetX: number; offsetY: number }) {
  const { paramValue: a } = useLabStore()
  const fAt = (x: number) => a * (x * x * x - 6 * x * x + 11 * x)
  const { xi, secantSlope, tangentSlope } = useMemo(() => findLagrangePoint(a), [a])
  const f0 = 0
  const f4 = a * (64 - 96 + 44)

  const curvePath = useMemo(() => curveToPath((x) => a * (x * x * x - 6 * x * x + 11 * x), 0, 5, 300, scale, offsetX, offsetY), [a, scale, offsetX, offsetY])

  return (
    <g>
      <SVGAxes xRange={[-1, 5]} yRange={[-1, 14]} scale={scale} offsetX={offsetX} offsetY={offsetY} />
      <path d={curvePath} fill="none" stroke="#14b8a6" strokeWidth={2} />
      {/* Secant line (blue) */}
      <line x1={sx(0, scale, offsetX)} y1={sy(f0, scale, offsetY)} x2={sx(4, scale, offsetX)} y2={sy(f4, scale, offsetY)} stroke="#3b82f6" strokeWidth={2} strokeDasharray="6,3" />
      {/* Parallel tangent line (red) */}
      <line x1={sx(xi - 1.5, scale, offsetX)} y1={sy(fAt(xi) - tangentSlope * 1.5, scale, offsetY)} x2={sx(xi + 1.5, scale, offsetX)} y2={sy(fAt(xi) + tangentSlope * 1.5, scale, offsetY)} stroke="#ef4444" strokeWidth={2} />
      {/* Point at ξ */}
      <circle cx={sx(xi, scale, offsetX)} cy={sy(fAt(xi), scale, offsetY)} r={6} fill="#ef4444" />
      {/* Endpoints */}
      <circle cx={sx(0, scale, offsetX)} cy={sy(f0, scale, offsetY)} r={5} fill="#3b82f6" />
      <circle cx={sx(4, scale, offsetX)} cy={sy(f4, scale, offsetY)} r={5} fill="#3b82f6" />
      <text x={sx(xi, scale, offsetX)} y={sy(fAt(xi), scale, offsetY) - 10} fontSize={11} fill="#ef4444" textAnchor="middle">ξ</text>
    </g>
  )
}

// --- 8. indef_integral1 (原函数族) ---
function IndefIntegral1SVG({ scale, offsetX, offsetY }: { scale: number; offsetX: number; offsetY: number }) {
  const { paramValue: count } = useLabStore()
  const numCurves = Math.round(count)
  const colors = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899']

  const curves = useMemo(() => {
    const result: { path: string; color: string; C: number }[] = []
    const cRange = 4
    for (let k = 0; k < numCurves; k++) {
      const C = -cRange + (2 * cRange * k) / Math.max(numCurves - 1, 1)
      const path = curveToPath((x) => x * x + C, -2.5, 2.5, 200, scale, offsetX, offsetY)
      result.push({ path, color: colors[k % colors.length], C })
    }
    return result
  }, [numCurves, scale, offsetX, offsetY])

  const fLinePath = useMemo(() => curveToPath((x) => 2 * x, -2.5, 2.5, 200, scale, offsetX, offsetY), [scale, offsetX, offsetY])

  return (
    <g>
      <SVGAxes xRange={[-3, 3]} yRange={[-6, 8]} scale={scale} offsetX={offsetX} offsetY={offsetY} />
      {curves.map((curve, idx) => (
        <path key={idx} d={curve.path} fill="none" stroke={curve.color} strokeWidth={2} />
      ))}
      {/* f(x) = 2x (derivative, dashed) */}
      <path d={fLinePath} fill="none" stroke="#94a3b8" strokeWidth={1.5} opacity={0.5} strokeDasharray="5,5" />
      <text x={sx(2.5, scale, offsetX) + 5} y={sy(5, scale, offsetY)} fontSize={12} fill="#14b8a6">F(x)=x²+C</text>
      <text x={sx(2.5, scale, offsetX) + 5} y={sy(-4, scale, offsetY)} fontSize={12} fill="#94a3b8">f(x)=2x</text>
    </g>
  )
}

// --- 9. ftc1 (微积分基本定理) ---
function Ftc1SVG({ scale, offsetX, offsetY }: { scale: number; offsetX: number; offsetY: number }) {
  const { paramValue: upperLimit } = useLabStore()
  const fAt = (x: number) => Math.sin(x) + 1

  const fPath = useMemo(() => curveToPath(fAt, -3, 3, 300, scale, offsetX, offsetY), [scale, offsetX, offsetY])
  const areaPathD = useMemo(() => filledAreaPath(fAt, -2, upperLimit, 0, 120, scale, offsetX, offsetY), [upperLimit, scale, offsetX, offsetY])
  const phiAtX = -Math.cos(upperLimit) + upperLimit - (-Math.cos(-2) + (-2))
  const phiPath = useMemo(() => curveToPath(
    (x) => -Math.cos(x) + x - (-Math.cos(-2) + (-2)),
    -3, 3, 300, scale, offsetX, offsetY
  ), [scale, offsetX, offsetY])

  return (
    <g>
      <SVGAxes xRange={[-3.5, 3.5]} yRange={[-1, 5]} scale={scale} offsetX={offsetX} offsetY={offsetY} />
      {/* Shaded area */}
      <path d={areaPathD} fill="#14b8a6" opacity={0.35} />
      {/* f(x) curve */}
      <path d={fPath} fill="none" stroke="#14b8a6" strokeWidth={2} />
      {/* Φ(x) curve */}
      <path d={phiPath} fill="none" stroke="#f59e0b" strokeWidth={2} />
      {/* Upper limit indicator on f */}
      <circle cx={sx(upperLimit, scale, offsetX)} cy={sy(fAt(upperLimit), scale, offsetY)} r={5} fill="#ef4444" />
      {/* Corresponding point on Φ */}
      <circle cx={sx(upperLimit, scale, offsetX)} cy={sy(phiAtX, scale, offsetY)} r={5} fill="#f59e0b" />
      {/* Vertical line at upper limit */}
      <line x1={sx(upperLimit, scale, offsetX)} y1={sy(0, scale, offsetY)} x2={sx(upperLimit, scale, offsetX)} y2={sy(fAt(upperLimit), scale, offsetY)} stroke="#ef4444" strokeWidth={1} opacity={0.6} strokeDasharray="3,3" />
      <text x={sx(-3, scale, offsetX) - 5} y={sy(3, scale, offsetY)} fontSize={12} fill="#14b8a6" textAnchor="end">f(x)</text>
      <text x={sx(-3, scale, offsetX) - 5} y={sy(1, scale, offsetY)} fontSize={12} fill="#f59e0b" textAnchor="end">Φ(x)</text>
    </g>
  )
}

// --- 10. mean_value_integral1 (积分中值定理) ---
function MeanValueIntegral1SVG({ scale, offsetX, offsetY }: { scale: number; offsetX: number; offsetY: number }) {
  const { paramValue: a } = useLabStore()
  const fAt = (x: number) => a * Math.sin(x) + 1

  const { xi, avgValue, integral } = useMemo(() => findMeanValueIntegralPoint((x) => a * Math.sin(x) + 1, 0, 2 * Math.PI), [a])
  const curvePath = useMemo(() => curveToPath((x) => a * Math.sin(x) + 1, -Math.PI, Math.PI, 300, scale, offsetX, offsetY), [a, scale, offsetX, offsetY])
  const areaPathD = useMemo(() => filledAreaPath((x) => a * Math.sin(x) + 1, -Math.PI, Math.PI, 0, 120, scale, offsetX, offsetY), [a, scale, offsetX, offsetY])

  return (
    <g>
      <SVGAxes xRange={[-3.5, 3.5]} yRange={[-1.5, 4]} scale={scale} offsetX={offsetX} offsetY={offsetY} />
      {/* Area fill */}
      <path d={areaPathD} fill="#14b8a6" opacity={0.3} />
      {/* Curve */}
      <path d={curvePath} fill="none" stroke="#14b8a6" strokeWidth={2} />
      {/* Average value rectangle */}
      <rect x={sx(-Math.PI, scale, offsetX)} y={sy(avgValue, scale, offsetY)} width={2 * Math.PI * scale} height={avgValue * scale} fill="#f59e0b" opacity={0.25} stroke="#f59e0b" strokeWidth={1} />
      {/* Average value line */}
      <line x1={sx(-Math.PI, scale, offsetX)} y1={sy(avgValue, scale, offsetY)} x2={sx(Math.PI, scale, offsetX)} y2={sy(avgValue, scale, offsetY)} stroke="#f59e0b" strokeWidth={2} />
      {/* ξ point */}
      <circle cx={sx(xi - Math.PI, scale, offsetX)} cy={sy(fAt(xi), scale, offsetY)} r={6} fill="#ef4444" />
    </g>
  )
}

// --- 11. area1 (曲线间面积) ---
function Area1SVG({ scale, offsetX, offsetY }: { scale: number; offsetX: number; offsetY: number }) {
  const { paramValue: a } = useLabStore()
  const fFn = (x: number) => a + Math.cos(x)
  const gFn = (x: number) => Math.sin(x)

  const fPath = useMemo(() => curveToPath((x) => a + Math.cos(x), -Math.PI, Math.PI, 300, scale, offsetX, offsetY), [a, scale, offsetX, offsetY])
  const gPath = useMemo(() => curveToPath((x) => Math.sin(x), -Math.PI, Math.PI, 300, scale, offsetX, offsetY), [scale, offsetX, offsetY])
  const betweenPath = useMemo(() => filledAreaBetweenPath((x) => a + Math.cos(x), (x) => Math.sin(x), -Math.PI, Math.PI, 120, scale, offsetX, offsetY), [a, scale, offsetX, offsetY])

  return (
    <g>
      <SVGAxes xRange={[-3.5, 3.5]} yRange={[-2, 3.5]} scale={scale} offsetX={offsetX} offsetY={offsetY} />
      {/* Filled area between curves */}
      <path d={betweenPath} fill="#14b8a6" opacity={0.3} />
      {/* f(x) = a+cos(x) */}
      <path d={fPath} fill="none" stroke="#14b8a6" strokeWidth={2} />
      {/* g(x) = sin(x) */}
      <path d={gPath} fill="none" stroke="#f59e0b" strokeWidth={2} />
      <text x={sx(-3, scale, offsetX)} y={sy(a + 1.2, scale, offsetY)} fontSize={11} fill="#14b8a6">f(x)={a.toFixed(1)}+cos(x)</text>
      <text x={sx(-3, scale, offsetX)} y={sy(-1.2, scale, offsetY)} fontSize={11} fill="#f59e0b">g(x)=sin(x)</text>
    </g>
  )
}

// --- 12. continuity1 (函数连续性) ---
function Continuity1SVG({ scale, offsetX, offsetY }: { scale: number; offsetX: number; offsetY: number }) {
  const { paramValue } = useLabStore()
  const isContinuous = paramValue >= 1

  const contPath = useMemo(() => curveToPath((x) => x * x, -3, 3, 300, scale, offsetX, offsetY), [scale, offsetX, offsetY])
  const discontLeftPath = useMemo(() => curveToPath((x) => x * x + 1, -3, -0.01, 200, scale, offsetX, offsetY), [scale, offsetX, offsetY])
  const discontRightPath = useMemo(() => curveToPath((x) => x * x - 0.5, 0.01, 3, 200, scale, offsetX, offsetY), [scale, offsetX, offsetY])

  return (
    <g>
      <SVGAxes xRange={[-3.5, 3.5]} yRange={[-1.5, 5]} scale={scale} offsetX={offsetX} offsetY={offsetY} />
      {/* Continuous f(x)=x² */}
      <path d={contPath} fill="none" stroke="#22c55e" strokeWidth={2} />
      {!isContinuous && (
        <>
          <path d={discontLeftPath} fill="none" stroke="#ef4444" strokeWidth={2} />
          <path d={discontRightPath} fill="none" stroke="#ef4444" strokeWidth={2} />
          {/* Open/closed circles */}
          <circle cx={sx(0, scale, offsetX)} cy={sy(1, scale, offsetY)} r={5} fill="#ef4444" />
          <circle cx={sx(0, scale, offsetX)} cy={sy(-0.5, scale, offsetY)} r={5} fill="#ef4444" />
          <line x1={sx(0, scale, offsetX)} y1={sy(-0.5, scale, offsetY)} x2={sx(0, scale, offsetX)} y2={sy(0, scale, offsetY)} stroke="#ef4444" strokeWidth={1} opacity={0.4} strokeDasharray="3,3" />
        </>
      )}
    </g>
  )
}

// --- 13. discontinuity1 (间断点类型) ---
function Discontinuity1SVG({ scale, offsetX, offsetY }: { scale: number; offsetX: number; offsetY: number }) {
  const { paramValue } = useLabStore()
  const dtype = Math.round(paramValue)

  // Type 1: Removable at x=1
  const removablePath = useMemo(() => {
    const parts: string[] = []
    for (let i = -300; i <= 300; i++) {
      const x = (i / 100) * 3
      if (Math.abs(x - 1) < 0.05) continue
      const y = x + 1
      const px = sx(x, scale, offsetX)
      const py = sy(y, scale, offsetY)
      parts.push(i === -300 || Math.abs(x - 1) < 0.1 ? `M${px.toFixed(2)},${py.toFixed(2)}` : `L${px.toFixed(2)},${py.toFixed(2)}`)
    }
    return parts.join(' ')
  }, [scale, offsetX, offsetY])

  // Type 3: Infinite at x=3
  const infinitePaths = useMemo(() => {
    const left: string[] = []
    const right: string[] = []
    for (let i = -300; i <= 300; i++) {
      const x = (i / 100) * 6 - 3
      const y = 1 / (x - 3)
      if (Math.abs(y) > 5) continue
      const px = sx(x, scale, offsetX)
      const py = sy(y, scale, offsetY)
      if (x < 3 - 0.1) left.push(left.length === 0 ? `M${px.toFixed(2)},${py.toFixed(2)}` : `L${px.toFixed(2)},${py.toFixed(2)}`)
      else if (x > 3 + 0.1) right.push(right.length === 0 ? `M${px.toFixed(2)},${py.toFixed(2)}` : `L${px.toFixed(2)},${py.toFixed(2)}`)
    }
    return { left: left.join(' '), right: right.join(' ') }
  }, [scale, offsetX, offsetY])

  // Type 4: Oscillating
  const oscPath = useMemo(() => {
    const parts: string[] = []
    for (let i = -400; i <= 400; i++) {
      const x = (i / 200) * 3
      if (Math.abs(x) < 0.02) continue
      const y = Math.sin(1 / x)
      const px = sx(x, scale, offsetX)
      const py = sy(y, scale, offsetY)
      parts.push(parts.length === 0 ? `M${px.toFixed(2)},${py.toFixed(2)}` : `L${px.toFixed(2)},${py.toFixed(2)}`)
    }
    return parts.join(' ')
  }, [scale, offsetX, offsetY])

  return (
    <g>
      <SVGAxes xRange={[-3.5, 3.5]} yRange={[-3, 4]} scale={scale} offsetX={offsetX} offsetY={offsetY} />
      {dtype === 1 && (
        <>
          <path d={removablePath} fill="none" stroke="#3b82f6" strokeWidth={2} />
          <circle cx={sx(1, scale, offsetX)} cy={sy(2, scale, offsetY)} r={5} fill="none" stroke="#3b82f6" strokeWidth={2} />
        </>
      )}
      {dtype === 2 && (
        <>
          <path d={curveToPath((x) => x > 0 ? 1 : -1, -3, 2, 1, scale, offsetX, offsetY)} fill="none" stroke="#f59e0b" strokeWidth={2} />
          <path d={curveToPath(() => -1, 2, 3, 1, scale, offsetX, offsetY)} fill="none" stroke="#f59e0b" strokeWidth={2} />
          <circle cx={sx(2, scale, offsetX)} cy={sy(1, scale, offsetY)} r={5} fill="#f59e0b" />
        </>
      )}
      {dtype === 3 && (
        <>
          <path d={infinitePaths.left} fill="none" stroke="#ef4444" strokeWidth={2} />
          <path d={infinitePaths.right} fill="none" stroke="#ef4444" strokeWidth={2} />
          <line x1={sx(3, scale, offsetX)} y1={sy(-4, scale, offsetY)} x2={sx(3, scale, offsetX)} y2={sy(4, scale, offsetY)} stroke="#ef4444" strokeWidth={1} opacity={0.3} strokeDasharray="4,4" />
        </>
      )}
      {dtype === 4 && (
        <path d={oscPath} fill="none" stroke="#8b5cf6" strokeWidth={2} />
      )}
    </g>
  )
}

// --- 14. important_limits1 (两个重要极限) ---
function ImportantLimits1SVG({ scale, offsetX, offsetY }: { scale: number; offsetX: number; offsetY: number }) {
  const { paramValue: xVal } = useLabStore()

  const sinXPath = useMemo(() => curveToPath(
    (x) => x > 0.001 ? Math.sin(x) / x + 4 : 5,
    0.01, 10, 300, scale, offsetX, offsetY
  ), [scale, offsetX, offsetY])

  const expLimitPath = useMemo(() => curveToPath(
    (x) => x > 0.1 ? Math.pow(1 + 1 / x, x) - 1.5 : Math.E - 1.5,
    0.1, 10, 300, scale, offsetX, offsetY
  ), [scale, offsetX, offsetY])

  const sinVal = xVal > 0.001 ? Math.sin(xVal) / xVal : 1
  const expVal = xVal > 0.1 ? Math.pow(1 + 1 / xVal, xVal) : Math.E

  return (
    <g>
      <SVGAxes xRange={[-0.5, 11]} yRange={[-2, 6]} scale={scale} offsetX={offsetX} offsetY={offsetY} />
      {/* sin(x)/x → 1 curve (shifted up 4) */}
      <path d={sinXPath} fill="none" stroke="#3b82f6" strokeWidth={2} />
      <line x1={sx(0, scale, offsetX)} y1={sy(5, scale, offsetY)} x2={sx(10, scale, offsetX)} y2={sy(5, scale, offsetY)} stroke="#ef4444" strokeWidth={1} opacity={0.5} strokeDasharray="5,5" />
      <text x={sx(10, scale, offsetX) + 5} y={sy(5, scale, offsetY)} fontSize={11} fill="#ef4444">y=1</text>
      {/* (1+1/x)^x → e curve (shifted down 1.5) */}
      <path d={expLimitPath} fill="none" stroke="#f59e0b" strokeWidth={2} />
      <line x1={sx(0, scale, offsetX)} y1={sy(Math.E - 1.5, scale, offsetY)} x2={sx(10, scale, offsetX)} y2={sy(Math.E - 1.5, scale, offsetY)} stroke="#ef4444" strokeWidth={1} opacity={0.5} strokeDasharray="5,5" />
      <text x={sx(10, scale, offsetX) + 5} y={sy(Math.E - 1.5, scale, offsetY)} fontSize={11} fill="#ef4444">y=e</text>
      {/* Indicator dots */}
      <circle cx={sx(xVal, scale, offsetX)} cy={sy(sinVal + 4, scale, offsetY)} r={5} fill="#3b82f6" />
      <circle cx={sx(xVal, scale, offsetX)} cy={sy(expVal - 1.5, scale, offsetY)} r={5} fill="#f59e0b" />
    </g>
  )
}

// --- 15. lhopital1 (洛必达法则) ---
function Lhopital1SVG({ scale, offsetX, offsetY }: { scale: number; offsetX: number; offsetY: number }) {
  const { paramValue: eps } = useLabStore()

  const fOverGPath = useMemo(() => {
    const xMax = eps * 4
    return curveToPath((x) => x > 0.001 ? Math.sin(x) / x : 1, 0.01, xMax, 200, scale, offsetX, offsetY)
  }, [eps, scale, offsetX, offsetY])

  const fPrimeOverGPrimePath = useMemo(() => {
    const xMax = eps * 4
    return curveToPath((x) => Math.cos(x), 0.01, xMax, 200, scale, offsetX, offsetY)
  }, [eps, scale, offsetX, offsetY])

  const fOverGVal = eps > 0.001 ? Math.sin(eps) / eps : 1
  const fPrimeOverGPrimeVal = Math.cos(eps)

  return (
    <g>
      <SVGAxes xRange={[-0.5, 3.5]} yRange={[-0.5, 2]} scale={scale} offsetX={offsetX} offsetY={offsetY} />
      <path d={fOverGPath} fill="none" stroke="#3b82f6" strokeWidth={2} />
      <path d={fPrimeOverGPrimePath} fill="none" stroke="#ef4444" strokeWidth={2} />
      {/* Limit line y=1 */}
      <line x1={sx(0, scale, offsetX)} y1={sy(1, scale, offsetY)} x2={sx(3, scale, offsetX)} y2={sy(1, scale, offsetY)} stroke="#22c55e" strokeWidth={1} opacity={0.5} strokeDasharray="5,5" />
      <text x={sx(3.1, scale, offsetX)} y={sy(1, scale, offsetY)} fontSize={11} fill="#22c55e">L=1</text>
      {/* Indicator dots */}
      <circle cx={sx(eps, scale, offsetX)} cy={sy(fOverGVal, scale, offsetY)} r={5} fill="#3b82f6" />
      <circle cx={sx(eps, scale, offsetX)} cy={sy(fPrimeOverGPrimeVal, scale, offsetY)} r={5} fill="#ef4444" />
    </g>
  )
}

// --- 16. monotonicity1 (函数单调性) ---
function Monotonicity1SVG({ scale, offsetX, offsetY }: { scale: number; offsetX: number; offsetY: number }) {
  const { paramValue: a } = useLabStore()
  const fFn = (x: number) => a * (x * x * x - 3 * x)
  const dfFn = (x: number) => a * (3 * x * x - 3)

  const fPath = useMemo(() => curveToPath((x) => a * (x * x * x - 3 * x), -3, 3, 300, scale, offsetX, offsetY), [a, scale, offsetX, offsetY])
  const dfPath = useMemo(() => curveToPath((x) => a * (3 * x * x - 3), -3, 3, 300, scale, offsetX, offsetY), [a, scale, offsetX, offsetY])

  return (
    <g>
      <SVGAxes xRange={[-3, 3]} yRange={[-5, 5]} scale={scale} offsetX={offsetX} offsetY={offsetY} />
      {/* Increasing regions (green) */}
      <rect x={sx(-3, scale, offsetX)} y={sy(5, scale, offsetY)} width={2 * scale} height={10 * scale} fill="#22c55e" opacity={0.08} />
      <rect x={sx(1, scale, offsetX)} y={sy(5, scale, offsetY)} width={2 * scale} height={10 * scale} fill="#22c55e" opacity={0.08} />
      {/* Decreasing region (orange) */}
      <rect x={sx(-1, scale, offsetX)} y={sy(5, scale, offsetY)} width={2 * scale} height={10 * scale} fill="#f97316" opacity={0.08} />
      {/* f(x) curve */}
      <path d={fPath} fill="none" stroke="#3b82f6" strokeWidth={2} />
      {/* f'(x) curve (dashed) */}
      <path d={dfPath} fill="none" stroke="#ef4444" strokeWidth={2} opacity={0.7} strokeDasharray="6,3" />
      {/* Critical points */}
      <circle cx={sx(-1, scale, offsetX)} cy={sy(fFn(-1), scale, offsetY)} r={5} fill="#22c55e" />
      <circle cx={sx(1, scale, offsetX)} cy={sy(fFn(1), scale, offsetY)} r={5} fill="#f97316" />
    </g>
  )
}

// --- 17. extrema1 (函数极值) ---
function Extrema1SVG({ scale, offsetX, offsetY }: { scale: number; offsetX: number; offsetY: number }) {
  const { paramValue: a } = useLabStore()
  const fFn = (x: number) => a * (x * x * x * x - 4 * x * x)
  const dfFn = (x: number) => a * (4 * x * x * x - 8 * x)
  const sqrt2 = Math.sqrt(2)

  const fPath = useMemo(() => curveToPath((x) => a * (x * x * x * x - 4 * x * x), -3, 3, 300, scale, offsetX, offsetY), [a, scale, offsetX, offsetY])
  const dfPath = useMemo(() => curveToPath((x) => a * (4 * x * x * x - 8 * x), -3, 3, 300, scale, offsetX, offsetY), [a, scale, offsetX, offsetY])

  return (
    <g>
      <SVGAxes xRange={[-3, 3]} yRange={[-5, 3]} scale={scale} offsetX={offsetX} offsetY={offsetY} />
      <path d={fPath} fill="none" stroke="#3b82f6" strokeWidth={2} />
      <path d={dfPath} fill="none" stroke="#ef4444" strokeWidth={2} opacity={0.6} strokeDasharray="6,3" />
      {/* Local max at x=0 */}
      <circle cx={sx(0, scale, offsetX)} cy={sy(fFn(0), scale, offsetY)} r={6} fill="#ef4444" />
      <text x={sx(0, scale, offsetX) + 10} y={sy(fFn(0), scale, offsetY) - 5} fontSize={11} fill="#ef4444">极大</text>
      {/* Local min at x=±√2 */}
      <circle cx={sx(-sqrt2, scale, offsetX)} cy={sy(fFn(-sqrt2), scale, offsetY)} r={6} fill="#22c55e" />
      <circle cx={sx(sqrt2, scale, offsetX)} cy={sy(fFn(sqrt2), scale, offsetY)} r={6} fill="#22c55e" />
      <text x={sx(sqrt2, scale, offsetX) + 10} y={sy(fFn(sqrt2), scale, offsetY)} fontSize={11} fill="#22c55e">极小</text>
    </g>
  )
}

// --- 18. concavity1 (凹凸性与拐点) ---
function Concavity1SVG({ scale, offsetX, offsetY }: { scale: number; offsetX: number; offsetY: number }) {
  const { paramValue: a } = useLabStore()
  const fFn = (x: number) => a * x * x * x

  const fPath = useMemo(() => curveToPath((x) => a * x * x * x, -3, 3, 300, scale, offsetX, offsetY), [a, scale, offsetX, offsetY])
  const concaveUpPath = useMemo(() => filledAreaPath((x) => a * x * x * x, 0, 3, 0, 120, scale, offsetX, offsetY), [a, scale, offsetX, offsetY])
  const concaveDownPath = useMemo(() => filledAreaPath((x) => a * x * x * x, -3, 0, 0, 120, scale, offsetX, offsetY), [a, scale, offsetX, offsetY])

  return (
    <g>
      <SVGAxes xRange={[-3, 3]} yRange={[-6, 6]} scale={scale} offsetX={offsetX} offsetY={offsetY} />
      {/* Concave up (x>0) - blue */}
      <path d={concaveUpPath} fill="#3b82f6" opacity={0.2} />
      {/* Concave down (x<0) - red */}
      <path d={concaveDownPath} fill="#ef4444" opacity={0.2} />
      {/* f(x) curve */}
      <path d={fPath} fill="none" stroke="#f59e0b" strokeWidth={2} />
      {/* Inflection point */}
      <circle cx={sx(0, scale, offsetX)} cy={sy(0, scale, offsetY)} r={6} fill="#22c55e" />
      <text x={sx(0.3, scale, offsetX)} y={sy(0.5, scale, offsetY)} fontSize={12} fill="#22c55e" fontWeight="bold">拐点</text>
    </g>
  )
}

// --- 19. curvature1 (曲率) ---
function Curvature1SVG({ scale, offsetX, offsetY }: { scale: number; offsetX: number; offsetY: number }) {
  const { paramValue: x0 } = useLabStore()
  const f = (x: number) => Math.cos(x)
  const fPrime = (x: number) => -Math.sin(x)
  const fDoublePrime = (x: number) => -Math.cos(x)

  const curvePath = useMemo(() => curveToPath(f, -4, 4, 300, scale, offsetX, offsetY), [scale, offsetX, offsetY])

  const kappa = Math.abs(fDoublePrime(x0)) / Math.pow(1 + fPrime(x0) * fPrime(x0), 1.5)
  const R = kappa > 0.001 ? 1 / kappa : 100
  const y0 = f(x0)
  const nx = -fPrime(x0)
  const ny = 1
  const nLen = Math.sqrt(nx * nx + ny * ny)
  const cx = x0 + (nx / nLen) * R * (fDoublePrime(x0) > 0 ? 1 : -1)
  const cy = y0 + (ny / nLen) * R * (fDoublePrime(x0) > 0 ? 1 : -1)

  const curvatureCirclePath = useMemo(() => {
    const parts: string[] = []
    const res = 64
    for (let i = 0; i <= res; i++) {
      const theta = (2 * Math.PI * i) / res
      const px = sx(cx + R * Math.cos(theta), scale, offsetX)
      const py = sy(cy + R * Math.sin(theta), scale, offsetY)
      parts.push(i === 0 ? `M${px.toFixed(2)},${py.toFixed(2)}` : `L${px.toFixed(2)},${py.toFixed(2)}`)
    }
    return parts.join(' ')
  }, [cx, cy, R, scale, offsetX, offsetY])

  return (
    <g>
      <SVGAxes xRange={[-4.5, 4.5]} yRange={[-2, 2.5]} scale={scale} offsetX={offsetX} offsetY={offsetY} />
      <path d={curvePath} fill="none" stroke="#3b82f6" strokeWidth={2} />
      {/* Curvature circle */}
      <path d={curvatureCirclePath} fill="none" stroke="#ef4444" strokeWidth={1} opacity={0.6} />
      {/* Point on curve */}
      <circle cx={sx(x0, scale, offsetX)} cy={sy(y0, scale, offsetY)} r={5} fill="#ef4444" />
      {/* Center of curvature */}
      <circle cx={sx(cx, scale, offsetX)} cy={sy(cy, scale, offsetY)} r={3} fill="#f59e0b" />
    </g>
  )
}

// --- 20. higher_derivative1 (高阶导数) ---
function HigherDerivative1SVG({ scale, offsetX, offsetY }: { scale: number; offsetX: number; offsetY: number }) {
  const { paramValue } = useLabStore()
  const n = Math.round(paramValue)
  const colors = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#06b6d4']
  const labels = ['f(x)=sin(x)', "f'(x)=cos(x)", "f''(x)=-sin(x)", "f'''(x)=-cos(x)", "f⁽⁴⁾(x)=sin(x)", "f⁽⁵⁾(x)=cos(x)"]

  const allCurves = useMemo(() => {
    const curves: string[] = []
    for (let d = 0; d <= 5; d++) {
      const phase = -d * Math.PI / 2
      curves.push(curveToPath((x) => Math.sin(x + phase), -5, 5, 300, scale, offsetX, offsetY))
    }
    return curves
  }, [scale, offsetX, offsetY])

  return (
    <g>
      <SVGAxes xRange={[-5.5, 5.5]} yRange={[-2, 2]} scale={scale} offsetX={offsetX} offsetY={offsetY} />
      {allCurves.map((path, idx) => idx <= n ? (
        <path key={idx} d={path} fill="none" stroke={colors[idx]} strokeWidth={idx === n ? 2.5 : 1.5} opacity={idx === n ? 1 : 0.35} />
      ) : null)}
      {/* Legend */}
      {labels.slice(0, n + 1).map((label, i) => (
        <text key={i} x={sx(4, scale, offsetX)} y={sy(1.5 - i * 0.5, scale, offsetY)} fontSize={10} fill={colors[i]} fontWeight={i === n ? 'bold' : 'normal'} opacity={i === n ? 1 : 0.7}>{label}</text>
      ))}
    </g>
  )
}

// --- 21. substitution1 (换元积分法) ---
function Substitution1SVG({ scale, offsetX, offsetY }: { scale: number; offsetX: number; offsetY: number }) {
  const { paramValue: subType } = useLabStore()
  const st = Math.round(subType)

  const origPath = useMemo(() => {
    const fn = st === 1
      ? (x: number) => 2 * x * Math.cos(x * x)
      : st === 2
        ? (x: number) => 2 * x * Math.exp(-x * x * 0.3)
        : (x: number) => Math.abs(x) < 1 ? x / Math.sqrt(Math.max(0.001, 1 - x * x)) : 0
    return curveToPath((x) => { const y = fn(x); return Math.abs(y) < 5 ? y : NaN }, -2.5, 2.5, 300, scale, offsetX, offsetY)
  }, [st, scale, offsetX, offsetY])

  const subPath = useMemo(() => {
    const fn = st === 1
      ? (u: number) => Math.cos(u)
      : st === 2
        ? (u: number) => Math.exp(-u * 0.3)
        : (u: number) => -1 / (2 * Math.sqrt(Math.max(0.001, u)))
    return curveToPath((u) => { const y = fn(u); return Math.abs(y) < 5 ? y + 4 : NaN }, 0.01, 5, 300, scale, offsetX, offsetY)
  }, [st, scale, offsetX, offsetY])

  return (
    <g>
      <SVGAxes xRange={[-3, 5.5]} yRange={[-3, 6]} scale={scale} offsetX={offsetX} offsetY={offsetY} />
      <path d={origPath} fill="none" stroke="#3b82f6" strokeWidth={2} />
      <path d={subPath} fill="none" stroke="#ef4444" strokeWidth={2} />
      <text x={sx(-2.5, scale, offsetX)} y={sy(-2, scale, offsetY)} fontSize={11} fill="#3b82f6">原函数 f(g(x))g&apos;(x)</text>
      <text x={sx(0, scale, offsetX)} y={sy(6, scale, offsetY)} fontSize={11} fill="#ef4444">换元后 f(u)</text>
    </g>
  )
}

// --- 22. integration_by_parts1 (分部积分法) ---
function IntegrationByParts1SVG({ scale, offsetX, offsetY }: { scale: number; offsetX: number; offsetY: number }) {
  const { paramValue: uType } = useLabStore()
  const ut = Math.round(uType)

  const uPath = useMemo(() => {
    const fn = ut === 1 ? (x: number) => x : ut === 2 ? (x: number) => x * x : (x: number) => x > 0.01 ? Math.log(x) : -5
    return curveToPath((x) => { const y = fn(x); return Math.abs(y) < 5 ? y : NaN }, -3, 3, 300, scale, offsetX, offsetY)
  }, [ut, scale, offsetX, offsetY])

  const vPath = useMemo(() => {
    const fn = ut === 1 || ut === 2 ? (x: number) => Math.exp(x * 0.5) : (x: number) => x
    return curveToPath((x) => { const y = fn(x); return Math.abs(y) < 5 ? y + 3 : NaN }, -3, 3, 300, scale, offsetX, offsetY)
  }, [ut, scale, offsetX, offsetY])

  return (
    <g>
      <SVGAxes xRange={[-3, 3]} yRange={[-4, 7]} scale={scale} offsetX={offsetX} offsetY={offsetY} />
      <path d={uPath} fill="none" stroke="#3b82f6" strokeWidth={2} />
      <path d={vPath} fill="none" stroke="#ef4444" strokeWidth={2} />
      <text x={sx(-2.5, scale, offsetX)} y={sy(2, scale, offsetY)} fontSize={12} fill="#3b82f6">u(x)</text>
      <text x={sx(-2.5, scale, offsetX)} y={sy(5, scale, offsetY)} fontSize={12} fill="#ef4444">v(x)</text>
    </g>
  )
}

// --- 23. improper_integral1 (反常积分) ---
function ImproperIntegral1SVG({ scale, offsetX, offsetY }: { scale: number; offsetX: number; offsetY: number }) {
  const { paramValue: p } = useLabStore()
  const convergent = p > 1

  const curvePath = useMemo(() => curveToPath(
    (x) => Math.min(1 / Math.pow(x, p), 5),
    0.5, 10, 300, scale, offsetX, offsetY
  ), [p, scale, offsetX, offsetY])

  const fillPathD = useMemo(() => filledAreaPath(
    (x) => Math.min(1 / Math.pow(x, p), 5),
    1, 10, 0, 200, scale, offsetX, offsetY
  ), [p, scale, offsetX, offsetY])

  const integralVal = useMemo(() => {
    let sum = 0
    const n = 1000
    const dx = 20 / n
    for (let i = 0; i < n; i++) {
      const x = 1 + (i + 0.5) * dx
      sum += (1 / Math.pow(x, p)) * dx
    }
    return sum
  }, [p])

  return (
    <g>
      <SVGAxes xRange={[-1, 11]} yRange={[-0.5, 4]} scale={scale} offsetX={offsetX} offsetY={offsetY} />
      {/* Filled area */}
      <path d={fillPathD} fill={convergent ? '#3b82f6' : '#ef4444'} opacity={0.25} />
      {/* Curve */}
      <path d={curvePath} fill="none" stroke={convergent ? '#3b82f6' : '#ef4444'} strokeWidth={2} />
      {/* Convergence indicator */}
      <text x={sx(6, scale, offsetX)} y={sy(3, scale, offsetY)} fontSize={13} fill={convergent ? '#3b82f6' : '#ef4444'} fontWeight="bold">
        {convergent ? '✓ 收敛' : '✗ 发散'}
      </text>
      <text x={sx(6, scale, offsetX)} y={sy(2.5, scale, offsetY)} fontSize={11} fill="currentColor" opacity={0.6}>
        ≈ {integralVal.toFixed(4)}
      </text>
    </g>
  )
}

// --- 24. polar_area1 (极坐标面积) ---
function PolarArea1SVG({ scale, offsetX, offsetY }: { scale: number; offsetX: number; offsetY: number }) {
  const { paramValue: a } = useLabStore()
  const rFn = (theta: number) => a + Math.cos(theta)

  const polarPath = useMemo(() => polarCurveToPath((theta) => a + Math.cos(theta), 0, 2 * Math.PI, 300, scale, offsetX, offsetY), [a, scale, offsetX, offsetY])
  const filledPath = useMemo(() => polarFilledPath((theta) => a + Math.cos(theta), 0, 2 * Math.PI, 200, scale, offsetX, offsetY), [a, scale, offsetX, offsetY])
  const area = Math.PI * (a * a + 0.5)

  return (
    <g>
      <SVGAxes xRange={[-4, 4]} yRange={[-4, 4]} scale={scale} offsetX={offsetX} offsetY={offsetY} />
      {/* Filled area */}
      <path d={filledPath} fill="#8b5cf6" opacity={0.25} />
      {/* Polar curve */}
      <path d={polarPath} fill="none" stroke="#8b5cf6" strokeWidth={2} />
      {/* Area label */}
      <text x={sx(0, scale, offsetX)} y={sy(-3, scale, offsetY)} fontSize={12} fill="#8b5cf6" textAnchor="middle">
        S = {area.toFixed(4)}
      </text>
    </g>
  )
}

// ═══════════════════════════════════════════════════════
// Scene2D – Switch on mode to render appropriate SVG scene
// ═══════════════════════════════════════════════════════

interface Scene2DProps {
  mode: LabMode
  scale: number
  offsetX: number
  offsetY: number
}

function Scene2D({ mode, scale, offsetX, offsetY }: Scene2DProps) {
  const props = { scale, offsetX, offsetY }

  switch (mode) {
    case 'limit1': return <Limit1SVG {...props} />
    case 'limit2': return <Limit2SVG {...props} />
    case 'derivative1': return <Derivative1SVG {...props} />
    case 'derivative2': return <Derivative2SVG {...props} />
    case 'derivative3': return <Derivative3SVG {...props} />
    case 'rolle1': return <Rolle1SVG {...props} />
    case 'lagrange1': return <Lagrange1SVG {...props} />
    case 'indef_integral1': return <IndefIntegral1SVG {...props} />
    case 'ftc1': return <Ftc1SVG {...props} />
    case 'mean_value_integral1': return <MeanValueIntegral1SVG {...props} />
    case 'area1': return <Area1SVG {...props} />
    case 'continuity1': return <Continuity1SVG {...props} />
    case 'discontinuity1': return <Discontinuity1SVG {...props} />
    case 'important_limits1': return <ImportantLimits1SVG {...props} />
    case 'lhopital1': return <Lhopital1SVG {...props} />
    case 'monotonicity1': return <Monotonicity1SVG {...props} />
    case 'extrema1': return <Extrema1SVG {...props} />
    case 'concavity1': return <Concavity1SVG {...props} />
    case 'curvature1': return <Curvature1SVG {...props} />
    case 'higher_derivative1': return <HigherDerivative1SVG {...props} />
    case 'substitution1': return <Substitution1SVG {...props} />
    case 'integration_by_parts1': return <IntegrationByParts1SVG {...props} />
    case 'improper_integral1': return <ImproperIntegral1SVG {...props} />
    case 'polar_area1': return <PolarArea1SVG {...props} />
    default:
      return <SVGAxes xRange={[-6, 6]} yRange={[-4, 4]} scale={scale} offsetX={offsetX} offsetY={offsetY} />
  }
}

// ═══════════════════════════════════════════════════════
// Overlay Content per Mode
// ═══════════════════════════════════════════════════════

function getOverlayContent(mode: LabMode): ReactNode {
  const { paramValue, paramValue2 } = useLabStore.getState()

  switch (mode) {
    case 'limit1': {
      const c = paramValue, L = paramValue2, eps = 0.3
      const aN = (n: number) => L + 1 / Math.pow(n, c)
      const lastErr = Math.abs(aN(20) - L)
      // Find N_ε
      let nEps = 1000
      for (let n = 1; n <= 1000; n++) {
        if (Math.abs(aN(n) - L) < eps) { nEps = n; break }
      }
      return (
        <div className="text-xs space-y-0.5 font-mono whitespace-nowrap">
          <div className="text-teal-600 dark:text-teal-400 font-semibold">数列极限</div>
          <div>aₙ = {L.toFixed(1)} + 1/n^{c.toFixed(1)}</div>
          <div className="text-amber-600 dark:text-amber-400">L = {L.toFixed(2)}</div>
          <div>ε = {eps.toFixed(2)}</div>
          <div className="text-purple-600 dark:text-purple-400">N_ε = {nEps}</div>
          <div className="text-orange-600 dark:text-orange-400">|a₂₀ - L| = {lastErr.toFixed(4)}</div>
          <div className="text-rose-600 dark:text-rose-400 text-[10px]">收敛阶: O(1/n^{c.toFixed(1)})</div>
        </div>
      )
    }
    case 'limit2': {
      const eps = paramValue
      const x0 = Math.PI / 2, L = 2
      const fAt = (x: number) => Math.sin(x) + 1
      let delta = 0.01
      for (let i = 1000; i >= 1; i--) {
        const d = i * 0.002
        if (Math.abs(fAt(x0 - d) - L) <= eps && Math.abs(fAt(x0 + d) - L) <= eps) { delta = d; break }
      }
      return (
        <div className="text-xs space-y-0.5 font-mono whitespace-nowrap">
          <div className="text-teal-600 dark:text-teal-400 font-semibold">函数极限 ε-δ</div>
          <div>f(x) = sin(x)+1, x₀ = π/2</div>
          <div className="text-emerald-600 dark:text-emerald-400">ε = {eps.toFixed(2)}</div>
          <div className="text-orange-500 dark:text-orange-400">δ ≈ {delta.toFixed(4)}</div>
          <div className="text-amber-600 dark:text-amber-400">L = f(x₀) = {L.toFixed(2)}</div>
        </div>
      )
    }
    case 'derivative1': {
      const deltaX = paramValue
      const x0 = 1
      const fAt = (x: number) => Math.sin(x) + 0.5 * x
      const tangentSlope = Math.cos(x0) + 0.5
      const secantSlope = (fAt(x0 + deltaX) - fAt(x0)) / deltaX
      return (
        <div className="text-xs space-y-0.5 font-mono whitespace-nowrap">
          <div className="text-teal-600 dark:text-teal-400 font-semibold">导数定义 (割线→切线)</div>
          <div>f(x) = sin(x)+0.5x, x₀ = 1</div>
          <div className="text-red-500 dark:text-red-400">切线斜率 f&apos;(1) = {tangentSlope.toFixed(4)}</div>
          <div className="text-blue-500 dark:text-blue-400">割线斜率 = {secantSlope.toFixed(4)}</div>
          <div>Δx = {deltaX.toFixed(2)}</div>
          <div className="text-amber-600 dark:text-amber-400">|差值| = {Math.abs(tangentSlope - secantSlope).toFixed(4)}</div>
        </div>
      )
    }
    case 'derivative2': {
      const x0 = paramValue
      const fAt = (x: number) => x * x * x - 3 * x
      const dfAt = (x: number) => 3 * x * x - 3
      return (
        <div className="text-xs space-y-0.5 font-mono whitespace-nowrap">
          <div className="text-teal-600 dark:text-teal-400 font-semibold">切线与导函数</div>
          <div>f(x) = x³-3x, f&apos;(x) = 3x²-3</div>
          <div className="text-blue-500 dark:text-blue-400">x₀ = {x0.toFixed(1)}</div>
          <div className="text-blue-500 dark:text-blue-400">f(x₀) = {fAt(x0).toFixed(3)}</div>
          <div className="text-red-500 dark:text-red-400">f&apos;(x₀) = {dfAt(x0).toFixed(3)}</div>
        </div>
      )
    }
    case 'derivative3': {
      const x0 = paramValue, deltaX = paramValue2
      const fAt = (x: number) => x * x
      const dfAt = (x: number) => 2 * x
      const dy = dfAt(x0) * deltaX
      const deltaY = fAt(x0 + deltaX) - fAt(x0)
      return (
        <div className="text-xs space-y-0.5 font-mono whitespace-nowrap">
          <div className="text-teal-600 dark:text-teal-400 font-semibold">微分与线性近似</div>
          <div>f(x) = x²</div>
          <div>x₀ = {x0.toFixed(1)}, Δx = {deltaX.toFixed(2)}</div>
          <div className="text-blue-500 dark:text-blue-400">Δy = {deltaY.toFixed(4)}</div>
          <div className="text-red-500 dark:text-red-400">dy = {dy.toFixed(4)}</div>
          <div className="text-amber-600 dark:text-amber-400">误差 = {Math.abs(deltaY - dy).toFixed(4)}</div>
        </div>
      )
    }
    case 'rolle1': {
      const a = paramValue
      const { xi1, xi2, fXi1, fXi2 } = findRollePoint(a)
      return (
        <div className="text-xs space-y-0.5 font-mono whitespace-nowrap">
          <div className="text-teal-600 dark:text-teal-400 font-semibold">罗尔定理</div>
          <div>f(x) = {a.toFixed(1)}·(x-1)(x-3)(x-5)</div>
          <div className="text-amber-600 dark:text-amber-400">f(1) = f(5) = 0</div>
          <div className="text-red-500 dark:text-red-400">ξ₁ ≈ {xi1.toFixed(3)}, f(ξ₁) ≈ {fXi1.toFixed(3)}</div>
          <div className="text-red-500 dark:text-red-400">ξ₂ ≈ {xi2.toFixed(3)}, f(ξ₂) ≈ {fXi2.toFixed(3)}</div>
        </div>
      )
    }
    case 'lagrange1': {
      const a = paramValue
      const { xi, secantSlope, tangentSlope } = findLagrangePoint(a)
      return (
        <div className="text-xs space-y-0.5 font-mono whitespace-nowrap">
          <div className="text-teal-600 dark:text-teal-400 font-semibold">拉格朗日中值定理</div>
          <div>f(x) = {a.toFixed(1)}·(x³-6x²+11x)</div>
          <div className="text-blue-500 dark:text-blue-400">割线斜率 = {secantSlope.toFixed(4)}</div>
          <div className="text-red-500 dark:text-red-400">f&apos;(ξ) = {tangentSlope.toFixed(4)}</div>
          <div>ξ ≈ {xi.toFixed(4)}</div>
        </div>
      )
    }
    case 'indef_integral1': {
      const count = Math.round(paramValue)
      return (
        <div className="text-xs space-y-0.5 font-mono whitespace-nowrap">
          <div className="text-teal-600 dark:text-teal-400 font-semibold">原函数族</div>
          <div>∫2x dx = x² + C</div>
          <div>曲线数量: {count}</div>
          <div>C ∈ [-4.0, 4.0]</div>
        </div>
      )
    }
    case 'ftc1': {
      const upperLimit = paramValue
      const fAt = (x: number) => Math.sin(x) + 1
      const areaValue = numericalIntegral1D(fAt, -2, upperLimit)
      const phiAtX = -Math.cos(upperLimit) + upperLimit - (-Math.cos(-2) + (-2))
      return (
        <div className="text-xs space-y-0.5 font-mono whitespace-nowrap">
          <div className="text-teal-600 dark:text-teal-400 font-semibold">微积分基本定理</div>
          <div>f(x) = sin(x)+1</div>
          <div>Φ(x) = ∫₋₂ˣ f(t)dt</div>
          <div className="text-emerald-600 dark:text-emerald-400">面积 = {areaValue.toFixed(4)}</div>
          <div className="text-amber-600 dark:text-amber-400">Φ({upperLimit.toFixed(1)}) = {phiAtX.toFixed(4)}</div>
          <div>Φ&apos;(x) = f(x) ✓</div>
        </div>
      )
    }
    case 'mean_value_integral1': {
      const a = paramValue
      const fAt = (x: number) => a * Math.sin(x) + 1
      const { xi, avgValue, integral } = findMeanValueIntegralPoint(fAt, 0, 2 * Math.PI)
      return (
        <div className="text-xs space-y-0.5 font-mono whitespace-nowrap">
          <div className="text-teal-600 dark:text-teal-400 font-semibold">积分中值定理</div>
          <div>f(x) = {a.toFixed(1)}·sin(x)+1</div>
          <div className="text-emerald-600 dark:text-emerald-400">∫f dx = {integral.toFixed(4)}</div>
          <div className="text-amber-600 dark:text-amber-400">平均值 = {avgValue.toFixed(4)}</div>
          <div className="text-red-500 dark:text-red-400">ξ ≈ {xi.toFixed(4)}</div>
          <div>f(ξ) = {(a * Math.sin(xi) + 1).toFixed(4)}</div>
        </div>
      )
    }
    case 'area1': {
      const a = paramValue
      const area = areaBetweenCurves((x) => a + Math.cos(x), (x) => Math.sin(x), -Math.PI, Math.PI)
      return (
        <div className="text-xs space-y-0.5 font-mono whitespace-nowrap">
          <div className="text-teal-600 dark:text-teal-400 font-semibold">曲线间面积</div>
          <div>S = ∫|f(x)-g(x)|dx</div>
          <div className="text-emerald-600 dark:text-emerald-400">面积 = {area.toFixed(4)}</div>
          <div>间距 a = {a.toFixed(1)}</div>
        </div>
      )
    }
    case 'continuity1': {
      const isContinuous = paramValue >= 1
      return (
        <div className="text-xs space-y-0.5 font-mono whitespace-nowrap">
          <div className="text-green-600 dark:text-green-400 font-semibold">连续函数 f(x) = x²</div>
          {!isContinuous && <div className="text-red-600 dark:text-red-400 font-semibold">不连续函数 g(x)：x=0处跳跃间断</div>}
          <div className="text-muted-foreground mt-1">连续性: {isContinuous ? '✓ 连续' : '✗ 不连续'}</div>
        </div>
      )
    }
    case 'discontinuity1': {
      const dtype = Math.round(paramValue)
      const titles: Record<number, { name: string; desc: string; color: string }> = {
        1: { name: '可去间断点', desc: 'f(x)=(x²-1)/(x-1)，x=1处有洞', color: '#3b82f6' },
        2: { name: '跳跃间断点', desc: 'f(x)在x=2处左右极限不相等', color: '#f59e0b' },
        3: { name: '无穷间断点', desc: 'f(x)=1/(x-3)，x=3处趋向无穷', color: '#ef4444' },
        4: { name: '振荡间断点', desc: 'f(x)=sin(1/x)，x=0处无限振荡', color: '#8b5cf6' },
      }
      const info = titles[dtype] || titles[1]
      return (
        <div className="text-xs space-y-0.5 font-mono whitespace-nowrap">
          <div className="font-semibold" style={{ color: info.color }}>{info.name}</div>
          <div className="text-muted-foreground">{info.desc}</div>
          <div className="text-muted-foreground mt-1">类型 {dtype}/4：1=可去 2=跳跃 3=无穷 4=振荡</div>
        </div>
      )
    }
    case 'important_limits1': {
      const xVal = paramValue
      const sinVal = xVal > 0.001 ? Math.sin(xVal) / xVal : 1
      const expVal = xVal > 0.1 ? Math.pow(1 + 1 / xVal, xVal) : Math.E
      return (
        <div className="text-xs space-y-0.5 font-mono whitespace-nowrap">
          <div className="text-blue-600 dark:text-blue-400 font-semibold">sin(x)/x → 1：x={xVal.toFixed(2)} 时 = {sinVal.toFixed(4)}</div>
          <div className="text-amber-600 dark:text-amber-400 font-semibold">(1+1/x)^x → e：x={xVal.toFixed(2)} 时 = {expVal.toFixed(4)}</div>
          <div className="text-muted-foreground">e ≈ {Math.E.toFixed(6)}</div>
        </div>
      )
    }
    case 'lhopital1': {
      const eps = paramValue
      const fOverGVal = eps > 0.001 ? Math.sin(eps) / eps : 1
      const fPrimeOverGPrimeVal = Math.cos(eps)
      return (
        <div className="text-xs space-y-0.5 font-mono whitespace-nowrap">
          <div className="text-blue-600 dark:text-blue-400 font-semibold">sin(x)/x = {fOverGVal.toFixed(4)}</div>
          <div className="text-red-600 dark:text-red-400 font-semibold">cos(x)/1 = {fPrimeOverGPrimeVal.toFixed(4)}</div>
          <div className="text-green-600 dark:text-green-400 mt-1">极限值 L = 1</div>
        </div>
      )
    }
    case 'monotonicity1': {
      const a = paramValue
      return (
        <div className="text-xs space-y-0.5 font-mono whitespace-nowrap">
          <div className="text-blue-600 dark:text-blue-400 font-semibold">f(x) = {a.toFixed(1)}(x³-3x)</div>
          <div className="text-red-600 dark:text-red-400">f&apos;(x) = {a.toFixed(1)}(3x²-3)</div>
          <div className="text-green-600">绿色: f&apos;&gt;0 递增</div>
          <div className="text-orange-600">橙色: f&apos;&lt;0 递减</div>
        </div>
      )
    }
    case 'extrema1': {
      const a = paramValue
      return (
        <div className="text-xs space-y-0.5 font-mono whitespace-nowrap">
          <div className="text-blue-600 dark:text-blue-400 font-semibold">f(x) = {a.toFixed(1)}(x⁴-4x²)</div>
          <div className="text-red-600 dark:text-red-400">f&apos;(x) = {a.toFixed(1)}(4x³-8x)</div>
          <div className="text-red-600">红色: 极大值点(x=0)</div>
          <div className="text-green-600">绿色: 极小值点(x=±√2)</div>
        </div>
      )
    }
    case 'concavity1': {
      const a = paramValue
      return (
        <div className="text-xs space-y-0.5 font-mono whitespace-nowrap">
          <div className="text-amber-600 dark:text-amber-400 font-semibold">f(x) = {a.toFixed(1)}x³</div>
          <div className="text-blue-600">蓝色: 凹区间(x&gt;0, f&apos;&apos;&gt;0)</div>
          <div className="text-red-600">红色: 凸区间(x&lt;0, f&apos;&apos;&lt;0)</div>
          <div className="text-green-600">拐点: x=0, f&apos;&apos;(0)=0</div>
        </div>
      )
    }
    case 'curvature1': {
      const x0 = paramValue
      const fPrime = (x: number) => -Math.sin(x)
      const fDoublePrime = (x: number) => -Math.cos(x)
      const kappa = Math.abs(fDoublePrime(x0)) / Math.pow(1 + fPrime(x0) * fPrime(x0), 1.5)
      const R = kappa > 0.001 ? 1 / kappa : 100
      return (
        <div className="text-xs space-y-0.5 font-mono whitespace-nowrap">
          <div className="text-blue-600 dark:text-blue-400 font-semibold">f(x) = cos(x)</div>
          <div className="text-red-600">曲率 κ = {kappa.toFixed(4)}</div>
          <div className="text-amber-600">曲率半径 R = {R.toFixed(4)}</div>
          <div className="text-muted-foreground">观察点 x₀ = {x0.toFixed(2)}</div>
        </div>
      )
    }
    case 'higher_derivative1': {
      const n = Math.round(paramValue)
      const colors = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#06b6d4']
      const labels = ['f(x)=sin(x)', "f'(x)=cos(x)", "f''(x)=-sin(x)", "f'''(x)=-cos(x)", "f⁽⁴⁾(x)=sin(x)", "f⁽⁵⁾(x)=cos(x)"]
      return (
        <div className="text-xs space-y-0.5 font-mono whitespace-nowrap">
          {Array.from({ length: n + 1 }, (_, i) => (
            <div key={i} style={{ color: colors[i] }} className={i === n ? 'font-semibold' : 'opacity-70'}>{labels[i]}</div>
          ))}
          <div className="text-muted-foreground mt-1">当前阶数: n = {n}</div>
        </div>
      )
    }
    case 'substitution1': {
      const st = Math.round(paramValue)
      const subLabels = ['u=x², ∫cos(u)du', 'u=x², ∫e^u du', 'u=1-x², -∫1/(2√u)du']
      return (
        <div className="text-xs space-y-0.5 font-mono whitespace-nowrap">
          <div className="text-blue-600 dark:text-blue-400 font-semibold">原积分变量 x</div>
          <div className="text-red-600 dark:text-red-400 font-semibold">换元: {subLabels[st - 1]}</div>
          <div className="text-muted-foreground">类型 {st}/3</div>
        </div>
      )
    }
    case 'integration_by_parts1': {
      const ut = Math.round(paramValue)
      const uvLabel = ut === 1 ? 'u=x, dv=e^x dx' : ut === 2 ? 'u=x², dv=e^x dx' : 'u=ln(x), dv=x dx'
      return (
        <div className="text-xs space-y-0.5 font-mono whitespace-nowrap">
          <div className="font-semibold text-emerald-600">∫u dv = uv - ∫v du</div>
          <div className="text-blue-600 dark:text-blue-400">u(x) (蓝色)</div>
          <div className="text-red-600 dark:text-red-400">v(x) (红色)</div>
          <div className="text-muted-foreground">{uvLabel}</div>
        </div>
      )
    }
    case 'improper_integral1': {
      const p = paramValue
      const convergent = p > 1
      let integralVal = 0
      const n = 1000
      const dx = 20 / n
      for (let i = 0; i < n; i++) {
        const x = 1 + (i + 0.5) * dx
        integralVal += (1 / Math.pow(x, p)) * dx
      }
      return (
        <div className="text-xs space-y-0.5 font-mono whitespace-nowrap">
          <div className="font-semibold" style={{ color: convergent ? '#3b82f6' : '#ef4444' }}>
            ∫₁^∞ 1/x^{p.toFixed(1)} dx
          </div>
          <div style={{ color: convergent ? '#3b82f6' : '#ef4444' }}>
            {convergent ? '✓ 收敛' : '✗ 发散'}
          </div>
          <div className="text-muted-foreground">近似值 ≈ {integralVal.toFixed(4)}</div>
          <div className="text-muted-foreground">p = {p.toFixed(1)} {convergent ? '(p&gt;1)' : '(p≤1)'}</div>
        </div>
      )
    }
    case 'polar_area1': {
      const a = paramValue
      const area = Math.PI * (a * a + 0.5)
      return (
        <div className="text-xs space-y-0.5 font-mono whitespace-nowrap">
          <div className="text-violet-600 dark:text-violet-400 font-semibold">r = {a.toFixed(1)} + cos(θ)</div>
          <div className="text-violet-600">S = ½∫r²(θ)dθ</div>
          <div className="text-emerald-600 dark:text-emerald-400">S = π({a.toFixed(1)}² + ½) = {area.toFixed(4)}</div>
        </div>
      )
    }
    default: {
      const info = modeInfo[mode]
      return (
        <div className="text-xs space-y-1 max-w-[200px]">
          <div className="font-semibold text-foreground/80">{info.title}</div>
          <div className="text-[10px] text-muted-foreground leading-relaxed">
            {info.description.slice(0, 80)}...
          </div>
        </div>
      )
    }
  }
}

// ─────────────────────────────────────────────────────
// DraggableOverlay2D – pure HTML/CSS draggable container
// ─────────────────────────────────────────────────────
interface DraggableOverlay2DProps {
  children: ReactNode
  defaultX?: number
  defaultY?: number
  mode?: string
}

function DraggableOverlay2D({ children, defaultX = 20, defaultY = 20 }: DraggableOverlay2DProps) {
  const [position, setPosition] = useState({ x: defaultX, y: defaultY })
  const [dragging, setDragging] = useState(false)
  const dragOffset = useRef({ x: 0, y: 0 })

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(true)
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    }
  }, [position.x, position.y])

  useEffect(() => {
    if (!dragging) return
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      })
    }
    const handleMouseUp = () => { setDragging(false) }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragging])

  return (
    <div
      style={{ position: 'absolute', left: position.x, top: position.y, zIndex: 20, userSelect: dragging ? 'none' : 'auto' }}
      className={cn(
        'rounded-lg shadow-lg border backdrop-blur-md',
        'bg-background/80 dark:bg-background/70',
        'border-border/50',
        'transition-shadow duration-200',
        dragging && 'shadow-xl ring-1 ring-emerald-500/30'
      )}
    >
      <div
        onMouseDown={handleMouseDown}
        className={cn(
          'flex items-center justify-center py-1 px-3 cursor-grab',
          'border-b border-border/30',
          dragging && 'cursor-grabbing'
        )}
      >
        <div className="w-10 h-1 rounded-full bg-emerald-500/60" />
      </div>
      <div className="p-3">{children}</div>
    </div>
  )
}

// ─────────────────────────────────────────────────────
// Viewport2D – main exported component
// ─────────────────────────────────────────────────────
export function Viewport2D() {
  const { mode } = useLabStore()
  const info = modeInfo[mode]
  const bgClass = getBackgroundForMode(mode)
  const accentColor = getModeAccentColor(mode)
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const { toast } = useToast()

  const [offsetX, setOffsetX] = useState(0)
  const [offsetY, setOffsetY] = useState(0)
  const [scale, setScale] = useState(50)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isPanning, setIsPanning] = useState(false)
  const panStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 })

  const [initialized, setInitialized] = useState(false)
  useEffect(() => {
    if (!initialized && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setOffsetX(rect.width / 2)
      setOffsetY(rect.height / 2)
      setInitialized(true)
    }
  }, [initialized])

  const handleDoubleClick = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setOffsetX(rect.width / 2)
      setOffsetY(rect.height / 2)
    }
    setScale(50)
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    e.preventDefault()
    setIsPanning(true)
    panStart.current = { x: e.clientX, y: e.clientY, ox: offsetX, oy: offsetY }
  }, [offsetX, offsetY])

  useEffect(() => {
    if (!isPanning) return
    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - panStart.current.x
      const dy = e.clientY - panStart.current.y
      setOffsetX(panStart.current.ox + dx)
      setOffsetY(panStart.current.oy + dy)
    }
    const handleMouseUp = () => { setIsPanning(false) }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isPanning])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const mathX = (mouseX - offsetX) / scale
    const mathY = -(mouseY - offsetY) / scale
    const zoomFactor = e.deltaY > 0 ? 0.92 : 1.08
    const newScale = Math.max(10, Math.min(500, scale * zoomFactor))
    setScale(newScale)
    setOffsetX(mouseX - mathX * newScale)
    setOffsetY(mouseY + mathY * newScale)
  }, [offsetX, offsetY, scale])

  useEffect(() => {
    const handleFullscreenChange = () => { setIsFullscreen(!!document.fullscreenElement) }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const handleFullscreen = useCallback(() => {
    if (!containerRef.current) return
    if (document.fullscreenElement) { document.exitFullscreen() }
    else { containerRef.current.requestFullscreen() }
  }, [])

  const handleResetView = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setOffsetX(rect.width / 2)
      setOffsetY(rect.height / 2)
    }
    setScale(50)
  }, [])

  const handleScreenshot = useCallback(() => {
    const svgEl = svgRef.current
    if (!svgEl) return
    try {
      const svgData = new XMLSerializer().serializeToString(svgEl)
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(svgBlob)
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const rect = containerRef.current?.getBoundingClientRect()
        if (!rect) return
        canvas.width = rect.width * 2
        canvas.height = rect.height * 2
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.scale(2, 2)
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--background').trim() || '#ffffff'
        ctx.fillRect(0, 0, rect.width, rect.height)
        ctx.drawImage(img, 0, 0, rect.width, rect.height)
        canvas.toBlob((blob) => {
          if (!blob) return
          const dataUrl = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.download = `calculus-2d-${mode}-${Date.now()}.png`
          link.href = dataUrl
          link.click()
          URL.revokeObjectURL(dataUrl)
          toast('截图已保存！', 'success')
        }, 'image/png')
        URL.revokeObjectURL(url)
      }
      img.src = url
    } catch (e) {
      console.warn('Screenshot failed:', e)
    }
  }, [mode, toast])

  const touchStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 })
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return
    const touch = e.touches[0]
    touchStart.current = { x: touch.clientX, y: touch.clientY, ox: offsetX, oy: offsetY }
  }, [offsetX, offsetY])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return
    const touch = e.touches[0]
    const dx = touch.clientX - touchStart.current.x
    const dy = touch.clientY - touchStart.current.y
    setOffsetX(touchStart.current.ox + dx)
    setOffsetY(touchStart.current.oy + dy)
  }, [])

  const ariaLabel = `2D可视化: ${info.title} - 交互式数学可视化，可拖拽平移和滚轮缩放`
  const ariaDescription = `${info.section}类别的${info.title}模式。${info.description} 使用鼠标拖拽可平移视图，滚轮可缩放。`

  const overlayContent = useMemo(() => getOverlayContent(mode), [mode])

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={ariaLabel}
      className={cn(
        'w-full h-full bg-gradient-to-br rounded-lg overflow-hidden relative shadow-inner transition-all duration-500',
        bgClass,
        isFullscreen ? 'rounded-none' : ''
      )}
    >
      <div key={`transition-${mode}`} className="absolute inset-0 z-[5] pointer-events-none animate-[mode-switch_0.4s_ease-out_forwards]" />
      <div className="absolute top-0 left-0 w-24 h-24 pointer-events-none z-[4]">
        <div className={cn('w-full h-full rounded-tl-lg opacity-20', `bg-gradient-to-br ${bgClass}`)} />
      </div>
      <div className="absolute bottom-0 right-0 w-24 h-24 pointer-events-none z-[4]">
        <div className={cn('w-full h-full rounded-br-lg opacity-10', `bg-gradient-to-tl ${bgClass}`)} />
      </div>

      <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 pointer-events-none">
        <div className={cn('w-2 h-2 rounded-full', accentColor, 'animate-pulse')} />
        <span className="text-[10px] font-medium text-foreground/60 bg-background/60 backdrop-blur-sm px-1.5 py-0.5 rounded transition-all duration-300">
          {info.title}
        </span>
        <span className="text-[9px] font-medium text-emerald-600/70 dark:text-emerald-400/70 bg-emerald-50/60 dark:bg-emerald-900/30 backdrop-blur-sm px-1.5 py-0.5 rounded">
          2D
        </span>
      </div>

      <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 bg-background/40 backdrop-blur-sm hover:bg-background/70" onClick={handleResetView}>
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="sr-only">重置视图</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">重置视图 (双击)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 bg-background/40 backdrop-blur-sm hover:bg-background/70" onClick={handleFullscreen}>
              {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              <span className="sr-only">{isFullscreen ? '退出全屏' : '全屏'}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">{isFullscreen ? '退出全屏' : '全屏'}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 bg-background/40 backdrop-blur-sm hover:bg-background/70" onClick={handleScreenshot}>
              <Camera className="h-3.5 w-3.5" />
              <span className="sr-only">截图保存</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">截图保存 (S)</TooltipContent>
        </Tooltip>
      </div>

      <svg
        ref={svgRef}
        className={cn('w-full h-full', isPanning ? 'cursor-grabbing' : 'cursor-grab')}
        preserveAspectRatio="xMidYMid meet"
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        style={{ touchAction: 'none' }}
      >
        <g>
          <Scene2D mode={mode} scale={scale} offsetX={offsetX} offsetY={offsetY} />
        </g>
      </svg>

      <div className="absolute bottom-2 right-2 z-10 pointer-events-none">
        <div className="flex items-center gap-1 text-[9px] text-muted-foreground/50 bg-background/40 backdrop-blur-sm px-1.5 py-0.5 rounded">
          <Move3d className="h-2.5 w-2.5" />
          拖拽平移 · 滚轮缩放
        </div>
      </div>

      <div className="absolute bottom-2 left-2 z-10 pointer-events-none">
        <div className="text-[9px] text-muted-foreground/40 bg-background/40 backdrop-blur-sm px-1.5 py-0.5 rounded font-mono">
          {Math.round(scale)}px/u
        </div>
      </div>

      <DraggableOverlay2D key={mode} defaultX={20} defaultY={60} mode={mode}>
        {overlayContent}
      </DraggableOverlay2D>

      <div id={`viewport-2d-desc-${mode}`} className="sr-only" aria-live="polite">
        {ariaDescription}
      </div>
    </div>
  )
}

export { DraggableOverlay2D, SVGAxes, Scene2D }
