# PRD — 初始化项目脚手架与技术栈

> 所属需求：WebRacing3D 可玩原型 — 核心玩法验证

## 用户故事
As a 开发者，I want 一套 Vite + TypeScript + Three.js 的项目脚手架与分层模块化目录结构、统一类型定义和共享工具层，So that 后续 camera/physics/UI 等领域模块能以统一入口接入开发，避免各自重复搭建基础能力。

## 功能需求
1. 构建骨架：使用 Vite + TypeScript + Three.js 建立可运行项目，package.json 提供 dev/build/typecheck 脚本，无后端与网络依赖。\n2. 分层目录：按「配置/构建层 → 入口引导层 → 共享类型层 → 共享工具层 → 领域模块层」建立目录结构，领域模块预留 camera/physics/track/ui 空目录。\n3. 入口引导：提供统一入口 main.ts，初始化 Three.js 渲染器、场景、相机与渲染循环，页面加载后显示一个可渲染的 Canvas 占位场景。\n4. 共享类型层：集中定义全局共享类型（如车辆状态、输入状态、游戏阶段枚举、Vec3 等），供后续模块复用。\n5. 共享工具层：沉淀通用工具函数（如数学/时间/循环时钟等），禁止业务模块内联重复逻辑。\n6. 代码质量：启用 TypeScript strict 模式，配置 ESLint（含禁用 any 的规则），类型安全边界与共享逻辑优先规范落地。\n7. 模块入口约定：各领域模块通过统一的 index 导出，main.ts 仅做装配，不写业务逻辑。

## 验收标准
- [ ] 执行 `npm install` 后执行 `npm run dev`，10s 内本地开发服务器可访问，页面渲染出 Three.js 的 <canvas> 元素。\n- [ ] 执行 `npm run typecheck`，TypeScript 报错 0 条，退出码为 0。\n- [ ] 执行 `npm run build`，构建成功产出 dist/ 目录，无构建错误与警告。\n- [ ] 项目根目录下包含以下目录且结构完整：src/config、src/entry、src/shared/types、src/shared/utils、src/modules/camera、src/modules/physics、src/modules/track、src/modules/ui。\n- [ ] 共享类型层 src/shared/types 至少导出 3 个类型（如 Vec3、VehicleState、InputState），被入口或模块引用且编译通过。\n- [ ] 共享工具层 src/shared/utils 至少沉淀 2 个工具函数（如时钟/循环、数学辅助），且无业务模块内联重复实现。\n- [ ] 全项目经 ESLint 检查，`any` 类型违规 0 处，`as` 断言违规 0 处。\n- [ ] 入口 main.ts 中不包含任何领域业务逻辑（无物理、赛道、UI 相关实现代码），仅做模块装配与渲染初始化。\n- [ ] 浏览器打开页面后 3s 内完成渲染循环启动（requestAnimationFrame 运行），无控制台报错。

## 边界条件（不做的事）
不包含：赛车物理/碰撞、赛道生成、玩家输入映射、计时与圈数、游戏 UI（速度表/开始界面）等核心玩法实现。\n不包含：后端服务、账号体系、网络同步、多人联机。\n不包含：真实游戏美术资产与音效资源（仅占位/空场景）。\n不包含：性能优化专项（如 LOD、资源按需加载）、测试框架与单元测试用例。\n超出范围：任何超出「可运行脚手架 + 目录/类型/工具层 + 空场景冒烟渲染」的工程化或玩法功能。

## 资产需求线索
暂无
