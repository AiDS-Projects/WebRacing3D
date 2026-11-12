# 架构设计 - 初始化项目脚手架与技术栈

## 架构模式
分层模块化架构（Layer-based Modular）：配置/构建层 → 入口引导层 → 共享类型层 → 共享工具层 → 领域模块层（physics/camera/player/race/track）。本工单仅负责前四层的骨架搭建与统一入口，领域模块层已有代码不推翻，仅通过类型与工具层为其提供契约。

## 技术栈

- **build_tool**: Vite 5.x
- **language**: TypeScript 5.x（strict 模式开启）
- **rendering**: Three.js（ESM 按需引入）
- **testing**: Playwright（端到端验收）
- **runtime_validation**: Zod（外部数据/输入边界校验，按需引入）
- **package_manager**: npm
- **module_system**: ESM
- **framework**: 无 UI 框架（Vanilla TS，游戏以 canvas 渲染为主）

## 模块设计

### 配置与构建层
职责: 工程化配置：提供 dev/build/preview 命令、TS 编译检查、测试入口，锁定 Vite+TS+Three.js 技术栈。

### 入口引导层
职责: 应用唯一启动入口：创建并持有 renderer/scene/camera，初始化游戏循环（requestAnimationFrame + dt），为后续领域模块注入上下文。

### 共享类型层
职责: 零运行时接口契约：集中声明跨模块共享的数据结构与输入协议，统一从 types/index.ts 导出。

### 共享工具层
职责: 纯函数工具沉淀：数学与时间相关通用逻辑，禁止业务模块内联重复实现。

## 关键决策
- 采用 Vite + Vanilla TypeScript（不引入 React/Vue）：赛车游戏以 canvas 渲染为主，无复杂 DOM 组件，引入框架徒增复杂度，且与已有纯 TS 类代码风格一致。
- 类型层与工具层严格分离：types/ 只声明接口（零运行时），utils/ 只放纯函数，均通过各自 index.ts 统一导出，避免业务模块深路径 import 与循环依赖。
- 入口单例模式：main.ts 作为唯一 bootstrap 持有 renderer/scene/camera，通过注入方式传递给领域模块，避免全局变量散落。
- 统一输入抽象前置：input.ts 在脚手架阶段即预留触屏虚拟按键与键盘归一化契约，防止后续触屏工单返工。
- 固定 dt 时间驱动：循环内基于 requestAnimationFrame 计算 delta（秒），物理/相机/计时统一按秒驱动，保证帧率无关。
- Zod 仅在外部边界使用：遵循类型安全边界规范，对 postMessage/输入等外部数据校验，内部模块间传递走静态类型。
