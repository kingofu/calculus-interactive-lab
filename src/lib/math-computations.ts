// 数值计算辅助函数 - 微积分互动实验室

// 数学函数定义
export const f = (x: number, y: number) => Math.max(0, 3 - (x * x + y * y) / 1.5)
export const g = (x: number, y: number) => Math.max(0, 1 + Math.cos(x) * Math.sin(y))
export const fOdd = (x: number, y: number) => x * y
export const fEven = (x: number, y: number) => x * x + y * y
export const fCartesian = (x: number, y: number) => Math.max(0, 2 - 1.5 * (x * x + y * y))
export const fRect = (x: number) => 3 * Math.exp(-0.5 * x * x)

// 二维黎曼和：在 [-a,a]×[-b,b] 上用 n×n 中点法计算
export function riemannSum2D(
  func: (x: number, y: number) => number,
  a: number,
  b: number,
  n: number
): number {
  const dx = (2 * a) / n
  const dy = (2 * b) / n
  let sum = 0
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const x = -a + (i + 0.5) * dx
      const y = -b + (j + 0.5) * dy
      sum += func(x, y) * dx * dy
    }
  }
  return sum
}

// 高精度二维数值积分（中点法）
export function numericalIntegral2D(
  func: (x: number, y: number) => number,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  n: number = 200
): number {
  const dx = (xMax - xMin) / n
  const dy = (yMax - yMin) / n
  let sum = 0
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const x = xMin + (i + 0.5) * dx
      const y = yMin + (j + 0.5) * dy
      sum += func(x, y) * dx * dy
    }
  }
  return sum
}

// 一维矩形近似（中点法）
export function rectApprox(
  func: (x: number) => number,
  a: number,
  b: number,
  n: number
): number {
  const dx = (b - a) / n
  let sum = 0
  for (let i = 0; i < n; i++) {
    const x = a + (i + 0.5) * dx
    sum += func(x) * dx
  }
  return sum
}

// 一维定积分的高精度数值解（辛普森法）
export function numericalIntegral1D(
  func: (x: number) => number,
  a: number,
  b: number,
  n: number = 1000
): number {
  // 辛普森法则
  if (n % 2 !== 0) n++
  const h = (b - a) / n
  let sum = func(a) + func(b)
  for (let i = 1; i < n; i++) {
    const x = a + i * h
    sum += (i % 2 === 0 ? 2 : 4) * func(x)
  }
  return (sum * h) / 3
}

// 球体与圆柱面相交体积
// 球体 x²+y²+z²≤R² 与圆柱 x²+y²≤a² 的交集
// 在高度 z，截面面积为 πa²（因为 a ≤ √(R²-z²)）
// 有效范围 |z| ≤ √(R²-a²)
// V = ∫_{-√(R²-a²)}^{√(R²-a²)} πa² dz = 2πa²√(R²-a²)
export function sphereCylinderVolume(R: number, a: number): number {
  if (a > R) return 0
  return 2 * Math.PI * a * a * Math.sqrt(R * R - a * a)
}

// 在三角形区域 [0,1]×[0,x] 上的二重积分（X型）
export function integralTriangularX(
  func: (x: number, y: number) => number,
  n: number = 200
): number {
  let sum = 0
  const nx = n
  for (let i = 0; i < nx; i++) {
    const x = (i + 0.5) / nx
    const yMax = x
    const ny = Math.max(1, Math.round(n * yMax))
    const dy = yMax / ny
    for (let j = 0; j < ny; j++) {
      const y = (j + 0.5) * dy
      sum += func(x, y) * (1 / nx) * dy
    }
  }
  return sum
}

// 在三角形区域 [0,1]×[y,1] 上的二重积分（Y型）
export function integralTriangularY(
  func: (x: number, y: number) => number,
  n: number = 200
): number {
  let sum = 0
  const ny = n
  for (let j = 0; j < ny; j++) {
    const y = (j + 0.5) / ny
    const xMin = y
    const nx = Math.max(1, Math.round(n * (1 - xMin)))
    const dx = (1 - xMin) / nx
    for (let i = 0; i < nx; i++) {
      const x = xMin + (i + 0.5) * dx
      sum += func(x, y) * (1 / ny) * dx
    }
  }
  return sum
}

// 极坐标黎曼和
export function polarRiemannSum(
  func: (x: number, y: number) => number,
  R: number,
  alpha: number,
  beta: number,
  nR: number,
  nTheta: number
): number {
  const dr = R / nR
  const dTheta = (beta - alpha) / nTheta
  let sum = 0
  for (let i = 0; i < nR; i++) {
    const r = (i + 0.5) * dr
    for (let j = 0; j < nTheta; j++) {
      const theta = alpha + (j + 0.5) * dTheta
      const x = r * Math.cos(theta)
      const y = r * Math.sin(theta)
      sum += func(x, y) * r * dr * dTheta
    }
  }
  return sum
}

