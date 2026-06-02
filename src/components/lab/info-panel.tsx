'use client'

import { useLabStore, modeInfo, type LabMode } from '@/store/lab-store'
import { MathDisplay } from './math-display'
import { Badge } from '@/components/ui/badge'
import { useComputedValues } from '@/hooks/use-computed-values'
import { TrendingUp, Target, Calculator, Info, Sparkles, BookOpen, Zap, ChevronRight } from 'lucide-react'

// Section color configuration for badges
const sectionColors: Record<string, { bg: string; text: string; border: string; glow: string; computedBg: string; computedBorder: string }> = {
  '二重积分概念步骤': {
    bg: 'bg-emerald-100 dark:bg-emerald-900/40',
    text: 'text-emerald-800 dark:text-emerald-300',
    border: 'border-0',
    glow: 'shadow-emerald-500/20',
    computedBg: 'from-emerald-50/50 via-muted/30 to-teal-50/50 dark:from-emerald-950/20 dark:via-muted/20 dark:to-teal-950/20',
    computedBorder: 'border-emerald-200/40 dark:border-emerald-800/30',
  },
  '二重积分基本性质': {
    bg: 'bg-sky-100 dark:bg-sky-900/40',
    text: 'text-sky-800 dark:text-sky-300',
    border: 'border-0',
    glow: 'shadow-sky-500/20',
    computedBg: 'from-sky-50/50 via-muted/30 to-blue-50/50 dark:from-sky-950/20 dark:via-muted/20 dark:to-blue-950/20',
    computedBorder: 'border-sky-200/40 dark:border-sky-800/30',
  },
  '二重积分与奇偶性': {
    bg: 'bg-orange-100 dark:bg-orange-900/40',
    text: 'text-orange-800 dark:text-orange-300',
    border: 'border-0',
    glow: 'shadow-orange-500/20',
    computedBg: 'from-orange-50/50 via-muted/30 to-cyan-50/50 dark:from-orange-950/20 dark:via-muted/20 dark:to-cyan-950/20',
    computedBorder: 'border-orange-200/40 dark:border-orange-800/30',
  },
  '直角坐标系计算': {
    bg: 'bg-amber-100 dark:bg-amber-900/40',
    text: 'text-amber-800 dark:text-amber-300',
    border: 'border-0',
    glow: 'shadow-amber-500/20',
    computedBg: 'from-amber-50/50 via-muted/30 to-yellow-50/50 dark:from-amber-950/20 dark:via-muted/20 dark:to-yellow-950/20',
    computedBorder: 'border-amber-200/40 dark:border-amber-800/30',
  },
  '极坐标系计算': {
    bg: 'bg-rose-100 dark:bg-rose-900/40',
    text: 'text-rose-800 dark:text-rose-300',
    border: 'border-0',
    glow: 'shadow-rose-500/20',
    computedBg: 'from-rose-50/50 via-muted/30 to-pink-50/50 dark:from-rose-950/20 dark:via-muted/20 dark:to-pink-950/20',
    computedBorder: 'border-rose-200/40 dark:border-rose-800/30',
  },
  '矩形近似面积演示': {
    bg: 'bg-teal-100 dark:bg-teal-900/40',
    text: 'text-teal-800 dark:text-teal-300',
    border: 'border-0',
    glow: 'shadow-teal-500/20',
    computedBg: 'from-teal-50/50 via-muted/30 to-cyan-50/50 dark:from-teal-950/20 dark:via-muted/20 dark:to-cyan-950/20',
    computedBorder: 'border-teal-200/40 dark:border-teal-800/30',
  },
  '球体与圆柱面相交': {
    bg: 'bg-violet-100 dark:bg-violet-900/40',
    text: 'text-violet-800 dark:text-violet-300',
    border: 'border-0',
    glow: 'shadow-violet-500/20',
    computedBg: 'from-violet-50/50 via-muted/30 to-purple-50/50 dark:from-violet-950/20 dark:via-muted/20 dark:to-purple-950/20',
    computedBorder: 'border-violet-200/40 dark:border-violet-800/30',
  },
  '数值积分收敛演示': {
    bg: 'bg-cyan-100 dark:bg-cyan-900/40',
    text: 'text-cyan-800 dark:text-cyan-300',
    border: 'border-0',
    glow: 'shadow-cyan-500/20',
    computedBg: 'from-cyan-50/50 via-muted/30 to-teal-50/50 dark:from-cyan-950/20 dark:via-muted/20 dark:to-teal-950/20',
    computedBorder: 'border-cyan-200/40 dark:border-cyan-800/30',
  },
  '三重积分概念': {
    bg: 'bg-purple-100 dark:bg-purple-900/40',
    text: 'text-purple-800 dark:text-purple-300',
    border: 'border-0',
    glow: 'shadow-purple-500/20',
    computedBg: 'from-purple-50/50 via-muted/30 to-violet-50/50 dark:from-purple-950/20 dark:via-muted/20 dark:to-violet-950/20',
    computedBorder: 'border-purple-200/40 dark:border-purple-800/30',
  },
  '变量代换': {
    bg: 'bg-lime-100 dark:bg-lime-900/40',
    text: 'text-lime-800 dark:text-lime-300',
    border: 'border-0',
    glow: 'shadow-lime-500/20',
    computedBg: 'from-lime-50/50 via-muted/30 to-green-50/50 dark:from-lime-950/20 dark:via-muted/20 dark:to-green-950/20',
    computedBorder: 'border-lime-200/40 dark:border-lime-800/30',
  },
  '格林公式与线积分': {
    bg: 'bg-red-100 dark:bg-red-900/40',
    text: 'text-red-800 dark:text-red-300',
    border: 'border-0',
    glow: 'shadow-red-500/20',
    computedBg: 'from-red-50/50 via-muted/30 to-orange-50/50 dark:from-red-950/20 dark:via-muted/20 dark:to-orange-950/20',
    computedBorder: 'border-red-200/40 dark:border-red-800/30',
  },
  '曲面面积与弧长': {
    bg: 'bg-teal-100 dark:bg-teal-900/40',
    text: 'text-teal-800 dark:text-teal-300',
    border: 'border-0',
    glow: 'shadow-teal-500/20',
    computedBg: 'from-teal-50/50 via-muted/30 to-emerald-50/50 dark:from-teal-950/20 dark:via-muted/20 dark:to-emerald-950/20',
    computedBorder: 'border-teal-200/40 dark:border-teal-800/30',
  },
  '富比尼定理与累次积分': {
    bg: 'bg-fuchsia-100 dark:bg-fuchsia-900/40',
    text: 'text-fuchsia-800 dark:text-fuchsia-300',
    border: 'border-0',
    glow: 'shadow-fuchsia-500/20',
    computedBg: 'from-fuchsia-50/50 via-muted/30 to-violet-50/50 dark:from-fuchsia-950/20 dark:via-muted/20 dark:to-violet-950/20',
    computedBorder: 'border-fuchsia-200/40 dark:border-fuchsia-800/30',
  },
  '斯托克斯定理': {
    bg: 'bg-violet-100 dark:bg-violet-900/40',
    text: 'text-violet-800 dark:text-violet-300',
    border: 'border-0',
    glow: 'shadow-violet-500/20',
    computedBg: 'from-violet-50/50 via-muted/30 to-purple-50/50 dark:from-violet-950/20 dark:via-muted/20 dark:to-purple-950/20',
    computedBorder: 'border-violet-200/40 dark:border-violet-800/30',
  },
  '高斯散度定理': {
    bg: 'bg-orange-100 dark:bg-orange-900/40',
    text: 'text-orange-800 dark:text-orange-300',
    border: 'border-0',
    glow: 'shadow-orange-500/20',
    computedBg: 'from-orange-50/50 via-muted/30 to-amber-50/50 dark:from-orange-950/20 dark:via-muted/20 dark:to-amber-950/20',
    computedBorder: 'border-orange-200/40 dark:border-orange-800/30',
  },
  '弧长与曲线积分': {
    bg: 'bg-pink-100 dark:bg-pink-900/40',
    text: 'text-pink-800 dark:text-pink-300',
    border: 'border-0',
    glow: 'shadow-pink-500/20',
    computedBg: 'from-pink-50/50 via-muted/30 to-rose-50/50 dark:from-pink-950/20 dark:via-muted/20 dark:to-rose-950/20',
    computedBorder: 'border-pink-200/40 dark:border-pink-800/30',
  },
  '质心与转动惯量': {
    bg: 'bg-cyan-100 dark:bg-cyan-900/40',
    text: 'text-cyan-800 dark:text-cyan-300',
    border: 'border-0',
    glow: 'shadow-cyan-500/20',
    computedBg: 'from-cyan-50/50 via-muted/30 to-teal-50/50 dark:from-cyan-950/20 dark:via-muted/20 dark:to-teal-950/20',
    computedBorder: 'border-cyan-200/40 dark:border-cyan-800/30',
  },
  '柱坐标系计算': {
    bg: 'bg-sky-100 dark:bg-sky-900/40',
    text: 'text-sky-800 dark:text-sky-300',
    border: 'border-0',
    glow: 'shadow-sky-500/20',
    computedBg: 'from-sky-50/50 via-muted/30 to-blue-50/50 dark:from-sky-950/20 dark:via-muted/20 dark:to-blue-950/20',
    computedBorder: 'border-sky-200/40 dark:border-sky-800/30',
  },
  '梯度场与方向导数': {
    bg: 'bg-yellow-100 dark:bg-yellow-900/40',
    text: 'text-yellow-800 dark:text-yellow-300',
    border: 'border-0',
    glow: 'shadow-yellow-500/20',
    computedBg: 'from-yellow-50/50 via-muted/30 to-amber-50/50 dark:from-yellow-950/20 dark:via-muted/20 dark:to-amber-950/20',
    computedBorder: 'border-yellow-200/40 dark:border-yellow-800/30',
  },
  '球坐标系计算': {
    bg: 'bg-green-100 dark:bg-green-900/40',
    text: 'text-green-800 dark:text-green-300',
    border: 'border-0',
    glow: 'shadow-green-500/20',
    computedBg: 'from-green-50/50 via-muted/30 to-emerald-50/50 dark:from-green-950/20 dark:via-muted/20 dark:to-emerald-950/20',
    computedBorder: 'border-green-200/40 dark:border-green-800/30',
  },
  '拉普拉斯方程': {
    bg: 'bg-slate-100 dark:bg-slate-900/40',
    text: 'text-slate-800 dark:text-slate-300',
    border: 'border-0',
    glow: 'shadow-slate-500/20',
    computedBg: 'from-slate-50/50 via-muted/30 to-zinc-50/50 dark:from-slate-950/20 dark:via-muted/20 dark:to-zinc-950/20',
    computedBorder: 'border-slate-200/40 dark:border-slate-800/30',
  },
  '傅里叶级数与逼近': {
    bg: 'bg-orange-100 dark:bg-orange-900/40',
    text: 'text-orange-800 dark:text-orange-300',
    border: 'border-0',
    glow: 'shadow-orange-500/20',
    computedBg: 'from-orange-50/50 via-muted/30 to-amber-50/50 dark:from-orange-950/20 dark:via-muted/20 dark:to-amber-950/20',
    computedBorder: 'border-orange-200/40 dark:border-orange-800/30',
  },
  '向量场与线积分': {
    bg: 'bg-teal-100 dark:bg-teal-900/40',
    text: 'text-teal-800 dark:text-teal-300',
    border: 'border-0',
    glow: 'shadow-teal-500/20',
    computedBg: 'from-teal-50/50 via-muted/30 to-emerald-50/50 dark:from-teal-950/20 dark:via-muted/20 dark:to-emerald-950/20',
    computedBorder: 'border-teal-200/40 dark:border-teal-800/30',
  },
  '等值面与等高线': {
    bg: 'bg-cyan-100 dark:bg-cyan-900/40',
    text: 'text-cyan-800 dark:text-cyan-300',
    border: 'border-0',
    glow: 'shadow-cyan-500/20',
    computedBg: 'from-cyan-50/50 via-muted/30 to-teal-50/50 dark:from-cyan-950/20 dark:via-muted/20 dark:to-teal-950/20',
    computedBorder: 'border-cyan-200/40 dark:border-cyan-800/30',
  },
  '旋度场与散度场': {
    bg: 'bg-rose-100 dark:bg-rose-900/40',
    text: 'text-rose-800 dark:text-rose-300',
    border: 'border-0',
    glow: 'shadow-rose-500/20',
    computedBg: 'from-rose-50/50 via-muted/30 to-pink-50/50 dark:from-rose-950/20 dark:via-muted/20 dark:to-pink-950/20',
    computedBorder: 'border-rose-200/40 dark:border-rose-800/30',
  },
  '保守场与势函数': {
    bg: 'bg-emerald-100 dark:bg-emerald-900/40',
    text: 'text-emerald-800 dark:text-emerald-300',
    border: 'border-0',
    glow: 'shadow-emerald-500/20',
    computedBg: 'from-emerald-50/50 via-muted/30 to-teal-50/50 dark:from-emerald-950/20 dark:via-muted/20 dark:to-teal-950/20',
    computedBorder: 'border-emerald-200/40 dark:border-emerald-800/30',
  },
  '曲面积分': {
    bg: 'bg-violet-100 dark:bg-violet-900/40',
    text: 'text-violet-800 dark:text-violet-300',
    border: 'border-0',
    glow: 'shadow-violet-500/20',
    computedBg: 'from-violet-50/50 via-muted/30 to-purple-50/50 dark:from-violet-950/20 dark:via-muted/20 dark:to-purple-950/20',
    computedBorder: 'border-violet-200/40 dark:border-violet-800/30',
  },
  '微分中值定理': {
    bg: 'bg-red-100 dark:bg-red-900/40',
    text: 'text-red-800 dark:text-red-300',
    border: 'border-0',
    glow: 'shadow-red-500/20',
    computedBg: 'from-red-50/50 via-muted/30 to-amber-50/50 dark:from-red-950/20 dark:via-muted/20 dark:to-amber-950/20',
    computedBorder: 'border-red-200/40 dark:border-red-800/30',
  },
}

