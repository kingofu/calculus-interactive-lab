'use client'

import { useMemo } from 'react'
import { useLabStore, type LabMode } from '@/store/lab-store'
import {
  f,
  g,
  fOdd,
  fEven,
  fCartesian,
  fRect,
  fPolar,
  fTriple,
  riemannSum2D,
  numericalIntegral2D,
  rectApprox,
  numericalIntegral1D,
  sphereCylinderVolume,
  integralTriangularX,
  integralTriangularY,
  polarRiemannSum,
  polarNumericalIntegral,
  tripleIntegralApprox,
  tripleIntegralExact,
  formatValue,
} from '@/lib/math-computations'

export interface ComputedValues {
  mainValue: string
  approxValue: string
  exactValue: string
  error: string
  label: string
}

export function useComputedValues(): ComputedValues | null {
  const { mode, paramValue, paramValue2 } = useLabStore()

  return useMemo(() => {
    const n = Math.round(paramValue)

    switch (mode as LabMode) {
      case 'step3': {
        // Riemann sum vs exact integral for f(x,y) over [-3,3]×[-3,3]
        const approx = riemannSum2D(f, 3, 3, n)
        const exact = numericalIntegral2D(f, -3, 3, -3, 3)
        return {
          mainValue: formatValue(approx),
          approxValue: formatValue(approx),
          exactValue: formatValue(exact),
          error: formatValue(Math.abs(approx - exact)),
          label: '黎曼和 vs 精确值',
        }
      }

      case 'rect_approx': {
        // Rectangular approximation vs exact 1D integral
        const approx = rectApprox(fRect, -2, 2, n)
        const exact = numericalIntegral1D(fRect, -2, 2)
        return {
          mainValue: formatValue(approx),
          approxValue: formatValue(approx),
          exactValue: formatValue(exact),
          error: formatValue(Math.abs(approx - exact)),
          label: '矩形近似 vs 精确值',
        }
      }

      case 'parity1': {
        // Odd function integral (should be ≈0)
        const a = paramValue
        const approx = numericalIntegral2D(fOdd, -a, a, -a, a)
        return {
          mainValue: formatValue(approx),
          approxValue: formatValue(approx),
          exactValue: '0',
          error: formatValue(Math.abs(approx)),
          label: '奇函数积分值 (应≈0)',
        }
      }

      case 'parity2': {
        // Even function integral
        const a = paramValue
        const fullIntegral = numericalIntegral2D(fEven, -a, a, -a, a)
        const halfIntegral = numericalIntegral2D(fEven, 0, a, -a, a)
        return {
          mainValue: formatValue(fullIntegral),
          approxValue: formatValue(halfIntegral),
          exactValue: formatValue(2 * halfIntegral),
          error: formatValue(Math.abs(fullIntegral - 2 * halfIntegral)),
          label: '偶函数积分 = 2 × 半区域积分',
        }
      }

      case 'sphere_cyl1': {
        // Sphere-cylinder intersection volume
        const R = paramValue2
        const a = paramValue
        const volume = sphereCylinderVolume(R, a)
        return {
          mainValue: formatValue(volume),
          approxValue: formatValue(volume),
          exactValue: `2π×${a.toFixed(1)}²×√(${R.toFixed(1)}²-${a.toFixed(1)}²)`,
          error: '0',
          label: '相交体体积 V = 2πa²√(R²-a²)',
        }
      }

      case 'cartesian1': {
        // X-type integral over triangular region
        const approx = integralTriangularX(fCartesian)
        return {
          mainValue: formatValue(approx),
          approxValue: formatValue(approx),
          exactValue: formatValue(approx),
          error: '—',
          label: 'X型区域积分值',
        }
      }

      case 'cartesian2': {
        // Y-type integral over triangular region
        const approx = integralTriangularY(fCartesian)
        return {
          mainValue: formatValue(approx),
          approxValue: formatValue(approx),
          exactValue: formatValue(approx),
          error: '—',
          label: 'Y型区域积分值',
        }
      }

      case 'prop1': {
        // Constant multiple property
        const k = paramValue
        const intF = numericalIntegral2D(f, -3, 3, -3, 3)
        const intKF = numericalIntegral2D((x, y) => k * f(x, y), -3, 3, -3, 3)
        return {
          mainValue: formatValue(intKF),
          approxValue: formatValue(k * intF),
          exactValue: `${k.toFixed(1)} × ${formatValue(intF)}`,
          error: formatValue(Math.abs(intKF - k * intF)),
          label: 'k·∫f = ∫(kf)',
        }
      }

      case 'prop2': {
        // Additivity property
        const t = paramValue
        const intF = numericalIntegral2D(f, -3, 3, -3, 3)
        const intG = numericalIntegral2D(g, -3, 3, -3, 3)
        const intComb = numericalIntegral2D(
          (x, y) => (1 - t) * f(x, y) + t * g(x, y),
          -3, 3, -3, 3
        )
        const expected = (1 - t) * intF + t * intG
        return {
          mainValue: formatValue(intComb),
          approxValue: formatValue(expected),
          exactValue: `${(1 - t).toFixed(2)}·∫f + ${t.toFixed(2)}·∫g`,
          error: formatValue(Math.abs(intComb - expected)),
          label: '线性组合性质',
        }
      }

      case 'prop4': {
        // Constant function integral = c * area
        const c = paramValue
        const area = 4 * 4 // [-2,2]×[-2,2]
        return {
          mainValue: formatValue(c * area),
          approxValue: formatValue(c * area),
          exactValue: `${c.toFixed(1)} × ${area}`,
          error: '0',
          label: 'c × S_D',
        }
      }

      case 'polar1': {
        // Polar integral
        const R = paramValue
        const beta = paramValue2
        const approx = polarRiemannSum(fPolar, R, 0, beta, 20, 20)
        const exact = polarNumericalIntegral(fPolar, R, 0, beta)
        return {
          mainValue: formatValue(approx),
          approxValue: formatValue(approx),
          exactValue: formatValue(exact),
          error: formatValue(Math.abs(approx - exact)),
          label: '极坐标积分值',
        }
      }

      case 'polar2': {
        // Polar Riemann sum
        const nR = Math.round(paramValue)
        const R = 2
        const beta = Math.PI * 2
        const approx = polarRiemannSum(fPolar, R, 0, beta, nR, nR * 2)
        const exact = polarNumericalIntegral(fPolar, R, 0, beta)
        return {
          mainValue: formatValue(approx),
          approxValue: formatValue(approx),
          exactValue: formatValue(exact),
          error: formatValue(Math.abs(approx - exact)),
          label: '极坐标黎曼和 vs 精确值',
        }
      }

      case 'convergence1': {
        // Current convergence point
        const n = Math.round(paramValue)
        const exact = numericalIntegral2D(f, -3, 3, -3, 3)
        const approx = riemannSum2D(f, 3, 3, n)
        return {
          mainValue: formatValue(approx),
          approxValue: formatValue(approx),
          exactValue: formatValue(exact),
          error: formatValue(Math.abs(approx - exact)),
          label: `n=${n} 时收敛情况`,
        }
      }

      case 'convergence2': {
        // Error analysis summary
        const maxN = Math.round(paramValue)
        const exact = numericalIntegral2D(f, -3, 3, -3, 3)
        const approx = riemannSum2D(f, 3, 3, maxN)
        return {
          mainValue: formatValue(Math.abs(approx - exact)),
          approxValue: formatValue(Math.abs(approx - exact)),
          exactValue: `O(1/${maxN}²)`,
          error: formatValue(Math.abs(approx - exact)),
          label: `n=${maxN} 时中点法误差`,
        }
      }

      case 'triple1': {
        // Triple integral approximation
        const n = Math.round(paramValue)
        const approx = tripleIntegralApprox(fTriple, [0, 1], [0, 1], [0, 1], n)
        const exact = tripleIntegralExact(fTriple, [0, 1], [0, 1], [0, 1])
        return {
          mainValue: formatValue(approx),
          approxValue: formatValue(approx),
          exactValue: formatValue(exact),
          error: formatValue(Math.abs(approx - exact)),
          label: '三重积分近似值',
        }
      }

      case 'jacobian1': {
        const J = paramValue * paramValue
        return {
          mainValue: formatValue(J),
          approxValue: formatValue(J),
          exactValue: `a² = ${paramValue.toFixed(1)}²`,
          error: '0',
          label: '雅可比行列式 |J|',
        }
      }

      default:
        return null
    }
  }, [mode, paramValue, paramValue2])
}
