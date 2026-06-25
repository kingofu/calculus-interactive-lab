import { create } from 'zustand'

export type LabMode =
  // 一元微积分 - 函数与极限
  | 'limit1' | 'limit2'
  | 'continuity1' | 'discontinuity1'
  // 一元微积分 - 导数与微分
  | 'derivative1' | 'derivative2' | 'derivative3'
  // 一元微积分 - 微分中值定理
  | 'rolle1' | 'lagrange1' | 'taylor1'
  // 一元微积分 - 导数的应用
  | 'monotonicity1' | 'extrema1' | 'concavity1' | 'curvature1'
  // 一元微积分 - 不定积分
  | 'indef_integral1'
  // 一元微积分 - 定积分
  | 'ftc1' | 'mean_value_integral1'
  // 一元微积分 - 定积分应用
  | 'area1' | 'volume_rev1'
  | 'improper_integral1' | 'polar_area1'
  // 多元微积分 - 二重积分基础
  | 'step1' | 'step2' | 'step3' | 'step4'
  | 'prop3' | 'prop6' | 'prop7'
  | 'parity1' | 'parity2'
  // 多元微积分 - 积分计算方法
  | 'cartesian1' | 'cartesian2'
  | 'polar1' | 'polar2'
  | 'jacobian1'
  | 'fubini1'
  // 多元微积分 - 积分应用
  | 'rect_approx'
  | 'surface_area1'
  | 'arc_length1'
  | 'mass_center1' | 'moment_of_inertia1'
  | 'sphere_cyl1' | 'sphere_cyl2'
  // 多元微积分 - 三重积分
  | 'triple1'
  | 'cylindrical1' | 'spherical1'
  // 多元微积分 - 积分定理
  | 'green1'
  | 'stokes1' | 'divergence1'
  // 多元微积分 - 向量场与微分算子
  | 'gradient1' | 'directional1'
  | 'vector_field1'
  | 'curl1' | 'divergence_field1'
  | 'conservative1'
  | 'laplace1'
  // 级数与逼近
  | 'convergence1'
  | 'fourier1'
  | 'isosurface1'
  | 'surface_integral1'

export interface TooltipData {
  content: string
  x: number
  y: number
}

// Load favorites from localStorage (SSR-safe)
function loadFavorites(): Set<LabMode> {
  if (typeof window === 'undefined') return new Set<LabMode>()
  try {
    const raw = localStorage.getItem('lab-favorites')
    if (raw) {
      const arr = JSON.parse(raw) as LabMode[]
      return new Set(arr)
    }
  } catch (e) {
    console.warn('Failed to load favorites:', e)
  }
  return new Set<LabMode>()
}

// Save favorites to localStorage (SSR-safe)
function saveFavorites(favorites: Set<LabMode>) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('lab-favorites', JSON.stringify([...favorites]))
  } catch (e) {
    console.warn('Failed to save favorites:', e)
  }
}

interface LabState {
  mode: LabMode
  paramValue: number
  paramValue2: number
  favorites: Set<LabMode>
  autoTourActive: boolean
  autoRotate: boolean
  tooltip: TooltipData | null
  overlayDragging: boolean
  setMode: (mode: LabMode) => void
  setParamValue: (value: number) => void
  setParamValue2: (value: number) => void
  setAutoTourActive: (active: boolean) => void
  setAutoRotate: (active: boolean) => void
  setOverlayDragging: (dragging: boolean) => void
  toggleFavorite: (mode: LabMode) => void
  hydrateFavorites: () => void
  showTooltip: (data: TooltipData) => void
  hideTooltip: () => void
}

export const useLabStore = create<LabState>((set) => ({
  mode: 'limit1',
  paramValue: 2,
  paramValue2: 1,
  favorites: new Set<LabMode>(),
  autoTourActive: false,
  autoRotate: true,
  tooltip: null,
  overlayDragging: false,
  setMode: (mode) => {
    const info = modeInfo[mode]
    set((state) => {
      const is2D = info.viewType === '2d'
      return {
        mode,
        paramValue: info.paramDefault,
        paramValue2: info.paramDefault2 ?? info.paramDefault,
        tooltip: null,
        autoRotate: is2D ? false : state.autoRotate,
      }
    })
  },
  setParamValue: (paramValue) => set({ paramValue }),
  setParamValue2: (paramValue2) => set({ paramValue2 }),
  setAutoTourActive: (autoTourActive) => set({ autoTourActive }),
  setAutoRotate: (autoRotate) => set({ autoRotate }),
  setOverlayDragging: (overlayDragging) => set({ overlayDragging }),
  toggleFavorite: (mode) => {
    set((state) => {
      const next = new Set(state.favorites)
      if (next.has(mode)) {
        next.delete(mode)
      } else {
        next.add(mode)
      }
      saveFavorites(next)
      return { favorites: next }
    })
  },
  hydrateFavorites: () => {
    const loaded = loadFavorites()
    if (loaded.size > 0) {
      set({ favorites: loaded })
    }
  },
  showTooltip: (data) => set({ tooltip: data }),
  hideTooltip: () => set({ tooltip: null }),
}))

