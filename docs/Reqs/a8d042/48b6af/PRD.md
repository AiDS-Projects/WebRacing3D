# PRD — 初始化项目脚手架与技术栈

> 所属需求：WebRacing3D 可玩原型 — 核心玩法验证

## 用户故事
As a 游戏开发者，I want 一个可直接运行的 Vite + TypeScript + Three.js 项目骨架，So that 后续赛道、物理、UI 等模块能在统一的目录结构、类型定义与共享工具层之上并行开发，避免重复搭建与命名冲突。

## 功能需求
1. 项目脚手架：使用 Vite 构建工具初始化 TypeScript 项目，安装并锁定 three 依赖（版本写入 package.json），支持 npm run dev 本地启动、npm run build 生产构建、npm run preview 预览。
2. 目录结构：按需求建立分层目录 —— src/main.ts（入口）、src/core/（核心：场景/渲染循环/相机）、src/types/（类型定义）、src/utils/（共享工具）、src/domain/（领域模块预留：track/vehicle/physics/ui 空目录或占位）。
3. 类型定义：在 src/types/ 下建立基础类型（如 Vec3、游戏状态枚举、配置接口），禁止 any，全部使用 interface/type 严格声明。
4. 共享工具层：在 src/utils/ 下沉淀通用工具（如时间格式化 formatTime、数学工具 clamp/lerp、随机数），供后续模块统一引用。
5. 渲染入口：main.ts 初始化 Three.js 场景（Scene、PerspectiveCamera、WebGLRenderer），挂载 canvas 到页面，启动 requestAnimationFrame 渲染循环，并提供 resize 自适应窗口。
6. 编码规范落地：配置 ESLint + TypeScript strict 模式，确保编译零 any、零类型错误；配置统一路径别名（如 @/ 指向 src/）。
7. 启动页占位：提供 index.html 与基础样式，页面加载后显示渲染画布与「初始化完成」状态。

## 验收标准
1. 在项目根目录执行 npm install 后无报错，依赖安装成功，node_modules 生成完整。
2. 执行 npm run dev 后，浏览器访问本地地址（默认 http://localhost:5173）能在 3s 内打开页面，页面中显示一个可渲染的 Three.js 画布（非白屏）。
3. 执行 npm run build 后，构建成功，控制台无 TypeScript 类型错误与 ESLint 错误，退出码为 0。
4. 源码中全局搜索 any 类型数量 = 0（通过 ESLint no-explicit-any 规则校验通过）。
5. src/ 目录包含 main.ts、core/、types/、utils/、domain/ 五个指定层级，缺失任一层级即判失败。
6. utils/ 下存在 formatTime、clamp 两个可导出的纯函数，调用后返回结果符合预期（formatTime(65000) 返回 '01:05'，clamp(150, 0, 100) 返回 100）。
7. 浏览器窗口从 1280x720 缩放至 800x600 时，canvas 尺寸随窗口同步变化，画布无拉伸变形。
8. 渲染循环启动后，页面帧率稳定在 ≥ 55fps（使用 rAF 计数，连续 5s 平均值）。
9. 路径别名 @/ 生效：在 main.ts 中通过 import { clamp } from '@/utils/math' 能正常导入并运行，无模块解析错误。
10. 代码标识符全部为英文（变量/函数/类/文件/目录名），全局搜索无中文字符出现在标识符中。

## 边界条件（不做的事）
不包含：赛道模型、车辆模型、物理引擎、计时器与圈数逻辑、UI 界面（速度表/圈数/结算界面）、触屏虚拟按键、音频等具体游戏功能实现，以上均由后续工单完成。
不包含：任何后端服务、账号系统、网络请求、数据持久化与多人联机。
不包含：性能优化专项（LOD、遮挡剔除、资产压缩）与移动端适配专项。
暂不支持：非 Vite 的构建工具（Webpack/Rollup 独立配置）；TypeScript 以外的脚本语言。
超出范围：不引入 UI 框架（React/Vue）、状态管理库（Zustand/Redux）、物理库（cannon-es/rapier），仅保留 three 为唯一运行时依赖，避免过度设计。

## 资产需求线索
暂无