// Map of mode → related formulas (2-3 per mode)
const relatedFormulas: Record<string, { formula: string; label: string }[]> = {
  step1: [
    { formula: 'D \\subseteq \\mathbb{R}^2', label: '积分区域' },
    { formula: 'f: D \\to \\mathbb{R}', label: '被积函数' },
  ],
  step2: [
    { formula: '\\lambda = \\max_i \\text{diam}(\\Delta D_i)', label: '分割细度' },
    { formula: '\\Delta\\sigma_i = \\text{area}(\\Delta D_i)', label: '面积元素' },
  ],
  step3: [
    { formula: 'V_n = \\sum_{i=1}^{n} f(\\xi_i,\\eta_i)\\Delta\\sigma_i', label: '黎曼和' },
    { formula: '\\Delta\\sigma_i \\approx f(\\xi_i,\\eta_i) \\cdot \\Delta x \\cdot \\Delta y', label: '方柱体积' },
  ],
  step4: [
    { formula: 'V = \\iint_D f(x,y)\\,d\\sigma', label: '曲顶柱体体积' },
    { formula: '\\lambda \\to 0 \\Rightarrow S_n \\to I', label: '极限过程' },
  ],
  prop3: [
    { formula: 'D_1 \\cap D_2 = \\emptyset', label: '无公共内点' },
    { formula: 'S_D = S_{D_1} + S_{D_2}', label: '面积可加' },
  ],
  prop6: [
    { formula: 'm = \\min_D f,\\quad M = \\max_D f', label: '最值' },
    { formula: 'm \\cdot S_D \\leq V \\leq M \\cdot S_D', label: '体积范围' },
  ],
  prop7: [
    { formula: '\\exists(\\xi,\\eta) \\in D', label: '中值点存在' },
    { formula: 'f(\\xi,\\eta) = \\frac{1}{S_D}\\iint_D f\\,d\\sigma', label: '平均值' },
  ],
  parity1: [
    { formula: 'D = [-a,a]\\times[-b,b]', label: '对称区域' },
    { formula: 'f(-x,y) = -f(x,y)', label: '奇函数定义' },
  ],
  parity2: [
    { formula: '\\iint_D f\\,d\\sigma = 2\\iint_{D^+} f\\,d\\sigma', label: '偶函数性质' },
    { formula: 'f(-x,y) = f(x,y)', label: '偶函数定义' },
  ],
  cartesian1: [
    { formula: '\\int_a^b \\int_{\\phi_1(x)}^{\\phi_2(x)} f(x,y)\\,dy\\,dx', label: 'X型累次积分' },
    { formula: '\\phi_1(x) \\leq y \\leq \\phi_2(x)', label: 'y的范围' },
  ],
  cartesian2: [
    { formula: '\\int_c^d \\int_{\\psi_1(y)}^{\\psi_2(y)} f(x,y)\\,dx\\,dy', label: 'Y型累次积分' },
    { formula: '\\psi_1(y) \\leq x \\leq \\psi_2(y)', label: 'x的范围' },
  ],
  rect_approx: [
    { formula: '\\Delta x = \\frac{b-a}{n}', label: '步长' },
    { formula: 'L_n \\leq \\int_a^b f\\,dx \\leq R_n', label: '左右端点' },
  ],
  sphere_cyl1: [
    { formula: 'x^2+y^2+z^2=R^2', label: '球面方程' },
    { formula: 'x^2+y^2=a^2', label: '圆柱方程' },
  ],
  sphere_cyl2: [
    { formula: 'V = \\int A(z)\\,dz', label: '截面法' },
    { formula: 'A(z) = \\pi a^2,\\ |z| \\leq \\sqrt{R^2-a^2}', label: '截面积' },
  ],
  polar1: [
    { formula: 'x = r\\cos\\theta,\\quad y = r\\sin\\theta', label: '极坐标变换' },
    { formula: 'd\\sigma = r\\,dr\\,d\\theta', label: '面积元素' },
  ],
  polar2: [
    { formula: '\\Delta\\sigma_i \\approx r_i \\Delta r \\Delta\\theta', label: '扇形面积近似' },
    { formula: 'J = \\frac{\\partial(x,y)}{\\partial(r,\\theta)} = r', label: '雅可比行列式' },
  ],
  convergence1: [
    { formula: '|S_n - I| \\to 0', label: '收敛定义' },
    { formula: 'S_n = \\sum f(x_i,y_j)\\Delta\\sigma_{ij}', label: '黎曼和' },
  ],

  triple1: [
    { formula: '\\Delta V = \\Delta x \\Delta y \\Delta z', label: '体积元素' },
    { formula: 'f(x,y,z) = x^2+y^2+z^2', label: '被积函数' },
  ],
  jacobian1: [
    { formula: '\\left|\\frac{\\partial(x,y)}{\\partial(u,v)}\\right| = a^2', label: '雅可比值' },
    { formula: 'x = au\\cos\\theta - av\\sin\\theta', label: '变换公式' },
  ],
  green1: [
    { formula: '\\oint_C P\\,dx + Q\\,dy = \\iint_D (Q_x - P_y)\\,dA', label: '格林公式' },
    { formula: 'A = \\frac{1}{2}\\oint_C x\\,dy - y\\,dx', label: '面积公式' },
  ],
  surface_area1: [
    { formula: 'dS = \\sqrt{1+f_x^2+f_y^2}\\,dxdy', label: '面积微元' },
    { formula: '\\mathbf{n} = \\frac{(-f_x,-f_y,1)}{\\sqrt{1+f_x^2+f_y^2}}', label: '法向量' },
  ],
  fubini1: [
    { formula: '\\int_a^b\\int_{\\phi_1}^{\\phi_2} f\\,dy\\,dx = \\int_c^d\\int_{\\psi_1}^{\\psi_2} f\\,dx\\,dy', label: '交换积分序' },
    { formula: 'f \\in L^1(D)', label: '可积条件' },
  ],
  stokes1: [
    { formula: '\\nabla \\times \\mathbf{F} = \\text{curl}\\,\\mathbf{F}', label: '旋度' },
    { formula: '\\oint_C \\mathbf{F}\\cdot d\\mathbf{r}', label: '环量' },
  ],
  divergence1: [
    { formula: '\\nabla \\cdot \\mathbf{F} = \\text{div}\\,\\mathbf{F}', label: '散度' },
    { formula: '\\oiint_S \\mathbf{F}\\cdot d\\mathbf{S}', label: '通量' },
  ],
  arc_length1: [
    { formula: "ds = |\\mathbf{r}'(t)|\\,dt", label: '弧长微元' },
    { formula: 'L \\approx \\sum |\\mathbf{r}(t_{i+1})-\\mathbf{r}(t_i)|', label: '折线逼近' },
  ],
  mass_center1: [
    { formula: 'M = \\iint_D \\rho(x,y)\\,d\\sigma', label: '总质量' },
    { formula: '\\bar{x} = M_y/M,\\quad \\bar{y} = M_x/M', label: '质心坐标' },
  ],
  moment_of_inertia1: [
    { formula: 'I_x = \\iint_D y^2\\rho\\,d\\sigma', label: '绕x轴' },
    { formula: 'I_y = \\iint_D x^2\\rho\\,d\\sigma', label: '绕y轴' },
  ],
  cylindrical1: [
    { formula: 'x=r\\cos\\theta,\\quad y=r\\sin\\theta,\\quad z=z', label: '柱坐标变换' },
    { formula: 'dV = r\\,dr\\,d\\theta\\,dz', label: '体积元素' },
  ],
  gradient1: [
    { formula: '\\nabla f = (f_x, f_y)', label: '梯度定义' },
    { formula: '|\\nabla f| = \\sqrt{f_x^2+f_y^2}', label: '梯度模' },
  ],
  spherical1: [
    { formula: 'x=r\\sin\\phi\\cos\\theta,\\quad y=r\\sin\\phi\\sin\\theta,\\quad z=r\\cos\\phi', label: '球坐标变换' },
    { formula: 'dV = r^2\\sin\\phi\\,dr\\,d\\theta\\,d\\phi', label: '体积元素' },
  ],
  laplace1: [
    { formula: '\\Delta u = u_{xx}+u_{yy}=0', label: '拉普拉斯方程' },
    { formula: 'u(x,y) = \\text{Re}(e^{x+iy})', label: '调和函数构造' },
  ],
  fourier1: [
    { formula: 'a_n = \\frac{1}{\\pi}\\int_{-\\pi}^{\\pi} f(x)\\cos nx\\,dx', label: '余弦系数' },
    { formula: 'b_n = \\frac{1}{\\pi}\\int_{-\\pi}^{\\pi} f(x)\\sin nx\\,dx', label: '正弦系数' },
  ],
  vector_field1: [
    { formula: '\\mathbf{F} = (P(x,y), Q(x,y))', label: '向量场' },
    { formula: 'W = \\int_C \\mathbf{F}\\cdot d\\mathbf{r}', label: '做功' },
  ],
  directional1: [
    { formula: 'D_\\mathbf{u}f = \\nabla f \\cdot \\hat{\\mathbf{u}}', label: '方向导数' },
    { formula: 'D_\\mathbf{u}f = |\\nabla f|\\cos\\theta', label: '与梯度关系' },
  ],
  isosurface1: [
    { formula: 'f(x,y,z)=c \\Rightarrow \\text{等值面}', label: '等值面定义' },
    { formula: '\\nabla f \\perp \\text{等值面}', label: '梯度垂直等值面' },
  ],
  curl1: [
    { formula: '\\nabla \\times \\mathbf{F} = (Q_x-P_y)\\mathbf{k}', label: '二维旋度' },
    { formula: '\\text{curl} > 0: \\text{逆时针}', label: '旋度符号' },
  ],
  divergence_field1: [
    { formula: '\\nabla \\cdot \\mathbf{F} = P_x+Q_y', label: '二维散度' },
    { formula: '\\text{div}>0: \\text{源},\\quad \\text{div}<0: \\text{汇}', label: '散度含义' },
  ],
  conservative1: [
    { formula: '\\mathbf{F} = \\nabla \\phi \\Rightarrow \\nabla \\times \\mathbf{F} = 0', label: '无旋等价' },
    { formula: '\\oint_C \\mathbf{F}\\cdot d\\mathbf{r} = 0', label: '闭路径积分为零' },
  ],
  surface_integral1: [
    { formula: 'd\\mathbf{S} = \\mathbf{n}\\,dS', label: '有向面积元素' },
    { formula: '\\iint_\\Sigma f\\,dS = \\iint_D f\\sqrt{1+z_x^2+z_y^2}\\,dxdy', label: '投影法' },
  ],
  taylor1: [
    { formula: 'R_n(x) = \\frac{f^{(n+1)}(\\xi)}{(n+1)!}(x-x_0)^{n+1}', label: '拉格朗日余项' },
    { formula: '\\sin(x) = x - \\frac{x^3}{3!} + \\frac{x^5}{5!} - \\cdots', label: 'sin(x)展开' },
  ],
}