// 极坐标区域高精度数值积分
export function polarNumericalIntegral(
  func: (x: number, y: number) => number,
  R: number,
  alpha: number,
  beta: number
): number {
  return polarRiemannSum(func, R, alpha, beta, 300, 300)
}

// 三重积分近似（中点法）
export function tripleIntegralApprox(
  func: (x: number, y: number, z: number) => number,
  xRange: [number, number],
  yRange: [number, number],
  zRange: [number, number],
  n: number
): number {
  const [xMin, xMax] = xRange
  const [yMin, yMax] = yRange
  const [zMin, zMax] = zRange
  const dx = (xMax - xMin) / n
  const dy = (yMax - yMin) / n
  const dz = (zMax - zMin) / n
  let sum = 0
  for (let i = 0; i < n; i++) {
    const x = xMin + (i + 0.5) * dx
    for (let j = 0; j < n; j++) {
      const y = yMin + (j + 0.5) * dy
      for (let k = 0; k < n; k++) {
        const z = zMin + (k + 0.5) * dz
        sum += func(x, y, z) * dx * dy * dz
      }
    }
  }
  return sum
}

// 三重积分高精度数值解
export function tripleIntegralExact(
  func: (x: number, y: number, z: number) => number,
  xRange: [number, number],
  yRange: [number, number],
  zRange: [number, number]
): number {
  return tripleIntegralApprox(func, xRange, yRange, zRange, 30)
}

// 三重积分函数 f(x,y,z) = x² + y² + z²
export const fTriple = (x: number, y: number, z: number) => x * x + y * y + z * z

// 极坐标用函数（与 f 相同，但用于极坐标区域）
export const fPolar = (x: number, y: number) => Math.max(0, 3 - (x * x + y * y) / 1.5)

// 生成收敛数据（用于收敛动画图表）
export function generateConvergenceData(
  func: (x: number, y: number) => number,
  xRange: [number, number],
  yRange: [number, number],
  maxN: number
): { n: number; approx: number; exact: number; error: number }[] {
  const exact = numericalIntegral2D(func, xRange[0], xRange[1], yRange[0], yRange[1])
  const data: { n: number; approx: number; exact: number; error: number }[] = []
  for (let n = 2; n <= maxN; n++) {
    const a = xRange[1]
    const b = yRange[1]
    const approx = riemannSum2D(func, a, b, n)
    data.push({
      n,
      approx,
      exact,
      error: Math.abs(approx - exact),
    })
  }
  return data
}

// 生成误差分析数据（中点法 vs 左端点法）
export function generateErrorData(
  func: (x: number, y: number) => number,
  xRange: [number, number],
  yRange: [number, number],
  maxN: number
): { n: number; errorMidpoint: number; errorLeft: number }[] {
  const exact = numericalIntegral2D(func, xRange[0], xRange[1], yRange[0], yRange[1])
  const data: { n: number; errorMidpoint: number; errorLeft: number }[] = []
  const [xMin, xMax] = xRange
  const [yMin, yMax] = yRange

  for (let n = 2; n <= maxN; n += Math.max(1, Math.floor(n / 20))) {
    // Midpoint rule
    const dxM = (xMax - xMin) / n
    const dyM = (yMax - yMin) / n
    let sumMid = 0
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const x = xMin + (i + 0.5) * dxM
        const y = yMin + (j + 0.5) * dyM
        sumMid += func(x, y) * dxM * dyM
      }
    }

    // Left endpoint rule
    const dxL = (xMax - xMin) / n
    const dyL = (yMax - yMin) / n
    let sumLeft = 0
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const x = xMin + i * dxL
        const y = yMin + j * dyL
        sumLeft += func(x, y) * dxL * dyL
      }
    }

    data.push({
      n,
      errorMidpoint: Math.abs(sumMid - exact),
      errorLeft: Math.abs(sumLeft - exact),
    })
  }
  return data
}

// 格式化数字，保留指定小数位
export function formatValue(value: number, digits: number = 4): string {
  if (Math.abs(value) < 1e-10) return '0'
  return value.toFixed(digits)
}

// 曲面面积近似计算：∫∫_D √(1 + (∂f/∂x)² + (∂f/∂y)²) dA
// f(x,y) = a*(x² + y²), ∂f/∂x = 2ax, ∂f/∂y = 2ay
// √(1 + 4a²(x² + y²))
export function surfaceAreaApprox(
  a: number,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  n: number = 200
): number {
  const dx = (xMax - xMin) / n
  const dy = (yMax - yMin) / n
  let sum = 0
  for (let i = 0; i < n; i++) {
    const x = xMin + (i + 0.5) * dx
    for (let j = 0; j < n; j++) {
      const y = yMin + (j + 0.5) * dy
      const gradMagSq = 4 * a * a * (x * x + y * y)
      const integrand = Math.sqrt(1 + gradMagSq)
      sum += integrand * dx * dy
    }
  }
  return sum
}

