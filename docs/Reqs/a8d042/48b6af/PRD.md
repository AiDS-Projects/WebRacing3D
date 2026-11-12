# PRD — 初始化项目脚手架与技术栈

> 所属需求：WebRacing3D 可玩原型 — 核心玩法验证

## 用户故事
As a 开发者，I want 一个可一键启动/构建的 Vite + TypeScript + Three.js 项目骨架（含目录结构、共享类型层、共享工具层与统一入口），So that 后续 physics/camera/ui 等领域模块能在类型安全、无重复逻辑的前提下并行开发，无需各自重复搭建基础设施。

## 功能需求
功能点 1：基于 Vite 初始化 TypeScript 项目，配置 tsconfig（strict 模式）、vite.config.ts、package.json 脚本（dev/build/preview），dev 与 build 命令可直接运行。
功能点 2：引入 Three.js 依赖，建立 WebGL 渲染入口模块（Canvas 挂载、渲染循环、resize 处理），作为后续场景与赛道渲染的启动引导层。
功能点 3：建立分层目录结构：config/（构建与环境配置）、entry/（入口引导）、shared/types/（共享类型定义）、shared/utils/（共享工具函数）、domain/（physics、camera 等领域模块占位）。
功能点 4：建立共享类型层，定义核心领域类型（如 Vec3、GameState、InputState 等），统一从 shared/types 导出，禁止业务模块内联定义重复类型。
功能点 5：建立共享工具层，沉淀通用函数（如时间格式化、数值钳制 clamp、数学辅助等），禁止在业务模块内联重复逻辑。
功能点 6：建立统一 api/ 模块入口（当前为本地单机占位），禁止业务模块直接 fetch 或硬编码 base URL，改用环境变量注入。
功能点 7：配置环境变量机制（.env / import.meta.env），API base URL 等可变项从环境变量读取，源码内无硬编码。

## 验收标准
- [ ] 执行 `npm run dev` 后开发服务器成功启动，浏览器访问默认端口可加载出空白页面且控制台无报错，启动耗时 ≤ 10s。
- [ ] 执行 `npm run build` 构建成功，退出码为 0，产物输出到 dist/ 目录。
- [ ] 执行 `npx tsc --noEmit` 类型检查通过，报错数为 0。
- [ ] 全量源码（src/）中 `any` 类型出现次数 = 0，`as` 断言仅在注释说明场景使用。
- [ ] 目录结构中存在 config/、entry/、shared/types/、shared/utils/、domain/ 五个目录，且各目录包含对应入口文件。
- [ ] 共享工具函数（clamp、formatTime 等）位于 shared/utils/ 且被导出，业务模块可通过统一入口 import。
- [ ] 源码中不出现硬编码的 API base URL 或网络地址，所有可变配置来自环境变量。
- [ ] Three.js 渲染循环可正常初始化 Canvas 并持续渲染，窗口 resize 后 Canvas 尺寸自动适配。
- [ ] 所有 export 的公共类型/函数均有 TypeScript 类型声明，无隐式 any 报错。

## 边界条件（不做的事）
不包含：赛道模型、赛车模型、物理引擎、计时圈数、UI 界面等任何游戏玩法逻辑（本工单仅脚手架）。
不包含：后端服务、账号系统、网络请求实现（api/ 模块仅提供本地占位与统一入口约定）。
不包含：真实游戏资产（模型、贴图、音效），仅保留占位目录与空入口。
超出范围：性能优化、渲染特效、碰撞检测等游戏功能实现。

## 资产需求线索
暂无
