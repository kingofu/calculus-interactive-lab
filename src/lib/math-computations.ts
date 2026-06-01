// 数值计算辅助函数 - 二重积分全功能互动实验室

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