// 富比尼定理数值验证：∫∫f dσ 用两种累次积分顺序计算
// f(x,y) = (4 - x² - y²) / 2 over [-2,2]×[-2,2]
export function fubiniDoubleIntegral(
  n: number = 200
): { dydx: number; dxdy: number; direct: number } {
  const a = -2, b = 2, c = -2, d = 2
  const func = (x: number, y: number) => (4 - x * x - y * y) / 2

  // ∫_a^b [∫_c^d f(x,y) dy] dx (先y后x)
  const dx = (b - a) / n
  const dy = (d - c) / n
  let dydx = 0
  for (let i = 0; i < n; i++) {
    const x = a + (i + 0.5) * dx
    let innerSum = 0
    for (let j = 0; j < n; j++) {
      const y = c + (j + 0.5) * dy
      innerSum += func(x, y) * dy
    }
    dydx += innerSum * dx
  }

  // ∫_c^d [∫_a^b f(x,y) dx] dy (先x后y)
  let dxdy = 0
  for (let j = 0; j < n; j++) {
    const y = c + (j + 0.5) * dy
    let innerSum = 0
    for (let i = 0; i < n; i++) {
      const x = a + (i + 0.5) * dx
      innerSum += func(x, y) * dx
    }
    dxdy += innerSum * dy
  }

  // Direct 2D integral
  let direct = 0
  for (let i = 0; i < n; i++) {
    const x = a + (i + 0.5) * dx
    for (let j = 0; j < n; j++) {
      const y = c + (j + 0.5) * dy
      direct += func(x, y) * dx * dy
    }
  }

  return { dydx, dxdy, direct }
}

// 弧长近似计算：r(t) = (t, 1.5sin(t), 1.5cos(t)), t ∈ [0, 2π]
// 用 n 段折线逼近弧长
export function arcLengthApprox(n: number): number {
  const tMin = 0
  const tMax = 2 * Math.PI
  const dt = (tMax - tMin) / n
  let length = 0
  for (let i = 0; i < n; i++) {
    const t1 = tMin + i * dt
    const t2 = tMin + (i + 1) * dt
    const x1 = t1 - Math.PI, y1 = 1.5 * Math.sin(t1), z1 = 1.5 * Math.cos(t1)
    const x2 = t2 - Math.PI, y2 = 1.5 * Math.sin(t2), z2 = 1.5 * Math.cos(t2)
    const dx = x2 - x1, dy = y2 - y1, dz = z2 - z1
    length += Math.sqrt(dx * dx + dy * dy + dz * dz)
  }
  return length
}

// 弧长精确值：L = 2π√3.25
export function arcLengthExact(): number {
  return 2 * Math.PI * Math.sqrt(3.25)
}

// 质心计算：z = 2 - x² - y² over [-1,1]×[-1,1]
// 密度 ρ(x,y) = 1 + a*(x²+y²)
export function massCenterComputation(a: number): { mass: number; cx: number; cy: number } {
  const n = 50
  const xMin = -1, xMax = 1, yMin = -1, yMax = 1
  const dx = (xMax - xMin) / n
  const dy = (yMax - yMin) / n
  let mass = 0, mx = 0, my = 0

  for (let i = 0; i < n; i++) {
    const x = xMin + (i + 0.5) * dx
    for (let j = 0; j < n; j++) {
      const y = yMin + (j + 0.5) * dy
      const rho = 1 + a * (x * x + y * y)
      mass += rho * dx * dy
      mx += x * rho * dx * dy
      my += y * rho * dx * dy
    }
  }

  return {
    mass,
    cx: mass > 0 ? mx / mass : 0,
    cy: mass > 0 ? my / mass : 0,
  }
}

// 转动惯量计算：z = 2 - x² - y² over [-1,1]×[-1,1]
// 密度 ρ(x,y) = 1 + a*(x²+y²)
// Ix = ∫∫ y²ρ dσ, Iy = ∫∫ x²ρ dσ
export function momentOfInertia(a: number): { Ix: number; Iy: number; mass: number } {
  const n = 50
  const xMin = -1, xMax = 1, yMin = -1, yMax = 1
  const dx = (xMax - xMin) / n
  const dy = (yMax - yMin) / n
  let Ix = 0, Iy = 0, mass = 0

  for (let i = 0; i < n; i++) {
    const x = xMin + (i + 0.5) * dx
    for (let j = 0; j < n; j++) {
      const y = yMin + (j + 0.5) * dy
      const rho = 1 + a * (x * x + y * y)
      mass += rho * dx * dy
      Ix += y * y * rho * dx * dy
      Iy += x * x * rho * dx * dy
    }
  }

  return { Ix, Iy, mass }
}