// Get the section color config, fallback to emerald
function getSectionColor(section: string) {
  return sectionColors[section] || sectionColors['二重积分概念步骤']!
}

// Map of modes in the same section for "related modes" feature
const sectionModes: Record<string, LabMode[]> = {
  '二重积分概念步骤': ['step1', 'step2', 'step3', 'step4'],
  '二重积分基本性质': ['prop3', 'prop6', 'prop7'],
  '二重积分与奇偶性': ['parity1', 'parity2'],
  '直角坐标系计算': ['cartesian1', 'cartesian2'],
  '极坐标系计算': ['polar1', 'polar2'],
  '矩形近似面积演示': ['rect_approx'],
  '球体与圆柱面相交': ['sphere_cyl1', 'sphere_cyl2'],
  '数值积分收敛演示': ['convergence1'],
  '三重积分概念': ['triple1'],
  '变量代换': ['jacobian1'],
  '格林公式与线积分': ['green1'],
  '曲面面积与弧长': ['surface_area1'],
  '富比尼定理与累次积分': ['fubini1'],
  '斯托克斯定理': ['stokes1'],
  '高斯散度定理': ['divergence1'],
  '弧长与曲线积分': ['arc_length1'],
  '质心与转动惯量': ['mass_center1', 'moment_of_inertia1'],
  '柱坐标系计算': ['cylindrical1'],
  '梯度场与方向导数': ['gradient1', 'directional1'],
  '球坐标系计算': ['spherical1'],
  '拉普拉斯方程': ['laplace1'],
  '傅里叶级数与逼近': ['fourier1'],
  '向量场与线积分': ['vector_field1'],
  '等值面与等高线': ['isosurface1'],
  '旋度场与散度场': ['curl1', 'divergence_field1'],
  '保守场与势函数': ['conservative1'],
  '曲面积分': ['surface_integral1'],
  '微分中值定理': ['rolle1', 'lagrange1', 'taylor1'],
}

