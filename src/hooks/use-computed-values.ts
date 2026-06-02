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
  surfaceAreaApprox,
  fubiniDoubleIntegral,
  arcLengthApprox,
  arcLengthExact,
  massCenterComputation,
  momentOfInertia,
  cylindricalVolume,
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
      // ═══════════════════════════════════════════════════════════
      // 一元微积分 computed values
      // ═══════════════════════════════════════════════════════════
      case 'limit1': {
        const c = paramValue
        const L = paramValue2
        // Sequence a_n = L + c/n, converges to L
        const n10 = L + c / 10
        const n100 = L + c / 100
        return {
          mainValue: formatValue(L),
          approxValue: `a₁₀ = ${formatValue(n10)}`,
          exactValue: `a₁₀₀ = ${formatValue(n100)}`,
          error: formatValue(c / 100),
          label: `极限 L = ${formatValue(L)}, 收敛速度 c = ${c.toFixed(1)}`,
        }
      }

      case 'limit2': {
        const eps = paramValue
        // For f(x) = sin(x) + x near x₀=0, limit L=0
        // δ ≈ ε (since derivative at 0 is cos(0)+1 = 2, δ ≈ ε/2)
        const delta = eps / 2
        return {
          mainValue: formatValue(eps),
          approxValue: `δ ≈ ${formatValue(delta)}`,
          exactValue: `|f(x)-L| < ε`,
          error: formatValue(delta),
          label: `ε = ${formatValue(eps)}, δ ≈ ${formatValue(delta)}`,
        }
      }

      case 'derivative1': {
        const dx = paramValue
        const x0 = 0 // reference point
        // f(x) = sin(x) + 0.5*x
        const fx0 = Math.sin(x0) + 0.5 * x0
        const fx1 = Math.sin(x0 + dx) + 0.5 * (x0 + dx)
        const secantSlope = (fx1 - fx0) / dx
        const tangentSlope = Math.cos(x0) + 0.5
        return {
          mainValue: formatValue(tangentSlope),
          approxValue: `割线斜率 = ${formatValue(secantSlope)}`,
          exactValue: `切线斜率 = ${formatValue(tangentSlope)}`,
          error: formatValue(Math.abs(secantSlope - tangentSlope)),
          label: `Δx = ${dx.toFixed(2)}, 割线→切线`,
        }
      }

      case 'derivative2': {
        const x0 = paramValue
        // f(x) = x³ - 3x, f'(x) = 3x² - 3
        const fPrime = 3 * x0 * x0 - 3
        const fValue = x0 * x0 * x0 - 3 * x0
        return {
          mainValue: formatValue(fPrime),
          approxValue: `f(x₀) = ${formatValue(fValue)}`,
          exactValue: `f'(x₀) = 3x₀²-3`,
          error: formatValue(fPrime),
          label: `x₀ = ${x0.toFixed(1)}, 切线斜率 = ${formatValue(fPrime)}`,
        }
      }

      case 'derivative3': {
        const x0 = paramValue
        const dxVal = paramValue2
        // f(x) = x², f'(x) = 2x
        const dy = 2 * x0 * dxVal
        const deltaY = (x0 + dxVal) * (x0 + dxVal) - x0 * x0
        return {
          mainValue: formatValue(dy),
          approxValue: `Δy = ${formatValue(deltaY)}`,
          exactValue: `dy = ${formatValue(dy)}`,
          error: formatValue(Math.abs(deltaY - dy)),
          label: `dy = ${formatValue(dy)}, Δy = ${formatValue(deltaY)}`,
        }
      }

      case 'rolle1': {
        const a = paramValue
        // f(x) = a*(x-1)*(x-3)*(x-5), f'(x) = a*(3x²-18x+23)
        // Critical points: x = (18 ± √(324-276))/6 = (18 ± √48)/6 = 3 ± 2√3/3
        const xi1 = 3 - 2 * Math.sqrt(3) / 3
        const xi2 = 3 + 2 * Math.sqrt(3) / 3
        const fPrimeXi1 = 0
        return {
          mainValue: formatValue(xi1),
          approxValue: `ξ₁ ≈ ${formatValue(xi1)}`,
          exactValue: `ξ₂ ≈ ${formatValue(xi2)}`,
          error: formatValue(fPrimeXi1),
          label: `罗尔定理: f'(ξ)=0, ξ₁≈${xi1.toFixed(2)}, ξ₂≈${xi2.toFixed(2)}`,
        }
      }

      case 'lagrange1': {
        const a = paramValue
        // f(x) = a*(x-1)*(x-3)*(x-5) on [1,5], f(1)=f(5)=0
        // secant slope = (f(5)-f(1))/(5-1) = 0
        // f'(ξ) = a*(3ξ²-18ξ+23) = 0 → same as Rolle
        const xi1 = 3 - 2 * Math.sqrt(3) / 3
        const xi2 = 3 + 2 * Math.sqrt(3) / 3
        const secantSlope = 0 // f(1)=f(5)=0
        return {
          mainValue: formatValue(secantSlope),
          approxValue: `割线斜率 = ${formatValue(secantSlope)}`,
          exactValue: `f'(ξ₁)=0, f'(ξ₂)=0`,
          error: formatValue(0),
          label: `拉格朗日: ξ₁≈${xi1.toFixed(2)}, ξ₂≈${xi2.toFixed(2)}, 割线=f'(ξ)`,
        }
      }

      case 'indef_integral1': {
        const numCurves = Math.round(paramValue)
        // f(x) = 2x, F(x) = x² + C
        const CValues = Array.from({ length: numCurves }, (_, i) => i - Math.floor(numCurves / 2))
        const rangeStr = `C ∈ [${CValues[0]}, ${CValues[CValues.length - 1]}]`
        return {
          mainValue: `${numCurves}`,
          approxValue: `F(x) = x² + C`,
          exactValue: rangeStr,
          error: '0',
          label: `${numCurves}条原函数曲线, ${rangeStr}`,
        }
      }

      case 'ftc1': {
        const xUpper = paramValue
        // f(x) = sin(x) + 1, Φ(x) = ∫₀ˣ (sin(t)+1) dt = 1 - cos(x) + x
        const integralValue = 1 - Math.cos(xUpper) + xUpper
        const derivativeValue = Math.sin(xUpper) + 1 // Φ'(x) = f(x)
        return {
          mainValue: formatValue(integralValue),
          approxValue: `Φ'(x) = f(x) = ${formatValue(derivativeValue)}`,
          exactValue: `Φ(x) = ${formatValue(integralValue)}`,
          error: formatValue(Math.abs(derivativeValue - (Math.sin(xUpper) + 1))),
          label: `∫₀ˣf(t)dt = ${formatValue(integralValue)}, Φ'(x) = ${formatValue(derivativeValue)}`,
        }
      }

      case 'mean_value_integral1': {
        const a = paramValue
        // f(x) = a*sin(x) + 2 on [0, π]
        // avg = (1/π) * ∫₀^π (a*sin(x)+2) dx = (1/π)*(2a + 2π) = 2a/π + 2
        const avgValue = 2 * a / Math.PI + 2
        // f(ξ) = avg → a*sin(ξ) + 2 = avg → sin(ξ) = 2/(π)
        const xi = Math.asin(2 / Math.PI)
        return {
          mainValue: formatValue(avgValue),
          approxValue: `ξ ≈ ${formatValue(xi)}`,
          exactValue: `f(ξ) = ${formatValue(avgValue)}`,
          error: formatValue(Math.abs(a * Math.sin(xi) + 2 - avgValue)),
          label: `平均值 = ${formatValue(avgValue)}, ξ ≈ ${xi.toFixed(3)}`,
        }
      }

      case 'area1': {
        const d = paramValue
        // f(x) = d + sin(x), g(x) = sin(x) on [0, 2π]
        // Area = ∫₀²π d dx = 2πd
        const area = 2 * Math.PI * d
        return {
          mainValue: formatValue(area),
          approxValue: `S = 2πd = ${formatValue(area)}`,
          exactValue: `∫[f(x)-g(x)]dx`,
          error: formatValue(0),
          label: `面积 S = ${formatValue(area)} (间距 d = ${d.toFixed(1)})`,
        }
      }

      case 'volume_rev1': {
        const a = paramValue
        const n = Math.round(paramValue2)
        // f(x) = a*sin(x)+1 on [0, π], revolved around x-axis
        // V = π ∫₀^π (a*sin(x)+1)² dx = π * (a²π/2 + 2a*2 + π)
        const volume = Math.PI * (a * a * Math.PI / 2 + 4 * a + Math.PI)
        return {
          mainValue: formatValue(volume),
          approxValue: `${n}个圆盘近似`,
          exactValue: `V = π∫[f(x)]²dx`,
          error: formatValue(volume),
          label: `体积 V ≈ ${formatValue(volume)} (${n}个圆盘)`,
        }
      }

      // ═══════════════════════════════════════════════════════════
      // 多元微积分 computed values
      // ═══════════════════════════════════════════════════════════
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

      case 'green1': {
        const deform = paramValue
        // Compute area numerically via Green's theorem
        const res = 200
        let area = 0
        for (let i = 0; i < res; i++) {
          const t1 = (2 * Math.PI * i) / res
          const t2 = (2 * Math.PI * (i + 1)) / res
          const x1 = deform * (2 * Math.cos(t1) + 0.3 * Math.cos(3 * t1))
          const y1 = deform * (1.5 * Math.sin(t1) + 0.2 * Math.sin(2 * t1))
          const x2 = deform * (2 * Math.cos(t2) + 0.3 * Math.cos(3 * t2))
          const y2 = deform * (1.5 * Math.sin(t2) + 0.2 * Math.sin(2 * t2))
          area += x1 * (y2 - y1)
        }
        area = Math.abs(area)
        return {
          mainValue: formatValue(area),
          approxValue: formatValue(area),
          exactValue: '∮ x dy',
          error: '0',
          label: '区域面积 (格林公式)',
        }
      }

      case 'surface_area1': {
        const a = paramValue
        const surfaceArea = surfaceAreaApprox(a, -2, 2, -2, 2)
        // Flat domain area for comparison
        const flatArea = 4 * 4 // [-2,2]×[-2,2] = 16
        const ratio = surfaceArea / flatArea
        return {
          mainValue: formatValue(surfaceArea),
          approxValue: formatValue(surfaceArea),
          exactValue: `∫∫√(1+4·${a.toFixed(1)}²·(x²+y²)) dA`,
          error: formatValue(ratio),
          label: `曲面面积 S (底面积比: ${ratio.toFixed(2)})`,
        }
      }

      case 'fubini1': {
        const values = fubiniDoubleIntegral(200)
        return {
          mainValue: formatValue(values.direct),
          approxValue: formatValue(values.dydx),
          exactValue: formatValue(values.dxdy),
          error: formatValue(Math.abs(values.dydx - values.dxdy)),
          label: '∫∫f dσ (两种顺序验证)',
        }
      }

      case 'stokes1': {
        // Stokes' theorem: line integral = surface integral
        // For F=(-y/2, x/2, z·a), ∇×F=(-a, 0, 1)
        // Both integrals equal π for unit disk paraboloid
        const a = paramValue
        const lineIntegral = Math.PI // ∮ F·dr for unit circle
        const surfaceIntegral = Math.PI // ∫∫(∇×F)·dS = ∫∫1 dS = π
        return {
          mainValue: formatValue(lineIntegral),
          approxValue: formatValue(lineIntegral),
          exactValue: formatValue(surfaceIntegral),
          error: formatValue(Math.abs(lineIntegral - surfaceIntegral)),
          label: `斯托克斯验证: ∮=∬ (∇×F)·dS`,
        }
      }

      case 'divergence1': {
        // Gauss divergence theorem: surface flux = volume integral of divergence
        // For F=(x,y,z), ∇·F=3, flux=4πR³, volume integral=3×(4/3)πR³=4πR³
        const R = paramValue
        const flux = 4 * Math.PI * R * R * R
        const volumeInt = 3 * (4 / 3) * Math.PI * R * R * R
        return {
          mainValue: formatValue(flux),
          approxValue: formatValue(flux),
          exactValue: formatValue(volumeInt),
          error: formatValue(Math.abs(flux - volumeInt)),
          label: `高斯定理: ∯F·dS = ∭(∇·F)dV = ${formatValue(flux)}`,
        }
      }

      case 'arc_length1': {
        const n = Math.round(paramValue)
        const approx = arcLengthApprox(n)
        const exact = arcLengthExact()
        return {
          mainValue: formatValue(approx),
          approxValue: formatValue(approx),
          exactValue: formatValue(exact),
          error: formatValue(Math.abs(approx - exact)),
          label: `弧长近似 (${n}段) vs 精确值`,
        }
      }

      case 'mass_center1': {
        const a = paramValue
        const { mass, cx, cy } = massCenterComputation(a)
        return {
          mainValue: formatValue(mass),
          approxValue: `(${cx.toFixed(3)}, ${cy.toFixed(3)})`,
          exactValue: `ρ(x,y) = 1 + ${a.toFixed(1)}·(x²+y²)`,
          error: formatValue(Math.sqrt(cx * cx + cy * cy)),
          label: `质心 (x̄, ȳ) = (${cx.toFixed(3)}, ${cy.toFixed(3)})`,
        }
      }

      case 'moment_of_inertia1': {
        const a = paramValue
        const { Ix, Iy, mass } = momentOfInertia(a)
        return {
          mainValue: formatValue(Ix),
          approxValue: formatValue(Iy),
          exactValue: `ρ = 1 + ${a.toFixed(1)}·r²`,
          error: formatValue(Ix + Iy),
          label: `Ix=${Ix.toFixed(3)}, Iy=${Iy.toFixed(3)}`,
        }
      }

      case 'cylindrical1': {
        const r = paramValue
        const h = paramValue2
        const volume = cylindricalVolume(r, h)
        return {
          mainValue: formatValue(volume),
          approxValue: `π×${r.toFixed(1)}²×${h.toFixed(1)}`,
          exactValue: `πr²h = ${formatValue(volume)}`,
          error: '0',
          label: `体积 V = πr²h = ${formatValue(volume)}`,
        }
      }

      case 'gradient1': {
        const a = paramValue
        const maxGradMag = 2 * a * 0.85 * Math.SQRT2
        // Integral of |∇f|² = 4a²(x²+y²) over unit disk = 2πa²
        const gradMagSquared = 2 * Math.PI * a * a
        return {
          mainValue: formatValue(maxGradMag),
          approxValue: `|∇f|max = 2a·r_max`,
          exactValue: `∫∫|∇f|²dA = ${formatValue(gradMagSquared)}`,
          error: formatValue(2 * a),
          label: `最大梯度模 ≈ ${formatValue(maxGradMag)}, ∇f=(-2ax,-2ay)`,
        }
      }

      case 'spherical1': {
        const R = paramValue
        const phiMax = paramValue2
        const fullVolume = (4 / 3) * Math.PI * R * R * R
        // Partial sphere volume with phiMax < π
        const partialVolume = (Math.PI * R * R * R / 3) * (2 - 3 * Math.cos(phiMax) + Math.cos(phiMax) * Math.cos(phiMax) * Math.cos(phiMax))
        const volume = phiMax >= Math.PI - 0.01 ? fullVolume : partialVolume
        return {
          mainValue: formatValue(volume),
          approxValue: `(4/3)πR³ = ${formatValue(fullVolume)}`,
          exactValue: `V = ${formatValue(volume)}`,
          error: '0',
          label: `球体体积 = ${formatValue(volume)}`,
        }
      }

      case 'laplace1': {
        const a = paramValue
        // ∇²f = -a·cos(x)·cosh(y) + a·cos(x)·cosh(y) = 0
        // Numerical verification
        const testX = 1.0
        const testY = 0.5
        const d2fdx2 = -a * Math.cos(testX) * Math.cosh(testY)
        const d2fdy2 = a * Math.cos(testX) * Math.cosh(testY)
        const laplacian = d2fdx2 + d2fdy2
        return {
          mainValue: formatValue(laplacian),
          approxValue: `∂²f/∂x² = ${formatValue(d2fdx2)}`,
          exactValue: `∂²f/∂y² = ${formatValue(d2fdy2)}`,
          error: formatValue(Math.abs(laplacian)),
          label: `∇²f = 0 验证: ∂²f/∂x² + ∂²f/∂y² = ${formatValue(laplacian)}`,
        }
      }

      case 'fourier1': {
        const N = Math.round(paramValue)
        // Compute L² error for Fourier approximation of square wave
        let sumSq = 0
        const res = 500
        for (let i = 0; i <= res; i++) {
          const x = -Math.PI + (2 * Math.PI * i) / res
          const target = Math.sign(Math.sin(x))
          let approx = 0
          for (let n = 1; n <= N; n++) {
            const bn = n % 2 === 1 ? 4 / (n * Math.PI) : 0
            approx += bn * Math.sin(n * x)
          }
          const diff = target - approx
          sumSq += diff * diff
        }
        const l2Error = Math.sqrt(sumSq / res)
        // Max overshoot at Gibbs phenomenon ≈ 0.0895 (9% of jump height 2)
        return {
          mainValue: formatValue(l2Error),
          approxValue: `N=${N} 项`,
          exactValue: 'Gibbs过冲 ≈ 0.0895',
          error: formatValue(l2Error),
          label: `L²误差 (N=${N})`,
        }
      }

      case 'vector_field1': {
        const a = paramValue
        // Compute line integral numerically for F=(-y/2, x/2) along r(t)=(2t, a·sin(πt))
        let integral = 0
        const intRes = 1000
        for (let i = 0; i < intRes; i++) {
          const t = (i + 0.5) / intRes
          const x = 2 * t
          const y = a * Math.sin(Math.PI * t)
          const dx = 2 / intRes
          const dy = a * Math.PI * Math.cos(Math.PI * t) / intRes
          integral += (-y / 2) * dx + (x / 2) * dy
        }
        // Path length
        let pathLen = 0
        for (let i = 0; i < intRes; i++) {
          const t1 = i / intRes
          const t2 = (i + 1) / intRes
          const dx = 2 * (t2 - t1)
          const dy = a * Math.sin(Math.PI * t2) - a * Math.sin(Math.PI * t1)
          pathLen += Math.sqrt(dx * dx + dy * dy)
        }
        return {
          mainValue: formatValue(integral),
          approxValue: `路径长度: ${formatValue(pathLen)}`,
          exactValue: `∫C F·dr`,
          error: formatValue(Math.abs(integral)),
          label: `线积分值 = ${formatValue(integral)}`,
        }
      }

      case 'isosurface1': {
        const n = Math.round(paramValue)
        const funcType = Math.round(paramValue2)
        // Compute level values
        const levels: number[] = []
        for (let i = 0; i < n; i++) {
          const c = funcType === 0
            ? (i + 1) * (16 / n)
            : (i + 1) * (8 / n)
          levels.push(c)
        }
        const levelStr = levels.map((c, i) => `c${i + 1}=${c.toFixed(1)}`).join(', ')
        const minC = levels[0]
        const maxC = levels[levels.length - 1]
        return {
          mainValue: `${n}`,
          approxValue: `c ∈ [${minC.toFixed(1)}, ${maxC.toFixed(1)}]`,
          exactValue: funcType === 0 ? 'f(x,y,z)=x²+y²+z²' : 'f(x,y)=x²+y²',
          error: levelStr,
          label: `${n}个等值面/等高线层`,
        }
      }

      case 'directional1': {
        const theta = paramValue
        const a = paramValue2
        const px = 0.5
        const py = 0.5
        const gx = 2 * a * px
        const gy = 2 * a * py
        const gradMag = Math.sqrt(gx * gx + gy * gy)
        const ux = Math.cos(theta)
        const uy = Math.sin(theta)
        const dirDeriv = gx * ux + gy * uy
        const angleBetween = gradMag > 0.001 ? Math.acos(Math.max(-1, Math.min(1, dirDeriv / gradMag))) : 0
        return {
          mainValue: formatValue(dirDeriv),
          approxValue: `|∇f| = ${formatValue(gradMag)}`,
          exactValue: `θ = ${(angleBetween * 180 / Math.PI).toFixed(0)}°`,
          error: formatValue(Math.abs(gradMag - Math.abs(dirDeriv))),
          label: `D_uf = ${formatValue(dirDeriv)} = |∇f|·cosθ`,
        }
      }

      case 'curl1': {
        const a = paramValue
        // F = (-y, x), curl = ∂Q/∂x - ∂P/∂y = 1-(-1) = 2
        const curlValue = 2 * a
        return {
          mainValue: formatValue(curlValue),
          approxValue: '逆时针 (CCW)',
          exactValue: `∂Q/∂x - ∂P/∂y = ${formatValue(a)}-(-${formatValue(a)})`,
          error: formatValue(Math.abs(curlValue)),
          label: `旋度大小 = ${formatValue(curlValue)} (逆时针)`,
        }
      }

      case 'divergence_field1': {
        const a = paramValue
        // F = (x, y), div = ∂P/∂x + ∂Q/∂y = 1+1 = 2
        const divValue = 2 * a
        return {
          mainValue: formatValue(divValue),
          approxValue: '源 (Source)',
          exactValue: `∂P/∂x + ∂Q/∂y = ${formatValue(a)}+${formatValue(a)}`,
          error: formatValue(Math.abs(divValue)),
          label: `散度值 = ${formatValue(divValue)} (源场)`,
        }
      }

      case 'conservative1': {
        const a = paramValue
        // F = (a*x, a*y), ∇×F = 0, φ = a/2*(x²+y²)
        // Path integral from A=(-2,0) to B=(2,0) = φ(B)-φ(A) = a/2*(4) - a/2*(4) = 0
        const phiB = a / 2 * (4)
        const phiA = a / 2 * (4)
        const pathIntegral = phiB - phiA
        return {
          mainValue: formatValue(pathIntegral),
          approxValue: `∇×F = 0`,
          exactValue: `φ = ${a.toFixed(1)}/2·(x²+y²)`,
          error: formatValue(Math.abs(pathIntegral)),
          label: `路径积分 = φ(B)-φ(A) = ${formatValue(pathIntegral)}`,
        }
      }

      case 'surface_integral1': {
        const a = paramValue
        const range = 1.5
        const n = 80
        const dx = (2 * range) / n
        let sum = 0
        for (let i = 0; i < n; i++) {
          for (let j = 0; j < n; j++) {
            const x = -range + (i + 0.5) * dx
            const y = -range + (j + 0.5) * dx
            const z = a * (x * x + y * y)
            const dzdx = 2 * a * x
            const dzdy = 2 * a * y
            const dsFactor = Math.sqrt(1 + dzdx * dzdx + dzdy * dzdy)
            sum += z * dsFactor * dx * dx
          }
        }
        const maxR = range * Math.SQRT2
        const dsFactorMax = Math.sqrt(1 + 4 * a * a * maxR * maxR)
        return {
          mainValue: formatValue(sum),
          approxValue: `dS因子范围: [1, ${dsFactorMax.toFixed(2)}]`,
          exactValue: `∫∫_D f·√(1+gx²+gy²) dxdy`,
          error: formatValue(dsFactorMax),
          label: `曲面积分值 ≈ ${formatValue(sum)}`,
        }
      }

      default:
        return null
    }
  }, [mode, paramValue, paramValue2])
}

// Helper: factorial
function factorial2(n: number): number {
  if (n <= 1) return 1
  let result = 1
  for (let i = 2; i <= n; i++) result *= i
  return result
}