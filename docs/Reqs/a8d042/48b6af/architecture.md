# 架构设计 - 初始化项目脚手架与技术栈

## 架构模式
分层模块化架构 (Layer-based Modular) — 入口/配置层 → 共享层(types/utils) → 领域模块(state/input/level/gameobjects) → 渲染层(scenes)，各模块通过统一 barrel 入口导出，单向依赖

## 技术栈

- **language**: TypeScript 5.x (strict 模式)
- **build_tool**: Vite 5.x
- **package_manager**: pnpm
- **rendering**: Three.js r160+ (原生 WebGL，不引入 react-three-fiber)
- **runtime_validation**: Zod (外部数据边界校验：存档、localStorage、事件载荷)
- **state_management**: 轻量自研 Store (class + action 方法，遵循不可变/受控变更规范)
- **testing**: Vitest
- **code_style**: ESLint + Prettier (no any, no unused)
- **environment_variables**: VITE_* 前缀 (预留，单机原型暂无远程 API)

## 模块设计

### 工程配置层 (project-config)
职责: 构建与类型系统基础，统一入口

### shared-types (类型定义层)
职责: 全项目共享类型契约，避免跨模块隐式 any

### utils (共享工具层)
职责: 数学/通用辅助函数沉淀，供所有业务模块复用

### config (配置常量层)
职责: 游戏可调参数集中管理 (物理/赛道/相机/输入映射)

### input (输入层)
职责: 统一键盘与触屏虚拟按键，输出规范 InputState

### state (全局状态层)
职责: 游戏状态机与可追踪 action 变更 (idle/racing/finished)

### level (赛道定义层)
职责: 环形闭合赛道数据生成与起点/终点标记

### gameobjects (游戏对象层)
职责: 赛车/路面/路肩/护栏等可渲染对象工厂

### scenes (场景/渲染层)
职责: Three.js 渲染器/相机/灯光/主循环管理

### app 入口层
职责: 应用引导与模块装配

### acceptance (验收测试层)
职责: 对应验收标准的可执行检查

## 关键决策
- 构建工具选 Vite：原生 TS/ESM、开发热更新快，契合单机原型快速迭代；不引入 Webpack 等重型工具链
- 渲染直接用原生 Three.js，不引入 react-three-fiber：单机原型无复杂 UI 树，保持依赖精简与渲染循环直接可控
- 共享 utils/ 层先行沉淀 (clamp/lerp/向量/Zod 封装/事件总线)：符合共享逻辑优先规范，后续物理、相机、边界碰撞均复用，避免业务内联重复
- 状态管理用轻量自研 Store (class + action)：满足受控变更规范且无框架开销，游戏高频更新场景比 React 响应式更直接
- 输入层抽象统一键盘与触屏，统一输出 InputState：物理层只消费规范化输入，不感知设备来源，便于后续新增手柄等
- 外部边界 (localStorage 存档、触摸/消息事件) 用 Zod + 类型守卫校验：落实类型安全边界规范，禁止 any 与 as 断言
- 保留并复用已有空目录骨架 (src/{config,gameobjects,input,level,scenes,state,utils,acceptance})：增量设计不推翻既有结构，仅填充文件与 barrel 入口