export function InfoPanel() {
  const { mode, setMode } = useLabStore()
  const info = modeInfo[mode]
  const computed = useComputedValues()
  const colors = getSectionColor(info.section)

  // Find related modes (previous and next in same section)
  const sameSectionModes = sectionModes[info.section] || []
  const currentIdx = sameSectionModes.indexOf(mode)
  const prevMode = currentIdx > 0 ? sameSectionModes[currentIdx - 1] : null
  const nextMode = currentIdx < sameSectionModes.length - 1 ? sameSectionModes[currentIdx + 1] : null

  // Visually hidden description for screen readers
  const srDescription = `${info.section} - ${info.title}。${info.description}`

  return (
    <div
      role="region"
      aria-label="数学公式与描述"
      className="p-3 space-y-2.5 font-[serif] animate-[mode-switch_0.4s_ease-out]"
    >
      {/* Visually hidden mode description for screen readers */}
      <div className="sr-only" aria-live="polite">
        {srDescription}
      </div>
      {/* Title row with section-colored badge and mode title */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0 gap-1 shadow-sm", colors.bg, colors.text, colors.border)}>
          <BookOpen className="h-2.5 w-2.5" />
          {info.section}
        </Badge>
        <h3 className="text-xs font-bold text-foreground flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-amber-500" />
          {info.title}
        </h3>
      </div>

      {/* Math formula with animated border glow */}
      <div
        aria-live="polite"
        className={cn(
          "relative bg-gradient-to-r from-muted/60 via-muted/40 to-muted/60 dark:from-muted/35 dark:via-muted/25 dark:to-muted/35 rounded-lg p-3 overflow-x-auto border border-border/40 shadow-sm",
          "transition-shadow duration-1000",
          "hover:shadow-md", colors.glow
        )}
      >
        {/* Animated border glow effect */}
        <div className="absolute inset-0 rounded-lg pointer-events-none animate-[glow-pulse_3s_ease-in-out_infinite] border border-transparent"
          style={{
            boxShadow: `inset 0 0 8px rgba(16, 185, 129, 0.1), 0 0 8px rgba(16, 185, 129, 0.05)`,
          }}
        />
        <div className="absolute top-1 left-2 flex items-center gap-0.5">
          <Zap className="h-2 w-2 text-amber-500/60" />
          <span className="text-[8px] text-muted-foreground/60 font-medium font-sans">公式</span>
        </div>
        <MathDisplay math={info.math} display className="text-center mt-1" />
      </div>

      {/* Description */}
      <p className="text-[11px] text-muted-foreground leading-relaxed bg-background/30 rounded-md px-2 py-1.5 border border-border/20">
        {info.description}
      </p>

      {/* Related Formulas section */}
      {relatedFormulas[mode] && relatedFormulas[mode].length > 0 && (
        <div className={cn(
          "rounded-lg p-2 space-y-1.5 border",
          colors.computedBg, colors.computedBorder
        )}>
          <div className="flex items-center gap-1">
            <Zap className="h-2.5 w-2.5 text-amber-500/70" />
            <span className="text-[9px] font-semibold text-muted-foreground">相关公式</span>
          </div>
          <div className="space-y-1">
            {relatedFormulas[mode].map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 bg-background/40 rounded px-1.5 py-1 border border-border/15">
                <span className="text-[8px] text-muted-foreground/60 shrink-0 pt-0.5 min-w-[40px] text-right font-sans">
                  {item.label}
                </span>
                <MathDisplay math={item.formula} className="text-[11px]" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Computed values section with section-colored styling */}
      {computed && (
        <div className={cn(
          "bg-gradient-to-br rounded-lg p-2.5 space-y-1.5 border shadow-sm",
          colors.computedBg, colors.computedBorder
        )}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Calculator className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-[11px] font-bold text-foreground">{computed.label}</span>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {/* Main value */}
            <div className="flex items-center justify-between gap-1">
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <TrendingUp className="h-2.5 w-2.5" />
                计算值
              </span>
              <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded-md shadow-sm">
                {computed.mainValue}
              </span>
            </div>

            {/* Exact value */}
            <div className="flex items-center justify-between gap-1">
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Target className="h-2.5 w-2.5" />
                精确值
              </span>
              <span className="text-[11px] font-mono text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 px-1.5 py-0.5 rounded-md shadow-sm">
                {computed.exactValue}
              </span>
            </div>

            {/* Approx value (if different) */}
            {computed.approxValue !== computed.mainValue && (
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] text-muted-foreground">近似值</span>
                <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded-md shadow-sm">
                  {computed.approxValue}
                </span>
              </div>
            )}

            {/* Error */}
            {computed.error !== '—' && computed.error !== '0' && (
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] text-muted-foreground">误差</span>
                <span className={cn(
                  "text-[11px] font-mono px-1.5 py-0.5 rounded-md shadow-sm",
                  parseFloat(computed.error) < 0.01
                    ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30"
                    : parseFloat(computed.error) < 0.1
                      ? "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30"
                      : "text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/30"
                )}>
                  {computed.error}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Related modes hint */}
      {(prevMode || nextMode) && (
        <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground bg-background/30 rounded-md px-2 py-1.5 border border-border/20 font-sans">
          <span className="flex items-center gap-1 shrink-0">
            <Info className="h-2.5 w-2.5" />
            同节模式:
          </span>
          <div className="flex items-center gap-1">
            {prevMode && (
              <button
                type="button"
                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setMode(prevMode)}
              >
                <ChevronRight className="h-2.5 w-2.5 rotate-180" />
                {modeInfo[prevMode].title}
              </button>
            )}
            {prevMode && nextMode && <span className="text-muted-foreground/30">|</span>}
            {nextMode && (
              <button
                type="button"
                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setMode(nextMode)}
              >
                {modeInfo[nextMode].title}
                <ChevronRight className="h-2.5 w-2.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ')
}
