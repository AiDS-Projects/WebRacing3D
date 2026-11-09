# 架构设计 - 实现计时与圈数系统

## 架构模式
分层模块化架构 (Layer-based Modular) — 入口/配置层 → 共享层(types/utils) → 领域模块(race/timing)。本任务在既有 TrackData 契约上增量新增 race 领域层：复用 types/track.ts 已定义的 TrackProgress/LapResult/TrackSample/TrackCheckpoint 数据结构，新增计时与圈数检测的领域逻辑(RaceSession/LapTracker)、起终点可视化(startLine)、DOM HUD，最后在 index.ts 的 Updatable 渲染循环中接线。不推翻 PlayerCar/FollowCamera/App 既有实现。

## 技术栈

- **language**: TypeScript (strict, ES2022, 禁止 any)
- **runtime**: Browser (DOM + WebGL)
- **renderer**: Three.js (WebGLRenderer)
- **ui**: 原生 DOM + CSS（HUD 层，独立于 WebGL 画布，非 canvas 精灵）
- **build**: Vite（按现有 vite 配置，无新增依赖）
- **no_new_dependencies**: True
- **note**: 时间源使用 Three.Clock 的单调时钟 / performance.now()，不使用 dt 累加以避免帧率漂移

## 模块设计

### race 类型定义
职责: 定义计时与圈数领域专属类型；复用而非重复 types/track.ts 中已有的 TrackProgress/LapResult/TrackSample/TrackCheckpoint/TrackStartLine。

### 共享格式化工具
职责: 沉淀时间格式化与进度格式化等纯函数，避免 HUD 内 inline 重复（遵守「共享逻辑优先」）。

### 圈数检测核心
职责: 纯逻辑类，接收车辆沿中心线的进度，基于「有序检查点 + 距离回绕 + 方向校验」判定是否完成一圈，输出 LapResult。不依赖 THREE，可单测。

### 会话状态机与计时
职责: 比赛会话唯一数据源(store)：持有 phase、总时长、当前圈、圈记录、最佳圈。通过 action 方法变更状态（start/reset/tick），产出不可变 snapshot 供 UI 消费；实现 Updatable 契约接入 App 渲染循环。

### 起终点可视化
职责: 在赛道上渲染起终点线（黑白格/单色横带）与检查点标记（调试用），挂入 scene。

### HUD 界面
职责: 纯展示层：速度表、当前圈数、计时器、起终点结算面板（本圈成绩/最佳圈/圈数列表）、开始/重置按钮（含触屏可用）。订阅 RaceSession snapshot + RaceEvent。

### 集成接线
职责: 在 App 中实例化 RaceSession 与 HUD，通过 addUpdatable 注入渲染循环；将 PlayerCar 位置每帧传给 session。

## 关键决策
- 复用而非重写：types/track.ts 已定义 TrackSample/TrackProgress/LapResult/TrackCheckpoint/TrackStartLine 及 TrackData.sample()/progressOf() 契约，圈数检测完全建立其上，不重新实现中心线投影算法。
- 圈数检测采用「有序检查点 + 距离回绕 + 方向校验」而非单纯距离回绕：防止倒车跨线、抄近路误计圈；起跑线作为 checkpoints[0]，必须依序通过所有检查点后才允许 lap+1。
- 状态管理遵循项目「不变性」规范：RaceSession 作为唯一数据源，所有变更走 start/reset/tick action，对外只暴露不可变 snapshot 与事件订阅，HUD 只读不写。
- 计时用单调时钟（Clock.elapsed / performance.now() 差值），不用每帧 dt 累加，避免长时间运行时漂移。
- 检测逻辑(LapTracker)为纯逻辑类、不依赖 THREE，便于单测；起终点可视化(startLine)与检测逻辑解耦，只做展示。
- HUD 用原生 DOM 叠加层而非 canvas/精灵，便于排版与触屏按钮；仅在数值变化时更新 textContent 避免每帧重排。
