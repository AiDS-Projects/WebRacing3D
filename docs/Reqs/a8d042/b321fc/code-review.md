# 代码审查 — 实现计时与圈数系统

## 评分: 4/10 🚫 需修复

## 🔴 严重问题（必须修复）
- {'location': 'src/race/LapTracker.ts:update()', 'title': 'totalLength 未校验导致除零 / NaN 传播', 'detail': '`const total = this.track.totalLength` 未做任何校验，若 totalLength 为 0 或 undefined，`Math.floor(accumulatedDistance / total)` 会得到 Infinity/NaN，`getProgress()` 中 `within / total` 同样产生 NaN，圈数判定与进度计算全部失效。', 'suggestion': '构造函数中校验 `totalLength > 0`，否则抛错或降级为安全默认值。'}
- {'location': 'src/types/race.ts vs src/race/LapTracker.ts vs src/race/StartLine.ts', 'title': '三套互不兼容的类型体系 / LapResult 重复冲突', 'detail': '`types/race.ts` 定义了完整的 RaceState/LapTiming/LapSettlement/RaceResult/RaceEvents 但无任何实现引用（死代码）；LapTracker 从 `../types/track` 导入 `LapResult`；StartLine 又自定义了字段不同的 `LapResult`（含 totalTime/bestLap/isBest）。两个 LapResult 形状冲突，模块对接会静默丢失字段。', 'suggestion': '统一为单一类型来源，删除死代码，或让实现真正复用 race.ts 定义。'}
- {'location': 'src/race/LapTracker.ts:constructor()', 'title': 'Math.max(1, NaN) 导致比赛永远无法结束', 'detail': '`this.totalLaps = Math.max(1, Math.floor(config.totalLaps))`。当 totalLaps 为 NaN 时，Math.floor(NaN)=NaN，Math.max(1, NaN)=NaN，this.totalLaps 变为 NaN，结束条件 `this.lap >= this.totalLaps` 恒为 false。', 'suggestion': '对输入做 `Number.isFinite` 校验，NaN 时回退默认圈数。'}
- {'location': 'src/race/LapTracker.ts', 'title': 'bestLap 初始化为 Infinity 可能外泄', 'detail': '`bestLap = Infinity`，若在未完成任何圈时进入结算或展示，RaceSummary.bestLap 与 HUD 为 Infinity，`formatTime(Infinity)` 输出非法字符串。', 'suggestion': '结算/展示前判断是否有有效圈，无圈时 bestLap 置 null 或 0 并标记无成绩。'}

## 🟡 警告（建议修复）
- {'location': 'src/race/LapTracker.ts:constructor()', 'title': '计时逻辑与 DOM/HUD 强耦合', 'detail': '构造函数直接访问 `document.body`，在 SSR / 无 DOM 环境会直接崩溃，且无法进行纯逻辑单元测试。', 'suggestion': '将 HUD 渲染抽离为独立模块或注入接口，逻辑层不直接触碰 DOM。'}
- {'location': 'src/race/LapTracker.ts:constructor()', 'title': 'showHud=false 时存在空指针风险', 'detail': '即使 `showHud === false`，仍调用 `buildHud(...)` 并将 `refs.lap/best/banner` 等强转为 HTMLSpanElement/HTMLDivElement，若 buildHud 返回 null，后续 updateHud 写 textContent 会抛空指针。', 'suggestion': 'showHud=false 时跳过 HUD 创建，并在 updateHud 前判空。'}
- {'location': 'src/race/LapTracker.ts:update(dt)', 'title': 'dt 未做上限钳制', 'detail': '页面失焦/卡顿导致 dt 异常大时，`elapsed += dt` 会严重污染圈时与累计时间。', 'suggestion': '对 dt 做 `Math.min(dt, MAX_DT)` 钳制，例如 0.1s。'}
- {'location': 'src/race/LapTracker.ts:update()', 'title': '弧长环绕修正未处理 teleport / 重生跳变', 'detail': '`if (delta > half) delta -= total` 假定单帧位移不超过半圈，teleport 或重生导致的大跳变会被静默误判为环绕，产生错误圈数。', 'suggestion': '检测 |delta| > half 且超出合理阈值时判定为跳变，重置基准而非累加。'}
- {'location': 'src/race/StartLine.ts', 'title': '魔法值硬编码', 'detail': '`minLapTime ?? 3`、`width ?? 12`、`PlaneGeometry(width, 0.4)`、颜色 `0xffd166`、`opacity 0.85` 均为散落的魔法值。', 'suggestion': '提取到常量或配置对象，便于统一调整与复用。'}
- {'location': 'src/race/LapTracker.ts:getProgress()', 'title': 'checkpoints 顺序假设未校验', 'detail': '检查点索引遍历假定 `checkpoints` 按 distance 升序排列，未排序时会返回错误的 checkpointIndex。', 'suggestion': '构造时排序或文档明确要求并加断言。'}
- {'location': 'src/race/LapTracker.ts', 'title': 'lastLapTime 初始为 0 误导展示', 'detail': '未完成首圈时 `lastLapTime = 0`，HUD 显示『上圈 0:00.000』，易被误读为真实成绩。', 'suggestion': "用 null 表示无上圈成绩，HUD 显示占位符如 '--'。"}

## 🟢 建议（可选优化）
- {'location': 'src/race/StartLine.ts:update()', 'title': '未处理初始位于法线正侧的场景', 'detail': '首帧 `hasPrevSample` 直接记录 signed，若车辆初始已越过起跑线（正侧），需先回到负侧再穿回才会触发，可能导致漏判或错误发车。', 'suggestion': '首帧根据 signed 符号显式设置初始侧与起跑状态。'}
- {'location': '全局', 'title': '时间单位不一致', 'detail': 'LapTracker/StartLine 使用秒，types/race.ts 注释使用毫秒，混用易引发换算错误。', 'suggestion': '统一时间单位（建议秒）并在类型注释与文档中明确。'}
- {'location': 'src/race/LapTracker.ts', 'title': 'formatTime 应沉淀到共享 utils', 'detail': '按项目编码规范，formatTime 属共享工具函数，当前内联在 LapTracker 中，其他模块（如 StartLine 结算）重复实现同类逻辑。', 'suggestion': '抽取到 `src/utils/time.ts` 供多处复用。'}
- {'location': 'src/race/LapTracker.ts:update()', 'title': 'idleResult 每帧新建对象造成 GC 压力', 'detail': 'update 每帧返回新的 LapResult 对象，高频调用下产生不必要分配。', 'suggestion': '复用单例对象或返回只读缓存结果。'}
- {'location': 'src/race/LapTracker.ts:getProgress()', 'title': 'direction 语义在倒退跨越起跑线时不明确', 'detail': '`lastDelta > 0 ? 1 : -1 : 0` 未说明倒退/跨越起跑线时的方向语义，下游（小地图）可能误解。', 'suggestion': '补充文档说明 direction 在环绕跳变帧的取值语义。'}

## 审查的代码
- src/types/race.ts
- src/race/LapTracker.ts
- src/race/StartLine.ts
- src/utils/time.ts
- docs/Reqs/a8d042/b321fc/dev-notes.md
