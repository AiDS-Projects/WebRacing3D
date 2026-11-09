# PRD — 初始化项目脚手架与技术栈

> 所属需求：WebRacing3D 可玩原型 — 核心玩法验证

## 用户故事
As a WebRacing3D 开发人员，I want 一个基于 Vite + TypeScript + Three.js 的标准化项目骨架（包含目录结构、类型定义、共享工具层与统一入口），So that 后续的赛道、赛车、物理、计时、UI 等玩法模块可以在统一约定下并行开发，避免重复造轮子。

## 功能需求
1. 项目初始化：使用 Vite + TypeScript 模板创建项目，package.json 声明依赖（three、@types/three、typescript、vite），锁定 Node ≥ 18 与 npm 包管理器。
2. Three.js 集成：安装 three 与 @types/three，提供统一渲染器/场景/相机创建入口，避免各模块各自 new。
3. 目录结构：建立约定目录 —— src/core（游戏主循环、时钟、渲染器管理）、src/utils（共享工具函数）、src/types（全局类型定义）、src/scene（场景装配）、src/config（常量与参数配置）。
4. 类型定义：在 src/types 下定义全局共享类型（如游戏状态、输入、车辆、赛道点等基础 interface/type），供后续模块引用。
5. 共享工具层：沉淀通用工具函数（数学向量/角度换算、事件总线、DeltaTime 时钟、DOM 工具等），提供统一导出入口 src/utils/index.ts。
6. 游戏主循环骨架：实现 requestAnimationFrame 驱动的循环框架，暴露 update/render 钩子，支持后续模块注册。
7. 配置规范：启用 tsconfig strict 模式、noImplicitAny、noUnusedLocals，配置 ESLint（no-explicit-any 规则），统一路径别名（@/ 映射到 src/）。
8. 统一入口：src/main.ts 作为唯一入口，初始化渲染器、场景、相机与主循环，渲染一个最小可验证的空白 Three.js 场景。

## 验收标准
1. 执行 npm install 后依赖安装成功率 = 100%，无 peer dependency 冲突报错。
2. 执行 npm run dev 后 5s 内 dev server 启动，浏览器访问默认端口（5173）页面能渲染出一个非空白的 Three.js 场景（含相机与渲染器初始化成功），控制台 error 级日志数 = 0。
3. 执行 npx tsc --noEmit 编译错误数 = 0，tsconfig 中 strict、noImplicitAny、noUnusedLocals 均为 true。
4. 执行 npm run build 构建成功，产物输出到 dist/ 目录，构建 warning 数 = 0。
5. 执行 npm run lint（ESLint）error 级告警数 = 0，no-explicit-any 规则开启，全仓库 any 出现次数 = 0。
6. 目录结构完整：src/core、src/utils、src/types、src/scene、src/config 五个目录均存在且含 index.ts 出口文件。
7. 共享工具函数（数学换算、事件总线、DeltaTime 时钟）配套单元测试，测试用例数 ≥ 6，通过率 = 100%。
8. 主循环以 requestAnimationFrame 驱动，渲染帧率在空白场景下稳定 ≥ 60fps（60s 采样平均值）。
9. 路径别名 @/ 生效：任意模块 import 共享工具时使用 @/utils 路径，编译与运行时均无模块解析错误。

## 边界条件（不做的事）
不包含：玩家赛车模型与第三人称视角跟随；赛道（路面/路肩/护栏/草地）建模；物理系统（加速/刹车/转向/打滑/碰撞）；起点线检测与单圈计时逻辑；速度表、圈数、计时器等 HUD UI；触屏虚拟按键；开始/重置界面。
暂不支持：后端服务、账号系统、网络联机、远程数据加载。
超出范围：任何美术资产（模型、贴图、音效、粒子）的导入与使用；性能优化（本工单仅验证渲染管线可用）；对外发布的打包发布配置（仅本地构建验证）。

## 资产需求线索
暂无
