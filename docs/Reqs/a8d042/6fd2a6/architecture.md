# 架构设计 - 实现基础车辆物理系统

## 架构模式
分层模块化架构 (Layer-based Modular) — 入口/配置层 (main/index) → 共享层 (types/utils) → 领域模块 (physics/player)。新增 physics 领域模块承载车辆物理，PlayerCar 仅负责模型/输入/相机与状态同步，通过接口注入赛道碰撞数据，不推翻现有代码结构。

## 技术栈

- **language**: TypeScript (strict, ES2022)
- **rendering**: Three.js (r160+，仅使用 Vector3/Group/Object3D 等数学与场景基元)
- **build**: Vite
- **module_resolution**: bundler + 路径别名 @/* → src/*
- **physics**: 自研轻量弧线车辆模型（无外部物理引擎依赖）
- **new_dependencies**: 

## 模块设计

### 共享输入类型 CarInput
职责: 将当前内联在 PlayerCar.ts 中的 CarInput 接口提升到共享类型层，供输入绑定、物理模块、后续 AI 复用。

### 共享数学工具
职责: 沉淀通用数值工具，消除 PlayerCar 中内联的指数平滑与夹取逻辑，供物理、相机等多处复用。

### 车辆物理核心 VehiclePhysics
职责: 纯物理积分器，与渲染解耦。接收输入与 dt，更新车辆状态（位置、朝向、速度矢量、转向量），实现加减速、转向、速度相关抓地力（高速打滑）。

### 赛道边界碰撞解析 TrackCollision
职责: 消费 TrackData.sample()（types/track.ts 已定义的契约）判断车辆是否越界/撞护栏，执行减速与回推。

### 玩家赛车 PlayerCar（改造）
职责: 保留车身模型构建、键盘/触屏输入、车轮动画与相机跟随，仅将运动逻辑委托给 VehiclePhysics + TrackCollision，并新增赛道数据注入。

## 关键决策
- 物理与渲染解耦：新增 src/physics/ 领域模块承载纯物理，PlayerCar 仅做模型/输入/相机与状态同步，便于单元测试与调参，符合『共享逻辑优先』规范。
- 采用速度矢量分解（forwardSpeed + lateralSpeed）替代现有标量 speed 模型：标量模型无法表达高速转向时的横向打滑，矢量分解是最小改动下支持抓地力/漂移的方案。
- 抓地力用速度相关的指数衰减近似（gripBase / (1 + speed^2 / gripFalloff)），而非完整 Pacejka 轮胎模型：原型验证手感足够，避免过度工程。
- 碰撞检测复用 types/track.ts 已定义的 TrackData.sample() 契约与 TrackSample（lateralOffset/region/hitBarrier/normal），不新造采样接口。
- CarInput 提升到 src/types/input.ts：当前内联在 PlayerCar 中，物理模块与后续 AI 均需引用，属于必要的最小重构而非路过式改动。
- 新增 src/utils/math.ts 的 damp/clamp/approach，替换 PlayerCar 与 FollowCamera 中重复的指数平滑算式，满足共享层沉淀要求。
- 保持现有输入绑定与 FollowCamera 不动：相机与输入已由前置工单交付，本次范围仅物理，避免无关重构。
