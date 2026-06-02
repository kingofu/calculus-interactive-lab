import type { LabMode } from '@/store/lab-store'

export interface Preset {
  name: string
  param1: number
  param2?: number
  emoji: string
}

export const modePresets: Partial<Record<LabMode, Preset[]>> = {
  limit1: [
    { name: '慢收敛', param1: 0.5, emoji: '🐢' },
    { name: '标准', param1: 2, emoji: '🐇' },
    { name: '快收敛', param1: 5, emoji: '🚀' },
  ],
  limit2: [
    { name: '小ε', param1: 0.1, emoji: '🔍' },
    { name: '中等ε', param1: 0.5, emoji: '🔭' },
    { name: '大ε', param1: 1.0, emoji: '🌐' },
  ],
  derivative1: [
    { name: '近似切线', param1: 0.05, emoji: '📍' },
    { name: '割线', param1: 0.5, emoji: '📏' },
    { name: '远割线', param1: 2, emoji: '📐' },
  ],
  derivative2: [
    { name: '左侧', param1: -1.5, emoji: '◀️' },
    { name: '原点', param1: 0, emoji: '⭕' },
    { name: '右侧', param1: 1.5, emoji: '▶️' },
  ],
  derivative3: [
    { name: '小增量', param1: 1.5, param2: 0.1, emoji: '🔬' },
    { name: '标准', param1: 1.5, param2: 0.5, emoji: '📐' },
    { name: '大增量', param1: 1.5, param2: 1.5, emoji: '📏' },
  ],
  rolle1: [
    { name: '扁平', param1: 0.3, emoji: '〰️' },
    { name: '标准', param1: 1, emoji: '📈' },
    { name: '陡峭', param1: 2, emoji: '🏔️' },
  ],
  lagrange1: [
    { name: '扁平', param1: 0.3, emoji: '〰️' },
    { name: '标准', param1: 1, emoji: '📈' },
    { name: '陡峭', param1: 2, emoji: '🏔️' },
  ],
  indef_integral1: [
    { name: '少曲线', param1: 3, emoji: '🔵' },
    { name: '中等', param1: 7, emoji: '🟢' },
    { name: '多曲线', param1: 12, emoji: '🔴' },
  ],
  ftc1: [
    { name: '左侧', param1: -1.5, emoji: '◀️' },
    { name: '中间', param1: 0.5, emoji: '⭕' },
    { name: '右侧', param1: 2, emoji: '▶️' },
  ],
  mean_value_integral1: [
    { name: '平坦', param1: 0.3, emoji: '〰️' },
    { name: '标准', param1: 1, emoji: '📊' },
    { name: '陡峭', param1: 2, emoji: '📈' },
  ],
  area1: [
    { name: '靠近', param1: 0.3, emoji: '🤏' },
    { name: '标准', param1: 1, emoji: '📐' },
    { name: '远离', param1: 2, emoji: '↔️' },
  ],
  volume_rev1: [
    { name: '矮小', param1: 0.5, param2: 5, emoji: '🥫' },
    { name: '标准', param1: 1.5, param2: 8, emoji: '🏺' },
    { name: '高大', param1: 2.5, param2: 15, emoji: '🗼' },
  ],
  step1: [
    { name: '小区域', param1: 1.5, emoji: '🔹' },
    { name: '中区域', param1: 2, emoji: '🔷' },
    { name: '大区域', param1: 3.5, emoji: '⬛' },
  ],
  step3: [
    { name: '粗略', param1: 4, emoji: '🧊' },
    { name: '中等', param1: 10, emoji: '📦' },
    { name: '精细', param1: 18, emoji: '🧱' },
  ],
  step4: [
    { name: '粗略', param1: 10, emoji: '📉' },
    { name: '中等', param1: 25, emoji: '📊' },
    { name: '精细', param1: 45, emoji: '📈' },
  ],
  prop1: [
    { name: '缩小', param1: 0.5, emoji: '🔍' },
    { name: '标准', param1: 1.5, emoji: '⚖️' },
    { name: '放大', param1: 2.8, emoji: '🔎' },
  ],
  convergence1: [
    { name: '粗糙', param1: 5, emoji: '1️⃣' },
    { name: '中等', param1: 30, emoji: '5️⃣' },
    { name: '精细', param1: 80, emoji: '🔟' },
  ],
  rect_approx: [
    { name: '粗略', param1: 5, emoji: '◼️' },
    { name: '中等', param1: 20, emoji: '▪️' },
    { name: '精细', param1: 60, emoji: '◾' },
  ],
  polar2: [
    { name: '粗略', param1: 4, emoji: '🔵' },
    { name: '中等', param1: 10, emoji: '🟢' },
    { name: '精细', param1: 18, emoji: '🔴' },
  ],
  triple1: [
    { name: '粗略', param1: 3, emoji: '🧊' },
    { name: '中等', param1: 5, emoji: '📦' },
    { name: '精细', param1: 8, emoji: '🧱' },
  ],
  fubini1: [
    { name: '少切片', param1: 4, emoji: '🥪' },
    { name: '中等', param1: 8, emoji: '🍔' },
    { name: '多切片', param1: 16, emoji: '🌮' },
  ],
  fourier1: [
    { name: '1阶', param1: 1, emoji: '〰️' },
    { name: '5阶', param1: 5, emoji: '📈' },
    { name: '10阶', param1: 10, emoji: '📊' },
    { name: '15阶', param1: 15, emoji: '📉' },
  ],
  arc_length1: [
    { name: '粗略', param1: 4, emoji: '📏' },
    { name: '中等', param1: 15, emoji: '📐' },
    { name: '精细', param1: 40, emoji: '✏️' },
  ],
  sphere_cyl1: [
    { name: '小柱细管', param1: 1, param2: 2, emoji: '🔵' },
    { name: '标准', param1: 1.5, param2: 2.5, emoji: '🟢' },
    { name: '大柱粗管', param1: 2, param2: 3, emoji: '🔴' },
  ],
  green1: [
    { name: '紧凑', param1: 0.5, emoji: '🔵' },
    { name: '标准', param1: 1, emoji: '🟢' },
    { name: '展开', param1: 1.8, emoji: '🔴' },
  ],
  gradient1: [
    { name: '平坦', param1: 0.5, emoji: '🏔️' },
    { name: '标准', param1: 1, emoji: '🌋' },
    { name: '陡峭', param1: 1.8, emoji: '⛰️' },
  ],
  spherical1: [
    { name: '半球', param1: 1.5, param2: 1.57, emoji: '🌙' },
    { name: '全球', param1: 1.5, param2: 3.14, emoji: '🌍' },
    { name: '大球', param1: 2.2, param2: 3.14, emoji: '🪐' },
  ],
  laplace1: [
    { name: '微调', param1: 0.5, emoji: '🌊' },
    { name: '标准', param1: 1, emoji: '💧' },
    { name: '强调', param1: 1.8, emoji: '🌀' },
  ],
  cylindrical1: [
    { name: '矮胖', param1: 2, param2: 1.5, emoji: '🥫' },
    { name: '标准', param1: 1.5, param2: 3, emoji: '🧪' },
    { name: '高瘦', param1: 0.8, param2: 4, emoji: '🗼' },
  ],
  mass_center1: [
    { name: '均匀', param1: 0.2, emoji: '⚖️' },
    { name: '标准', param1: 1, emoji: '📏' },
    { name: '高偏', param1: 2.5, emoji: '📐' },
  ],
  surface_area1: [
    { name: '平坦', param1: 0.4, emoji: '🟩' },
    { name: '标准', param1: 1, emoji: '🟨' },
    { name: '陡峭', param1: 1.8, emoji: '🟥' },
  ],
}