export const modeInfo: Record<LabMode, {
  title: string
  section: string
  math: string
  description: string
  paramLabel: string
  paramMin: number
  paramMax: number
  paramStep: number
  paramDefault: number
  paramLabel2?: string
  paramMin2?: number
  paramMax2?: number
  paramStep2?: number
  paramDefault2?: number
  viewType?: '2d' | '3d'
}> = {
  // ═══════════════════════════════════════════════════════════
  // 一元微积分 (Single-Variable Calculus)
  // ═══════════════════════════════════════════════════════════
  limit1: {
    title: '数列极限',
    section: '函数与极限',
    math: '\\lim_{n \\to \\infty} a_n = L \\Leftrightarrow \\forall \\varepsilon > 0, \\exists N, n > N \\Rightarrow |a_n - L| < \\varepsilon',
    description: '数列极限描述数列 {aₙ} 当 n→∞ 时趋近于某个确定值 L 的过程。图中展示数列 aₙ = L + 1/n^c 的收敛过程，带有 ε-带标注。参数 c 为收敛阶数：c 越大，收敛速度越快（c=1 为 O(1/n) 收敛，c=2 为 O(1/n²) 收敛）。调整参数观察不同收敛速度下数列趋近极限的过程。',
    paramLabel: '收敛阶数 c',
    paramMin: 0.5, paramMax: 5, paramStep: 0.1, paramDefault: 2,
    paramLabel2: '极限值 L',
    paramMin2: 0, paramMax2: 3, paramStep2: 0.1, paramDefault2: 1,
    viewType: '2d',
  },
  limit2: {
    title: '函数极限 ε-δ',
    section: '函数与极限',
    math: '\\lim_{x \\to x_0} f(x) = L \\Leftrightarrow \\forall \\varepsilon > 0, \\exists \\delta > 0, 0<|x-x_0|<\\delta \\Rightarrow |f(x)-L|<\\varepsilon',
    description: '函数极限的 ε-δ 定义：对于任意 ε>0，存在 δ>0，当 0<|x-x₀|<δ 时，|f(x)-L|<ε。图中展示函数曲线、ε-带（水平绿色带）和对应的 δ-区间（垂直橙色带）。调整 ε 观察 δ 的变化。',
    paramLabel: 'ε 大小',
    paramMin: 0.1, paramMax: 1.5, paramStep: 0.05, paramDefault: 0.5,
    viewType: '2d',
  },
  derivative1: {
    title: '导数定义 (割线→切线)',
    section: '导数与微分',
    math: "f'(x_0) = \\lim_{\\Delta x \\to 0} \\frac{f(x_0+\\Delta x) - f(x_0)}{\\Delta x}",
    description: '导数是割线斜率的极限，当 Δx→0 时割线变为切线。图中展示曲线 f(x)=sin(x)+0.5x，随着参数减小，割线（蓝色虚线）逐渐逼近切线（红色实线）。动画演示从割线到切线的过渡过程。',
    paramLabel: 'Δx 大小',
    paramMin: 0.05, paramMax: 2, paramStep: 0.05, paramDefault: 1,
    viewType: '2d',
  },
  derivative2: {
    title: '切线与导函数',
    section: '导数与微分',
    math: "y - f(x_0) = f'(x_0)(x - x_0)",
    description: '在曲线 f(x) 上某点 x₀ 处的切线方程为 y-f(x₀)=f\'(x₀)(x-x₀)。图中同时展示原函数 f(x)=x³-3x（蓝色）和其导函数 f\'(x)=3x²-3（红色），移动点观察切线斜率与导数值的对应关系。',
    paramLabel: '切点位置 x₀',
    paramMin: -2, paramMax: 2, paramStep: 0.1, paramDefault: 0,
    viewType: '2d',
  },
  derivative3: {
    title: '微分与线性近似',
    section: '导数与微分',
    math: 'dy = f\'(x)\\,dx, \\quad \\Delta y \\approx dy',
    description: '微分 dy=f\'(x)dx 是函数增量的线性主部。当 Δx 很小时，Δy≈dy。图中展示曲线 f(x)=x² 在点 x₀ 处，Δy（实际增量，蓝色）与 dy（微分近似，红色）的对比。调整 Δx 观察两者差异。',
    paramLabel: 'x₀ 位置',
    paramMin: 0.5, paramMax: 2.5, paramStep: 0.1, paramDefault: 1.5,
    paramLabel2: 'Δx 大小',
    paramMin2: 0.1, paramMax2: 1.5, paramStep2: 0.05, paramDefault2: 0.5,
    viewType: '2d',
  },
  rolle1: {
    title: '罗尔定理',
    section: '微分中值定理',
    math: "f(a)=f(b) \\Rightarrow \\exists \\xi \\in (a,b), f'(\\xi)=0",
    description: '罗尔定理：若 f 在 [a,b] 上连续、(a,b) 内可导，且 f(a)=f(b)，则存在 ξ∈(a,b) 使 f\'(ξ)=0。图中展示满足条件的曲线 f(x)=(x-1)(x-3)(x-5) 上的水平切线点 ξ。调整参数改变曲线形状。',
    paramLabel: '曲线变形 a',
    paramMin: 0.3, paramMax: 2, paramStep: 0.1, paramDefault: 1,
    viewType: '2d',
  },
  lagrange1: {
    title: '拉格朗日中值定理',
    section: '微分中值定理',
    math: "f(b)-f(a) = f'(\\xi)(b-a), \\quad \\xi \\in (a,b)",
    description: '拉格朗日中值定理：若 f 在 [a,b] 上连续、(a,b) 内可导，则存在 ξ∈(a,b) 使割线斜率等于切线斜率。图中展示割线（蓝色虚线）和与割线平行的切线（红色实线）。调整参数观察不同函数和区间。',
    paramLabel: '曲线变形 a',
    paramMin: 0.3, paramMax: 2, paramStep: 0.1, paramDefault: 1,
    viewType: '2d',
  },
  taylor1: {
    title: '泰勒级数展开',
    section: '微分中值定理',
    math: 'f(x) = \\sum_{k=0}^{n} \\frac{f^{(k)}(x_0)}{k!}(x-x_0)^k + R_n(x)',
    description: '泰勒级数将函数在某点附近用多项式逼近。随着项数n增加，泰勒多项式在展开点附近越来越精确地逼近原函数。图中展示函数f(x)=sin(x)（蓝色）及其不同阶的泰勒多项式（橙色），展开点为x₀=0。调整参数观察项数对逼近精度的影响。误差余项Rₙ(x)表示多项式与原函数的差距。',
    paramLabel: '逼近项数 N',
    paramMin: 1, paramMax: 15, paramStep: 1, paramDefault: 3,
    viewType: '2d',
  },
  indef_integral1: {
    title: '原函数族',
    section: '不定积分',
    math: '\\int f(x)\\,dx = F(x) + C',
    description: '不定积分 ∫f(x)dx 是 f(x) 的全体原函数 F(x)+C。不同的常数 C 对应曲线族中不同的曲线，它们沿 y 轴方向平移。图中展示 f(x)=2x 的原函数族 F(x)=x²+C，多条曲线以不同颜色显示。调整 C 的范围观察曲线族变化。',
    paramLabel: '曲线数量',
    paramMin: 3, paramMax: 12, paramStep: 1, paramDefault: 7,
    viewType: '2d',
  },
  ftc1: {
    title: '微积分基本定理',
    section: '定积分',
    math: '\\frac{d}{dx}\\int_a^x f(t)\\,dt = f(x), \\quad \\int_a^b f(x)\\,dx = F(b) - F(a)',
    description: '微积分基本定理（牛顿-莱布尼茨公式）将微分与积分联系起来。第一部分：变上限积分的导数等于被积函数；第二部分：定积分等于原函数在端点的差值。图中展示 f(x) 的面积函数 Φ(x)=∫ₐˣf(t)dt 和其导数 Φ\'(x)=f(x) 的关系。',
    paramLabel: '上限 x 位置',
    paramMin: -2, paramMax: 2, paramStep: 0.1, paramDefault: 1,
    viewType: '2d',
  },
  mean_value_integral1: {
    title: '积分中值定理',
    section: '定积分',
    math: '\\int_a^b f(x)\\,dx = f(\\xi)(b-a), \\quad \\xi \\in [a,b]',
    description: '积分中值定理：存在 ξ∈[a,b] 使 f(ξ) 等于函数在 [a,b] 上的平均值。图中展示曲线 f(x) 下的面积与同底等高的矩形面积相等，矩形高度为平均值 f(ξ)。调整参数观察不同函数的平均值位置。',
    paramLabel: '曲线振幅',
    paramMin: 0.3, paramMax: 2, paramStep: 0.1, paramDefault: 1,
    viewType: '2d',
  },
  area1: {
    title: '曲线间面积',
    section: '定积分的应用',
    math: 'S = \\int_a^b [f(x) - g(x)]\\,dx, \\quad f(x) \\ge g(x)',
    description: '两曲线 y=f(x) 和 y=g(x) 之间的面积可通过定积分 S=∫ₐᵇ[f(x)-g(x)]dx 计算。图中展示两条曲线之间的区域（高亮填充），面积值实时显示。调整参数观察不同曲线围成的区域。',
    paramLabel: '曲线间距',
    paramMin: 0.3, paramMax: 2, paramStep: 0.1, paramDefault: 1,
    viewType: '2d',
  },
  volume_rev1: {
    title: '旋转体体积',
    section: '定积分的应用',
    math: 'V = \\pi \\int_a^b [f(x)]^2\\,dx',
    description: '旋转体体积公式：将曲线 y=f(x) 绕 x 轴旋转一周所得的立体体积 V=π∫ₐᵇ[f(x)]²dx。图中展示曲线绕 x 轴旋转生成的3D旋转体，以及圆盘截面。调整参数观察不同函数生成的旋转体。',
    paramLabel: '曲线高度 a',
    paramMin: 0.5, paramMax: 2.5, paramStep: 0.1, paramDefault: 1.5,
    paramLabel2: '截面数',
    paramMin2: 3, paramMax2: 20, paramStep2: 1, paramDefault2: 8,
  },
  continuity1: {
    title: '函数连续性',
    section: '函数与极限',
    math: '\\lim_{x \\to x_0} f(x) = f(x_0)',
    description: '函数 f(x) 在 x₀ 处连续，需满足三个条件：f(x₀) 存在、lim f(x) 存在、lim f(x)=f(x₀)。图中展示连续函数（绿色）和不连续函数（红色虚线）的对比。调整参数观察连续性破坏的情况。',
    paramLabel: '连续性系数',
    paramMin: 0, paramMax: 1, paramStep: 0.1, paramDefault: 1,
    viewType: '2d',
  },
  discontinuity1: {
    title: '间断点类型',
    section: '函数与极限',
    math: '\\text{第一类: 可去/跳跃} \\quad \\text{第二类: 无穷/振荡}',
    description: '间断点分为第一类（左右极限都存在：可去间断点、跳跃间断点）和第二类（至少一侧极限不存在：无穷间断点、振荡间断点）。图中展示四种典型间断点：可去(x=1)、跳跃(x=2)、无穷(x=3)、振荡(x=4)。调整参数观察不同类型。',
    paramLabel: '显示类型',
    paramMin: 1, paramMax: 4, paramStep: 1, paramDefault: 1,
    viewType: '2d',
  },

  monotonicity1: {
    title: '函数单调性',
    section: '导数的应用',
    math: "f'(x) > 0 \\Rightarrow f\\text{单调增}, \\quad f'(x) < 0 \\Rightarrow f\\text{单调减}",
    description: "函数单调性与导数符号的关系：f'(x)>0 时 f 单调递增，f'(x)<0 时 f 单调递减。图中展示函数 f(x)=x³-3x（蓝色）、其导函数 f'(x)=3x²-3（红色虚线），以及单调递增区间（绿色底色）和单调递减区间（橙色底色）。",
    paramLabel: '函数系数 a',
    paramMin: 0.3, paramMax: 3, paramStep: 0.1, paramDefault: 1,
    viewType: '2d',
  },
  extrema1: {
    title: '函数极值',
    section: '导数的应用',
    math: "f'(x_0)=0, \\quad f''(x_0)<0 \\Rightarrow \\text{极大值}, \\quad f''(x_0)>0 \\Rightarrow \\text{极小值}",
    description: "极值的充分条件：f'(x₀)=0 且 f''(x₀)<0 时为极大值，f''(x₀)>0 时为极小值。图中展示函数 f(x)=x⁴-4x² 的极大值点（红色）和极小值点（绿色），以及二阶导数的符号变化。",
    paramLabel: '函数系数 a',
    paramMin: 0.3, paramMax: 3, paramStep: 0.1, paramDefault: 1,
    viewType: '2d',
  },
  concavity1: {
    title: '凹凸性与拐点',
    section: '导数的应用',
    math: "f''(x) > 0 \\Rightarrow \\text{凹函数}, \\quad f''(x) < 0 \\Rightarrow \\text{凸函数}, \\quad f''(x_0)=0 \\Rightarrow \\text{拐点}",
    description: "二阶导数决定函数的凹凸性：f''(x)>0 时曲线凹（开口向上），f''(x)<0 时曲线凸（开口向下），f''(x₀)=0 处可能为拐点。图中展示函数 f(x)=x³ 的凹区间（蓝色）和凸区间（红色），以及拐点位置。",
    paramLabel: '函数系数 a',
    paramMin: 0.3, paramMax: 3, paramStep: 0.1, paramDefault: 1,
    viewType: '2d',
  },
  curvature1: {
    title: '曲率',
    section: '导数的应用',
    math: '\\kappa = \\frac{|f\'\'(x)|}{(1+[f\'(x)]^2)^{3/2}}',
    description: '曲率 κ 衡量曲线在某点的弯曲程度。曲率越大，弯曲越厉害；直线曲率为0，圆的曲率恒为 1/R。图中展示曲线 f(x) 及其曲率圆（在最大曲率点处），曲率 κ 与曲率半径 R=1/κ 的关系。调整参数观察不同曲线的曲率变化。',
    paramLabel: '观察点 x₀',
    paramMin: -2, paramMax: 2, paramStep: 0.1, paramDefault: 0,
    viewType: '2d',
  },

  improper_integral1: {
    title: '反常积分',
    section: '定积分',
    math: '\\int_a^{+\\infty} f(x)\\,dx = \\lim_{b \\to +\\infty} \\int_a^b f(x)\\,dx',
    description: '反常积分将定积分推广到无限区间或无界函数。对于 ∫ₐ^∞ f(x)dx，若极限 lim(b→∞) ∫ₐᵇf(x)dx 存在，则积分收敛；否则发散。图中展示收敛积分（蓝色填充区域趋于有限值）和发散积分（红色填充区域趋于无穷）。调整参数观察收敛与发散的临界状态。',
    paramLabel: '衰减速度 p',
    paramMin: 0.3, paramMax: 3, paramStep: 0.1, paramDefault: 1.5,
    viewType: '2d',
  },
  polar_area1: {
    title: '极坐标面积',
    section: '定积分的应用',
    math: 'S = \\frac{1}{2}\\int_\\alpha^\\beta [r(\\theta)]^2\\,d\\theta',
    description: '极坐标下曲线 r=r(θ) 与射线 θ=α、θ=β 所围区域的面积 S=½∫ₐᵝr²(θ)dθ。图中展示极坐标曲线 r=2+cos(θ)（心形线）及围成区域的填充。调整参数观察不同极坐标曲线的面积。',
    paramLabel: '花瓣参数 a',
    paramMin: 0.5, paramMax: 3, paramStep: 0.1, paramDefault: 1,
    viewType: '2d',
  },
  // ═══════════════════════════════════════════════════════════
  // 多元微积分 (Multivariable Calculus)
  // ═══════════════════════════════════════════════════════════
  step1: {
    title: '区域划分 (D)',
    section: '二重积分概念步骤',
    math: '\\iint_D f(x,y)\\,d\\sigma',
    description: '二重积分的积分区域 D，即函数 f(x,y) 定义域中被积区域。将积分区域 D 在 xy 平面上标出，作为后续划分和近似的基础。',
    paramLabel: '区域大小',
    paramMin: 1, paramMax: 4, paramStep: 0.1, paramDefault: 2,
  },
  step2: {
    title: '网格划分',
    section: '二重积分概念步骤',
    math: 'D = \\bigcup_{i=1}^{n} \\Delta D_i, \\quad d_i = \\max \\text{diam}(\\Delta D_i)',
    description: '将区域 D 用网格划分成 n 个小区域 ΔD₁, ΔD₂, ..., ΔDₙ，每个小区域的直径 dᵢ 趋于 0 时，划分越精细。',
    paramLabel: '网格数量',
    paramMin: 2, paramMax: 20, paramStep: 1, paramDefault: 5,
  },
  step3: {
    title: '方柱近似 (黎曼和)',
    section: '二重积分概念步骤',
    math: '\\sum_{i=1}^{n} f(\\xi_i, \\eta_i) \\Delta\\sigma_i',
    description: '在每个小区域 ΔDᵢ 上，以 f(ξᵢ,ηᵢ) 为高度、Δσᵢ 为底面积构造方柱。所有方柱体积之和即为黎曼和，是对二重积分的近似。',
    paramLabel: '柱体数量',
    paramMin: 2, paramMax: 20, paramStep: 1, paramDefault: 8,
  },
  step4: {
    title: '取极限 (体积)',
    section: '二重积分概念步骤',
    math: '\\iint_D f(x,y)\\,d\\sigma = \\lim_{\\lambda \\to 0} \\sum_{i=1}^{n} f(\\xi_i, \\eta_i) \\Delta\\sigma_i',
    description: '当分割的细度 λ→0 时，黎曼和的极限就是二重积分的值，它等于以 D 为底、以曲面 z=f(x,y) 为顶的曲顶柱体的体积。',
    paramLabel: '细分程度',
    paramMin: 5, paramMax: 50, paramStep: 1, paramDefault: 30,
  },
  prop3: {
    title: '区域可加性',
    section: '二重积分基本性质',
    math: '\\iint_D f(x,y)\\,d\\sigma = \\iint_{D_1} f(x,y)\\,d\\sigma + \\iint_{D_2} f(x,y)\\,d\\sigma',
    description: '若 D = D₁ ∪ D₂ 且 D₁、D₂ 无公共内点，则整个区域上的积分等于各子区域积分之和。拖动分隔线观察区域划分。',
    paramLabel: '分割位置',
    paramMin: -2, paramMax: 2, paramStep: 0.1, paramDefault: 0,
  },
  prop6: {
    title: '估值定理',
    section: '二重积分基本性质',
    math: 'mS_D \\le \\iint_D f\\,d\\sigma \\le MS_D',
    description: '若 m ≤ f(x,y) ≤ M，则 m·S_D ≤ ∬f dσ ≤ M·S_D。图中展示了曲面 f(x,y) 及其上界 M 平面和下界 m 平面。',
    paramLabel: '曲面缩放',
    paramMin: 0.5, paramMax: 3, paramStep: 0.1, paramDefault: 1.5,
  },
  prop7: {
    title: '中值定理',
    section: '二重积分基本性质',
    math: '\\iint_D f(x,y)\\,d\\sigma = f(\\xi,\\eta) \\cdot S_D',
    description: '存在一点 (ξ,η)∈D，使得积分值等于 f(ξ,η)·S_D。图中半透明平面表示平均值高度 f(ξ,η)，其下方柱体体积等于曲顶柱体体积。',
    paramLabel: '曲面缩放',
    paramMin: 0.5, paramMax: 3, paramStep: 0.1, paramDefault: 1.5,
  },
  parity1: {
    title: '奇函数积分',
    section: '二重积分与奇偶性',
    math: 'f(-x,y)=-f(x,y) \\Rightarrow \\iint_D f(x,y)\\,d\\sigma = 0',
    description: '若 f 关于 x 为奇函数，在对称区域 D=[-a,a]×[-b,b] 上，正负部分相互抵消，积分为 0。暖色表示正值区域，冷色表示负值区域。',
    paramLabel: '区域大小 a',
    paramMin: 0.5, paramMax: 3, paramStep: 0.1, paramDefault: 2,
  },
  parity2: {
    title: '偶函数积分',
    section: '二重积分与奇偶性',
    math: 'f(-x,y)=f(x,y) \\Rightarrow \\iint_D f\\,d\\sigma = 2\\iint_{D^+} f\\,d\\sigma',
    description: '若 f 关于 x 为偶函数，在对称区域上，左右两半贡献相等，积分值等于半区域积分的 2 倍。',
    paramLabel: '区域大小 a',
    paramMin: 0.5, paramMax: 3, paramStep: 0.1, paramDefault: 2,
  },
  cartesian1: {
    title: 'X型区域 (先y后x)',
    section: '直角坐标系计算',
    math: '\\int_0^1 \\int_0^x f(x,y)\\,dy\\,dx',
    description: 'X型区域：先对 y 积分（内层），再对 x 积分（外层）。竖直切片沿 x 方向移动，每个切片的 y 范围随 x 变化。',
    paramLabel: '竖直切片数',
    paramMin: 2, paramMax: 20, paramStep: 1, paramDefault: 6,
  },
  cartesian2: {
    title: 'Y型区域 (先x后y)',
    section: '直角坐标系计算',
    math: '\\int_0^1 \\int_y^1 f(x,y)\\,dx\\,dy',
    description: 'Y型区域：先对 x 积分（内层），再对 y 积分（外层）。水平切片沿 y 方向移动，每个切片的 x 范围随 y 变化。',
    paramLabel: '水平切片数',
    paramMin: 2, paramMax: 20, paramStep: 1, paramDefault: 6,
  },
  rect_approx: {
    title: '矩形近似面积',
    section: '矩形近似面积演示',
    math: '\\int_a^b f(x)\\,dx \\approx \\sum_{i=1}^{n} f(x_i)\\Delta x',
    description: '用 n 个矩形近似函数 f(x) 在 [a,b] 上的定积分，随着矩形数量增加，近似值趋近精确值。图中展示函数曲线和矩形近似，面积值实时显示。',
    paramLabel: '矩形数量',
    paramMin: 2, paramMax: 100, paramStep: 1, paramDefault: 10,
    viewType: '2d',
  },
  sphere_cyl1: {
    title: '球体与圆柱面相交体',
    section: '球体与圆柱面相交',
    math: 'V = 2\\int_0^{2\\pi} \\int_0^a \\sqrt{R^2-r^2}\\,r\\,dr\\,d\\theta',
    description: '球体 x²+y²+z²=R² 与圆柱面 x²+y²=a² 的相交部分（Viviani 区域）。半透明球体与圆柱面相交，交叠区域高亮显示。',
    paramLabel: '圆柱半径 a',
    paramMin: 0.5, paramMax: 2.5, paramStep: 0.1, paramDefault: 1.5,
    paramLabel2: '球体半径 R',
    paramMin2: 1.5, paramMax2: 3, paramStep2: 0.1, paramDefault2: 2.5,
  },
  sphere_cyl2: {
    title: '截面法计算',
    section: '球体与圆柱面相交',
    math: 'A(z) = \\pi a^2 \\cdot \\mathbf{1}_{|z|\\leq\\sqrt{R^2-a^2}}',
    description: '在高度 z 处取截面，观察球体和圆柱面的横截面。截面法将体积分解为沿 z 轴的面积分积分 V = ∫A(z)dz。',
    paramLabel: '截面高度 z',
    paramMin: -2.5, paramMax: 2.5, paramStep: 0.05, paramDefault: 0,
    paramLabel2: '圆柱半径 a',
    paramMin2: 0.5, paramMax2: 2.5, paramStep2: 0.1, paramDefault2: 1.5,
  },
  polar1: {
    title: '极坐标区域',
    section: '极坐标系计算',
    math: '\\iint_D f(x,y)\\,d\\sigma = \\int_\\alpha^\\beta \\int_0^R f(r\\cos\\theta, r\\sin\\theta)\\,r\\,dr\\,d\\theta',
    description: '极坐标系下，面积元素 dσ = r dr dθ，多出的因子 r 来自坐标变换的雅可比行列式。',
    paramLabel: '区域半径 R',
    paramMin: 0.5, paramMax: 3, paramStep: 0.1, paramDefault: 2,
    paramLabel2: '角度范围 β',
    paramMin2: 0.8, paramMax2: 6.28, paramStep2: 0.1, paramDefault2: 6.28,
  },
  polar2: {
    title: '极坐标黎曼和',
    section: '极坐标系计算',
    math: '\\sum f(r_i,\\theta_j) \\cdot r_i \\cdot \\Delta r \\cdot \\Delta\\theta',
    description: '将极坐标区域用同心圆和射线划分，每个小扇形区域面积约为 r·Δr·Δθ。在每个区域取函数值构造黎曼和。',
    paramLabel: '径向分割数',
    paramMin: 2, paramMax: 20, paramStep: 1, paramDefault: 6,
  },
  convergence1: {
    title: '收敛过程动画',
    section: '数值积分收敛演示',
    math: '\\lim_{n \\to \\infty} S_n \\to \\iint_D f(x,y)\\,d\\sigma',
    description: '观察黎曼和随分割数 n 增加而逐渐收敛到精确积分值的过程。图表展示近似值曲线趋近精确值水平线。',
    paramLabel: '分割数 n',
    paramMin: 2, paramMax: 100, paramStep: 1, paramDefault: 10,
  },

  triple1: {
    title: '三重积分可视化',
    section: '三重积分概念',
    math: '\\iiint_V f(x,y,z)\\,dV = \\lim \\sum f(x_i,y_j,z_k)\\Delta V',
    description: '将积分区域 [0,1]³ 用小立方体填充，每个立方体颜色表示函数值 f(x,y,z)=x²+y²+z² 的大小，所有立方体贡献之和即为三重积分近似值。',
    paramLabel: '分割数',
    paramMin: 2, paramMax: 10, paramStep: 1, paramDefault: 4,
  },
  jacobian1: {
    title: '变量代换 (雅可比行列式)',
    section: '变量代换',
    math: '\\iint_D f(x,y)\\,dxdy = \\iint_{D\"} f(x(u,v),y(u,v))\\left|\\frac{\\partial(x,y)}{\\partial(u,v)}\\right|\\,dudv',
    description: '通过变量代换 x=x(u,v), y=y(u,v)，将原积分区域 D 变换为新区域 D\'。雅可比行列式 |∂(x,y)/∂(u,v)| 是面积变换因子，将新坐标系中的面积微元 dudv 放大为原坐标系中的 dxdy。拖动参数观察坐标网格在变换下的变形。',
    paramLabel: '变换缩放',
    paramMin: 0.3, paramMax: 2, paramStep: 0.1, paramDefault: 1,
    paramLabel2: '旋转角度',
    paramMin2: 0, paramMax2: 1.57, paramStep2: 0.05, paramDefault2: 0,
  },
  green1: {
    title: '格林公式',
    section: '格林公式与线积分',
    math: '\\oint_C (P\\,dx + Q\\,dy) = \\iint_D \\left(\\frac{\\partial Q}{\\partial x} - \\frac{\\partial P}{\\partial y}\\right)dxdy',
    description: '格林公式将沿闭曲线 C 的线积分与 C 所围区域 D 上的二重积分联系起来。图中展示闭曲线 C（红色箭头表示逆时针方向），区域 D（绿色填充），以及向量场 (P,Q) 沿边界曲线的流动。拖动参数改变曲线形状，观察线积分与面积分的等价关系。',
    paramLabel: '区域变形',
    paramMin: 0.3, paramMax: 2, paramStep: 0.1, paramDefault: 1,
  },
  surface_area1: {
    title: '曲面面积计算',
    section: '曲面面积与弧长',
    math: 'S = \\iint_D \\sqrt{1 + \\left(\\frac{\\partial f}{\\partial x}\\right)^2 + \\left(\\frac{\\partial f}{\\partial y}\\right)^2}\\,d\\sigma',
    description: '曲面 z=f(x,y) 的面积可通过公式 S=∫∫√(1+fx²+fy²) dσ 计算。图中展示曲面及其法向量，面积元素 dS=√(1+fx²+fy²)·dxdy 的几何意义是：在曲面上，每个微小面积元素是底面上对应面积元素的 √(1+fx²+fy²) 倍。调整参数观察不同曲面的面积变化。',
    paramLabel: '曲面陡度',
    paramMin: 0.2, paramMax: 2, paramStep: 0.1, paramDefault: 1,
  },
  fubini1: {
    title: '富比尼定理',
    section: '富比尼定理与累次积分',
    math: '\\iint_D f(x,y)\\,d\\sigma = \\int_a^b \\left[\\int_{\\phi_1(x)}^{\\phi_2(x)} f(x,y)\\,dy\\right]dx = \\int_c^d \\left[\\int_{\\psi_1(y)}^{\\psi_2(y)} f(x,y)\\,dx\\right]dy',
    description: '富比尼定理说明，在一定条件下，二重积分可以化为两次单积分（累次积分）。可以先对 y 积分再对 x 积分，也可以先对 x 积分再对 y 积分，两种顺序的结果相同。图中同时展示两种积分顺序的切片方式。',
    paramLabel: '切片数量',
    paramMin: 3, paramMax: 20, paramStep: 1, paramDefault: 8,
  },
  stokes1: {
    title: '斯托克斯定理',
    section: '斯托克斯定理',
    math: '\\oint_C \\mathbf{F}\\cdot d\\mathbf{r} = \\iint_S (\\nabla \\times \\mathbf{F}) \\cdot d\\mathbf{S}',
    description: '斯托克斯定理将沿闭曲线 C 的环量与以 C 为边界的曲面 S 上的旋度通量联系起来。左端是向量场沿边界曲线的环量，右端是旋度场穿过曲面的通量。调整参数观察曲面变形时等式仍然成立。',
    paramLabel: '曲面变形',
    paramMin: 0.3, paramMax: 2, paramStep: 0.1, paramDefault: 1,
  },
  divergence1: {
    title: '高斯散度定理',
    section: '高斯散度定理',
    math: '\\oiint_S \\mathbf{F}\\cdot d\\mathbf{S} = \\iiint_V (\\nabla \\cdot \\mathbf{F})\\,dV',
    description: '高斯散度定理（又称散度定理）将闭曲面 S 上的通量与 S 所围体积 V 内的散度积分联系起来。对于向量场 F=(x,y,z)，散度 ∇·F=3，通量等于 4πR³。调整半径观察两种计算方式的等价性。',
    paramLabel: '球体半径',
    paramMin: 0.5, paramMax: 3, paramStep: 0.1, paramDefault: 1.5,
  },
  arc_length1: {
    title: '弧长计算',
    section: '弧长与曲线积分',
    math: 'L = \\int_a^b \\sqrt{1 + [f\'(x)]^2}\\,dx',
    description: '弧长公式将曲线的长度表示为导数大小的积分 L=∫√(1+[f\'(x)]²)dx。对于曲线 f(x)=sin(x)，随着分段数增加，折线长度趋近真实弧长。图中展示曲线、分段折线和弧长近似值。',
    paramLabel: '分段数',
    paramMin: 2, paramMax: 50, paramStep: 1, paramDefault: 8,
    viewType: '2d',
  },
  mass_center1: {
    title: '质心计算',
    section: '质心与转动惯量',
    math: '\\bar{x} = \\frac{\\iint_D x\\rho\\,d\\sigma}{\\iint_D \\rho\\,d\\sigma},\\quad \\bar{y} = \\frac{\\iint_D y\\rho\\,d\\sigma}{\\iint_D \\rho\\,d\\sigma}',
    description: '质心是密度加权平均位置。对于变密度薄片，质心坐标等于一阶矩除以总质量。图中曲面按密度着色（蓝=低密度，红=高密度），标记点为质心位置。调整密度变化率观察质心移动。',
    paramLabel: '密度变化率',
    paramMin: 0.1, paramMax: 3, paramStep: 0.1, paramDefault: 1,
  },
  moment_of_inertia1: {
    title: '转动惯量',
    section: '质心与转动惯量',
    math: 'I_x = \\iint_D y^2\\rho\\,d\\sigma,\\quad I_y = \\iint_D x^2\\rho\\,d\\sigma',
    description: '转动惯量衡量薄片绕轴旋转的惯性大小。对于变密度薄片 ρ(x,y)，绕x轴的转动惯量 Ix=∫∫y²ρ dσ，绕y轴的转动惯量 Iy=∫∫x²ρ dσ。调整参数观察密度变化对转动惯量的影响。',
    paramLabel: '密度变化率',
    paramMin: 0.1, paramMax: 3, paramStep: 0.1, paramDefault: 1,
  },
  cylindrical1: {
    title: '柱坐标计算',
    section: '柱坐标系计算',
    math: '\\int\\int\\int f(r,\\theta,z)\\,r\\,dr\\,d\\theta\\,dz',
    description: '柱坐标系下，体积元素 dV = r dr dθ dz，多出的因子 r 来自坐标变换的雅可比行列式。将直角坐标转换为柱坐标 (r,θ,z)，积分区域可简化。调整参数观察柱体区域变化。',
    paramLabel: '圆柱半径',
    paramMin: 0.5, paramMax: 2.5, paramStep: 0.1, paramDefault: 1.5,
    paramLabel2: '圆柱高度',
    paramMin2: 1, paramMax2: 4, paramStep2: 0.5, paramDefault2: 3,
  },
  gradient1: {
    title: '梯度场可视化',
    section: '梯度场与方向导数',
    math: '\\nabla f = \\left(\\frac{\\partial f}{\\partial x},\\frac{\\partial f}{\\partial y}\\right)',
    description: '梯度∇f指向函数值增长最快的方向。图中展示曲面z=f(x,y)及其在xy平面上的梯度向量场。每个箭头的方向表示最速上升方向，长度表示方向导数的最大值。调整参数观察不同曲面的梯度场变化。',
    paramLabel: '曲面陡度',
    paramMin: 0.3, paramMax: 2, paramStep: 0.1, paramDefault: 1,
  },
  spherical1: {
    title: '球坐标计算',
    section: '球坐标系计算',
    math: '\\int\\int\\int f(r,\\theta,\\phi)\\,r^2\\sin\\phi\\,dr\\,d\\theta\\,d\\phi',
    description: '球坐标系下，体积元素dV=r²sinφ dr dθ dφ，其中r为径向距离，θ为方位角，φ为极角。多出的因子r²sinφ来自坐标变换的雅可比行列式。调整参数观察球体区域变化。',
    paramLabel: '球体半径',
    paramMin: 0.5, paramMax: 2.5, paramStep: 0.1, paramDefault: 1.5,
    paramLabel2: '极角范围',
    paramMin2: 0.3, paramMax2: 3.14, paramStep2: 0.1, paramDefault2: 3.14,
  },
  laplace1: {
    title: '拉普拉斯算子与调和函数',
    section: '拉普拉斯方程',
    math: '\\Delta f = \\nabla^2 f = \\frac{\\partial^2 f}{\\partial x^2} + \\frac{\\partial^2 f}{\\partial y^2} = 0',
    description: '调和函数满足拉普拉斯方程Δf=0，即函数在某点的值等于其邻域的平均值。图中展示调和函数z=cos(x)·cosh(y)的曲面及其拉普拉斯算子的值。在调和函数上Δf=0，曲面的平均曲率性质体现为"没有局部极值"的特点。调整参数观察不同调和函数。',
    paramLabel: '振幅系数',
    paramMin: 0.3, paramMax: 2, paramStep: 0.1, paramDefault: 1,
  },
  fourier1: {
    title: '傅里叶级数逼近',
    section: '傅里叶级数与逼近',
    math: 'f(x) = \\frac{a_0}{2} + \\sum_{n=1}^{N} \\left(a_n \\cos nx + b_n \\sin nx\\right)',
    description: '傅里叶级数将周期函数分解为正弦和余弦函数的叠加。随着项数N增加，部分和逐渐逼近原函数。图中展示目标函数（红色）和傅里叶级数部分和（蓝色），下方显示各阶分量。调整参数观察逼近精度随N的变化。',
    paramLabel: '逼近项数 N',
    paramMin: 1, paramMax: 20, paramStep: 1, paramDefault: 5,
    viewType: '2d',
  },
  vector_field1: {
    title: '向量场线积分',
    section: '向量场与线积分',
    math: '\\int_C \\mathbf{F} \\cdot d\\mathbf{r} = \\int_C (P\\,dx + Q\\,dy)',
    description: '向量场的线积分计算力场沿路径所做的功。图中展示向量场F=(P,Q)和积分路径C，箭头表示场方向，颜色表示场的大小。线积分值等于路径上F·dr的总和。调整参数观察不同路径和场的变化。',
    paramLabel: '路径弯曲度',
    paramMin: 0, paramMax: 2, paramStep: 0.1, paramDefault: 1,
  },
  directional1: {
    title: '方向导数',
    section: '梯度场与方向导数',
    math: 'D_\\mathbf{u}f = \\nabla f \\cdot \\mathbf{u} = |\\nabla f|\\cos\\theta',
    description: '方向导数D_uf表示函数f沿方向u的变化率。当u与梯度方向一致时，方向导数取最大值|∇f|；当u与梯度方向垂直时，方向导数为0。图中展示曲面上的梯度向量（红色）和可旋转的方向向量u（蓝色），以及它们之间的夹角θ。右侧曲线图显示方向导数随角度θ的变化。',
    paramLabel: '方向角度 θ',
    paramMin: 0, paramMax: 6.28, paramStep: 0.1, paramDefault: 0,
    paramLabel2: '曲面陡度',
    paramMin2: 0.3, paramMax2: 2, paramStep2: 0.1, paramDefault2: 1,
  },
  isosurface1: {
    title: '等值面与等高线',
    section: '等值面与等高线',
    math: 'f(x,y,z) = c \\quad \\text{(等值面)}\\quad f(x,y) = c \\quad \\text{(等高线)}',
    description: '等值面是三维空间中函数值等于常数的曲面，等高线是二维平面上函数值等于常数的曲线。等值面可以看作是等高线在三维空间中的推广。图中展示函数f(x,y,z)=x²+y²+z²在不同常数c下的等值面（同心球面），以及f(x,y)=x²+y²在xy平面上的等高线（同心圆）。调整参数改变等值面的层次。',
    paramLabel: '等值层数',
    paramMin: 2, paramMax: 8, paramStep: 1, paramDefault: 4,
    paramLabel2: '函数类型',
    paramMin2: 0, paramMax2: 1, paramStep2: 1, paramDefault2: 0,
  },
  curl1: {
    title: '旋度场可视化',
    section: '旋度场与散度场',
    math: '\\nabla \\times \\mathbf{F} = \\left(\\frac{\\partial Q}{\\partial x} - \\frac{\\partial P}{\\partial y}\\right)\\mathbf{k}',
    description: '旋度衡量向量场在某点的旋转程度。对于二维场F=(P,Q)，旋度为∂Q/∂x - ∂P/∂y。正旋度表示逆时针旋转（红色），负旋度表示顺时针旋转（蓝色）。图中展示向量场及其旋度分布。',
    paramLabel: '场强缩放',
    paramMin: 0.3, paramMax: 2, paramStep: 0.1, paramDefault: 1,
  },
  divergence_field1: {
    title: '散度场可视化',
    section: '旋度场与散度场',
    math: '\\nabla \\cdot \\mathbf{F} = \\frac{\\partial P}{\\partial x} + \\frac{\\partial Q}{\\partial y}',
    description: '散度衡量向量场在某点的发散或汇聚程度。正散度表示源（红色向外扩散），负散度表示汇（蓝色向内汇聚），零散度表示无源场。图中展示向量场及其散度分布。',
    paramLabel: '场强缩放',
    paramMin: 0.3, paramMax: 2, paramStep: 0.1, paramDefault: 1,
  },
  conservative1: {
    title: '保守场与势函数',
    section: '保守场与势函数',
    math: '\\nabla \\times \\mathbf{F} = 0 \\Leftrightarrow \\mathbf{F} = \\nabla \\phi',
    description: '保守场是无旋的向量场（∇×F=0），等价于存在势函数φ使得F=∇φ。保守场中沿任意闭曲线的线积分为0，路径积分与路径无关。图中展示保守场F=(x, y)及其势函数φ=½(x²+y²)的等高线。',
    paramLabel: '场强缩放',
    paramMin: 0.3, paramMax: 2, paramStep: 0.1, paramDefault: 1,
  },
  surface_integral1: {
    title: '对面积的曲面积分',
    section: '曲面积分',
    math: '\\iint_\\Sigma f(x,y,z)\\,dS = \\iint_D f(x,y,g(x,y))\\sqrt{1+g_x^2+g_y^2}\\,dxdy',
    description: '对面积的曲面积分将函数值沿曲面Σ进行积分。通过参数化曲面，将曲面积分转化为二重积分。图中展示曲面Σ=z(x,y)，函数值通过颜色编码，面积元素dS=√(1+zx²+zy²)dxdy在陡峭处更大。',
    paramLabel: '曲面陡度',
    paramMin: 0.3, paramMax: 2, paramStep: 0.1, paramDefault: 1,
  },
}
