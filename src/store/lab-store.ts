import { create } from 'zustand'

export type LabMode =
  | 'step1' | 'step2' | 'step3' | 'step4'
  | 'prop1' | 'prop2' | 'prop3' | 'prop4' | 'prop5' | 'prop6' | 'prop7'
  | 'parity1' | 'parity2'
  | 'cartesian1' | 'cartesian2'
  | 'rect_approx'
  | 'sphere_cyl1' | 'sphere_cyl2'
  | 'polar1' | 'polar2'
  | 'convergence1' | 'convergence2'
  | 'triple1'
  | 'jacobian1'
  | 'green1'
  | 'surface_area1' | 'fubini1'
  | 'stokes1' | 'divergence1'
  | 'arc_length1' | 'mass_center1'
  | 'moment_of_inertia1' | 'cylindrical1'
  | 'gradient1' | 'spherical1' | 'laplace1'
  | 'fourier1' | 'vector_field1' | 'isosurface1' | 'directional1'
  | 'curl1' | 'divergence_field1'
  | 'conservative1' | 'taylor1'
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
  } catch { /* ignore */ }
  return new Set<LabMode>()
}

// Save favorites to localStorage (SSR-safe)
function saveFavorites(favorites: Set<LabMode>) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('lab-favorites', JSON.stringify([...favorites]))
  } catch { /* ignore */ }
}

interface LabState {
  mode: LabMode
  paramValue: number
  paramValue2: number
  visitedModes: Set<LabMode>
  recentModes: LabMode[]
  favorites: Set<LabMode>
  autoTourActive: boolean
  tooltip: TooltipData | null
  setMode: (mode: LabMode) => void
  setParamValue: (value: number) => void
  setParamValue2: (value: number) => void
  setAutoTourActive: (active: boolean) => void
  toggleFavorite: (mode: LabMode) => void
  hydrateFavorites: () => void
  showTooltip: (data: TooltipData) => void
  hideTooltip: () => void
}

export const useLabStore = create<LabState>((set) => ({
  mode: 'step1',
  paramValue: 2,
  paramValue2: 2,
  visitedModes: new Set<LabMode>(['step1']),
  recentModes: ['step1'] as LabMode[],
  favorites: new Set<LabMode>(),
  autoTourActive: false,
  tooltip: null,
  setMode: (mode) => {
    const info = modeInfo[mode]
    set((state) => {
      const recent = [mode, ...state.recentModes.filter(m => m !== mode)].slice(0, 10)
      return {
        mode,
        paramValue: info.paramDefault,
        paramValue2: info.paramDefault2 ?? info.paramDefault,
        visitedModes: new Set([...state.visitedModes, mode]),
        recentModes: recent,
        tooltip: null,
      }
    })
  },
  setParamValue: (paramValue) => set({ paramValue }),
  setParamValue2: (paramValue2) => set({ paramValue2 }),
  setAutoTourActive: (autoTourActive) => set({ autoTourActive }),
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
}> = {
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
  prop1: {
    title: '线性性质 - 常数倍',
    section: '二重积分基本性质',
    math: '\\iint_D kf(x,y)\\,d\\sigma = k\\iint_D f(x,y)\\,d\\sigma',
    description: '被积函数的常数因子可以提到积分号外面。图中展示了 f(x,y) 与 kf(x,y) 的曲面关系，后者高度是前者的 k 倍。',
    paramLabel: '常数 k',
    paramMin: 0.1, paramMax: 3, paramStep: 0.1, paramDefault: 2,
  },
  prop2: {
    title: '线性性质 - 加减',
    section: '二重积分基本性质',
    math: '\\iint_D [f(x,y) \\pm g(x,y)]\\,d\\sigma = \\iint_D f\\,d\\sigma \\pm \\iint_D g\\,d\\sigma',
    description: '两个函数代数和的积分等于各个函数积分的代数和。图中分别展示了 f、g 和 f+g 的曲面。',
    paramLabel: '混合系数',
    paramMin: 0, paramMax: 1, paramStep: 0.05, paramDefault: 0.5,
  },
  prop3: {
    title: '区域可加性',
    section: '二重积分基本性质',
    math: '\\iint_D f(x,y)\\,d\\sigma = \\iint_{D_1} f(x,y)\\,d\\sigma + \\iint_{D_2} f(x,y)\\,d\\sigma',
    description: '若 D = D₁ ∪ D₂ 且 D₁、D₂ 无公共内点，则整个区域上的积分等于各子区域积分之和。拖动分隔线观察区域划分。',
    paramLabel: '分割位置',
    paramMin: -2, paramMax: 2, paramStep: 0.1, paramDefault: 0,
  },
  prop4: {
    title: '常函数与面积',
    section: '二重积分基本性质',
    math: '\\iint_D c\\,d\\sigma = c \\cdot S_D',
    description: '当被积函数为常数 c 时，二重积分等于常数乘以区域 D 的面积 S_D。图中展示的是一个高度恒为 c 的平顶柱体。',
    paramLabel: '常数 c',
    paramMin: 0.5, paramMax: 4, paramStep: 0.1, paramDefault: 2,
  },
  prop5: {
    title: '比较性质',
    section: '二重积分基本性质',
    math: 'f(x,y) \\le g(x,y) \\Rightarrow \\iint_D f\\,d\\sigma \\le \\iint_D g\\,d\\sigma',
    description: '若在 D 上 f(x,y) ≤ g(x,y)，则 f 的积分不大于 g 的积分。图中蓝色曲面始终在绿色曲面之下。',
    paramLabel: '曲面间距',
    paramMin: 0.5, paramMax: 3, paramStep: 0.1, paramDefault: 1.5,
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
    description: '用 n 个矩形近似函数 f(x) 在 [a,b] 上的定积分，随着矩形数量增加，近似值趋近精确值。同时展示 2D 和 3D 视角。',
    paramLabel: '矩形数量',
    paramMin: 2, paramMax: 100, paramStep: 1, paramDefault: 10,
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
  convergence2: {
    title: '误差分析',
    section: '数值积分收敛演示',
    math: '|S_n - I| = O(1/n^2)\\quad\\text{(中点法)}',
    description: '在双对数坐标下观察误差随 n 的变化。中点法误差呈 O(1/n²) 收敛，斜率约为 -2；左端点法收敛较慢。',
    paramLabel: '最大 n',
    paramMin: 10, paramMax: 200, paramStep: 5, paramDefault: 50,
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
    math: 'L = \\int_a^b \\sqrt{1 + [f\'(x)]^2}\\,dx = \\int_a^b |\\mathbf{r}\'(t)|\\,dt',
    description: '弧长公式将曲线的长度表示为速度大小的积分。在参数曲线 r(t)=(t, 1.5sin(t), 1.5cos(t)) 上，弧长等于 |r\'(t)| 的积分。随着分段数增加，折线长度趋近真实弧长。',
    paramLabel: '分段数',
    paramMin: 2, paramMax: 50, paramStep: 1, paramDefault: 8,
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
  taylor1: {
    title: '泰勒展开逼近',
    section: '泰勒展开与逼近',
    math: 'f(x) = \\sum_{n=0}^{N} \\frac{f^{(n)}(a)}{n!}(x-a)^n',
    description: '泰勒展开将函数在某点附近用多项式逼近。随着阶数N增加，逼近范围逐渐扩大。图中展示目标函数sin(x)及其N阶泰勒多项式，观察逼近精度随N的变化。同时展示3D视角下的函数曲面和泰勒多项式曲面。',
    paramLabel: '展开阶数 N',
    paramMin: 1, paramMax: 15, paramStep: 1, paramDefault: 3,
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
