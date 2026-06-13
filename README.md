# Calculus Interactive Laboratory | 微积分互动实验室

> [!IMPORTANT]
> **声明**：本项目仅作为一个演示 Demo（演示原型），用于展示微积分的可视化交互与多维场景渲染能力。

一个基于 **Next.js**、**React Three Fiber (R3F)** 和 **Three.js** 开发的高可视化、交互式微积分学习与教学实验室。

它通过 3D 渲染和实时交互参数，帮助学生和研究人员直观理解微积分的核心概念、定理以及多元微积分的物理/空间几何意义。

---

## 🚀 项目亮点

- **丰富的互动模式**：涵盖一元微积分（极限、连续性、导数、微分中值定理、泰勒展开、积分、旋转体体积等）与多元微积分（重积分、雅可比矩阵、柱/球面坐标转换、向量场、散度、旋度、格林公式、斯托克斯公式等）共计近 60 种可视化模式。
- **三维动态交互 (3D Vis)**：基于 React Three Fiber，提供丝滑的 3D 视角旋转、参数调节、以及实时计算渲染。
- **完善的键盘快捷键**：全面支持键盘快捷操作，方便演示与教学讲解。
- **轻量本地化数据库**：基于 Prisma + SQLite，存储用户收藏与学习状态。
- **现代化 UI**：采用 Tailwind CSS 和 Shadcn UI，适配深色与浅色模式。

---

## 🛠️ 技术栈

- **前端框架**：Next.js 16 (App Router)
- **3D 渲染**：Three.js, `@react-three/fiber`, `@react-three/drei`
- **数学公式**：KaTeX
- **动画效果**：Framer Motion
- **状态管理**：Zustand
- **数据库 & ORM**：Prisma + SQLite
- **UI 样式**：Tailwind CSS + Shadcn UI
- **运行环境**：Bun (推荐) 或 Node.js

---

## 🏁 快速本地启动

按照以下步骤在本地运行项目：

### 1. 安装依赖
由于项目依赖包已锁定，推荐使用 **Bun** 进行安装：
```bash
bun install
```
*（若本地未安装 Bun，也可以使用 `npm install`）*

### 2. 初始化数据库并生成 Prisma 客户端
运行以下命令以生成本地 SQLite 客户端：
```bash
bun run db:generate
# 若使用 npm: npx prisma generate
```

### 3. 运行开发服务器
```bash
bun run dev
# 若使用 npm: npm run dev
```

运行成功后，在浏览器中打开：[http://localhost:3000](http://localhost:3000)。

---

## ⌨️ 快捷键指南

在实验室内，您可以使用以下键盘快捷键辅助交互：

| 快捷键 | 功能描述 |
| :--- | :--- |
| `↑ / ↓` | 切换上一个/下一个微积分演示模式 |
| `← / →` | 实时调整当前模式下的数学参数值 |
| `R` | 重置当前参数 / 停止自动播放导览 |
| `T` | 开启/关闭自动导览模式 |
| `F` | 收藏/取消收藏当前模式 |
| `Space` | 展开/收起详情面板 |
| `D` | 切换深色/浅色模式 (Dark/Light Mode) |
| `S` | 截图并保存当前 3D 视图 |
| `A` | 切换自动旋转 / 固定视角 |
| `P` | 播放/暂停当前概念的步骤动画 |
| `?` | 弹出快捷键帮助菜单 |

---

## 📂 项目结构

```text
├── db/                     # 本地 SQLite 数据库
├── prisma/                 # Prisma Schema 定义
├── public/                 # 静态资源
├── src/
│   ├── app/                # Next.js 页面与路由
│   ├── components/         # 3D 视口、侧边栏、控制面板及 UI 组件
│   ├── hooks/              # 自定义 React Hooks
│   ├── lib/                # 工具函数
│   └── store/              # Zustand 状态管理
├── package.json            # 依赖与脚本配置
└── tailwind.config.ts      # Tailwind 配置
```