// 柱坐标体积计算：V = πr²h
export function cylindricalVolume(r: number, h: number): number {
  return Math.PI * r * r * h
}

// ═══════════════════════════════════════════════════════════
// 一元微积分辅助函数 (Single-Variable Calculus Helpers)
// ═══════════════════════════════════════════════════════════

// 二分法求根：在 [a,b] 上找 func(x)=0 的根
export function bisectRoot(
  func: (x: number) => number,
  a: number,
  b: number,
  tol: number = 1e-8,
  maxIter: number = 100
): number {
  let lo = a, hi = b
  for (let i = 0; i < maxIter; i++) {
    const mid = (lo + hi) / 2
    const fMid = func(mid)
    if (Math.abs(fMid) < tol || (hi - lo) / 2 < tol) return mid
    if (func(lo) * fMid < 0) {
      hi = mid
    } else {
      lo = mid
    }
  }
  return (lo + hi) / 2
}

// 罗尔定理：f(x) = a*(x-1)*(x-3)*(x-5) on [1,5]
// f'(x) = a*(3x²-18x+23), 求导数为0的ξ
export function findRollePoint(a: number): { xi1: number; xi2: number; fXi1: number; fXi2: number } {
  const df = (x: number) => a * (3 * x * x - 18 * x + 23)
  // f'(x)=0: 3x²-18x+23=0, x = (18±√(324-276))/6 = (18±√48)/6 = 3±2√3/3
  const xi1 = 3 - (2 * Math.sqrt(3)) / 3  // ≈ 1.845
  const xi2 = 3 + (2 * Math.sqrt(3)) / 3  // ≈ 4.155
  const fAt = (x: number) => a * (x - 1) * (x - 3) * (x - 5)
  return { xi1, xi2, fXi1: fAt(xi1), fXi2: fAt(xi2) }
}

// 拉格朗日中值定理：f(x) = a*(x³-6x²+11x) on [0,4]
// 割线斜率 = (f(4)-f(0))/(4-0) = a*12/4 = 3a
// f'(x) = a*(3x²-12x+11), 设 f'(ξ)=3a: 3x²-12x+11=3, 3x²-12x+8=0
export function findLagrangePoint(a: number): { xi: number; secantSlope: number; tangentSlope: number } {
  const fAt = (x: number) => a * (x * x * x - 6 * x * x + 11 * x)
  const secantSlope = (fAt(4) - fAt(0)) / 4
  // 3x²-12x+8=0, x = (12±√(144-96))/6 = (12±√48)/6 = 2±2√3/3
  const xi1 = 2 - (2 * Math.sqrt(3)) / 3  // ≈ 0.845
  const xi2 = 2 + (2 * Math.sqrt(3)) / 3  // ≈ 3.155
  // Pick the one that's more interior (xi2 ≈ 3.155)
  const xi = xi2
  const df = (x: number) => a * (3 * x * x - 12 * x + 11)
  return { xi, secantSlope, tangentSlope: df(xi) }
}

// 旋转体体积：V = π∫ₐᵇ [f(x)]² dx
export function volumeOfRevolution(
  func: (x: number) => number,
  a: number,
  b: number
): number {
  const squared = (x: number) => {
    const v = func(x)
    return v * v
  }
  return Math.PI * numericalIntegral1D(squared, a, b)
}

// 两曲线间面积：∫ₐᵇ |f(x)-g(x)| dx
export function areaBetweenCurves(
  f1: (x: number) => number,
  f2: (x: number) => number,
  a: number,
  b: number
): number {
  const diff = (x: number) => Math.abs(f1(x) - f2(x))
  return numericalIntegral1D(diff, a, b)
}

// 积分中值定理：找 ξ 使 f(ξ) = 平均值
export function findMeanValueIntegralPoint(
  func: (x: number) => number,
  a: number,
  b: number
): { xi: number; avgValue: number; integral: number } {
  const integral = numericalIntegral1D(func, a, b)
  const avgValue = integral / (b - a)
  // Find ξ where f(ξ) = avgValue using bisection
  const search = (lo: number, hi: number): number => {
    return bisectRoot((x: number) => func(x) - avgValue, lo, hi)
  }
  // Try multiple intervals to find a root
  const n = 50
  const dx = (b - a) / n
  let xi = (a + b) / 2
  for (let i = 0; i < n; i++) {
    const lo = a + i * dx
    const hi = a + (i + 1) * dx
    if ((func(lo) - avgValue) * (func(hi) - avgValue) <= 0) {
      xi = search(lo, hi)
      break
    }
  }
  return { xi, avgValue, integral }
}
