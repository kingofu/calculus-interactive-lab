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

interface LabState {
  mode: LabMode
  paramValue: number
  paramValue2: number
  visitedModes: Set<LabMode>
  autoTourActive: boolean
  setMode: (mode: LabMode) => void
  setParamValue: (value: number) => void
  setParamValue2: (value: number) => void
  setAutoTourActive: (active: boolean) => void
}

export const useLabStore = create<LabState>((set) => ({
  mode: 'step1',
  paramValue: 2,
  paramValue2: 2,
  visitedModes: new Set<LabMode>(['step1']),
  autoTourActive: false,
  setMode: (mode) => {
    const info = modeInfo[mode]
    set((state) => ({
      mode,
      paramValue: info.paramDefault,
      paramValue2: info.paramDefault2 ?? info.paramDefault,
      visitedModes: new Set([...state.visitedModes, mode]),
    }))
  },
  setParamValue: (paramValue) => set({ paramValue }),
  setParamValue2: (paramValue2) => set({ paramValue2 }),
  setAutoTourActive: (autoTourActive) => set({ autoTourActive }),
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
}
