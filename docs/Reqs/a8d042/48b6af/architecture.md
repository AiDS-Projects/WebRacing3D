# 架构设计 - 初始化项目脚手架与技术栈

## 架构模式
分层模块化架构（Layer-based Modular）：配置/构建层 → 入口引导层 → 共享类型层 → 共享工具层 → 领域模块层（camera/physics/player/race/track）

## 技术栈

- **build_tool**: Vite 5.x（原生 TS + HMR，适合原型快速迭代）
- **language**: TypeScript 5.x（strict 模式开启）
- **renderer**: Three.js（r160+，WebGL2 渲染）
- **type_defs**: @types/three 与运行时版本锁定一致
- **test**: Playwright（E2E 浏览器验收）
- **package_manager**: npm（锁定 lockfile）
- **path_alias**: @/ 指向 src/，避免深层相对路径
- **target**: ES2020+，浏览器直接运行无需后端

## 模块设计

### 配置与构建层
职责: 声明依赖与脚本、TS 编译配置、Vite 构建/别名配置、HTML 画布容器、E2E 测试配置

### 入口引导层
职责: 应用装配（composition root）：初始化渲染器/场景/游戏循环，绑定输入，驱动各领域模块，不承载业务逻辑

### 共享类型层
职责: 纯类型/接口/常量定义，供各领域模块与工具层引用，禁止引入运行时依赖

### 共享工具层
职责: 跨模块复用的纯函数工具：数学运算与时间/时钟管理，沉淀公共逻辑避免重复实现

### 领域模块层（占位，后续工单实现）
职责: 具体玩法逻辑：相机、物理、玩家赛车、计时圈数、赛道构建，均依赖共享类型层与工具层

## 关键决策
- 采用 Vite + TypeScript 而非 webpack/纯静态：TS 原生支持、HMR 快、零配置适合快速原型验证
- 采用分层模块化架构，配置/入口/类型/工具/领域五层解耦，领域模块只依赖类型层与工具层，禁止反向依赖
- 类型层（types/）只放纯类型与常量，禁止引入运行时代码，从根本上避免类型与实现间的循环依赖
- 路径别名 @/ 指向 src/，领域模块互引用统一从 @/ 导入，降低深层相对路径维护成本
- 共享工具 math/time 独立成模块，满足 shared-logic-first 规范（clamp/lerp/角度归一化/Clock 跨模块复用）
- 入口 main.ts 仅做 composition root 装配，不写业务逻辑，保证后续工单可并行落地领域模块
- 使用 Playwright 做浏览器 E2E 验收，webServer 自动拉起 dev server，验证「浏览器打开即可玩」
- 增量原则：已有 FollowCamera.ts / VehiclePhysics.ts 不推翻，仅补齐其依赖的类型与工具层并保留入口衔接
