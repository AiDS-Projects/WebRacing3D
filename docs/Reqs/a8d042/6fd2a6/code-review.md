# 代码审查 — 实现基础车辆物理系统

## 评分: 4/10 🚫 需修复

## 🔴 严重问题（必须修复）
- {'file': 'src/physics/VehiclePhysics.ts', 'title': '内部状态对象被直接暴露，可绕过所有物理约束被篡改', 'description': '`get state()` 返回内部 `this.state` 的原始引用，`update()` 也返回同一引用。外部代码可直接执行 `physics.state.speed = 9999` 或改写 position/heading，绕过速度上限 clamp、角度归一化(wrapAngle)、转向平滑等全部不变量，导致模拟状态被破坏。同时违背项目「状态管理不变性」规范（禁止直接修改 store 属性，必须通过 action）。应返回深拷贝/冻结快照或 `Readonly` 结构，并提供受控的写入方法。'}
- {'file': 'src/physics/VehiclePhysics.ts', 'title': '碰撞边界推回量不依赖穿透深度，高速下会穿透或振荡', 'description': '位置积分发生在碰撞检测之前，车辆每帧先越过边界、再被 `sample.normal * (0.05 + |speed| * dt)` 推回。推回量是固定步进而非基于实际穿透深度，且 `speed *= (1 - collisionDeceleration)` 后速度仍可能很大：在 maxSpeed=30、dt=0.016 时单帧位移约 0.48 单位，推回量 0.05+0.48≈0.53 勉强覆盖，但高速+低帧率(dt 接近 0.1)时单帧位移可达 3 单位，推回量不足以把车拉回赛道内，造成穿越护栏（tunneling）；反之推回过量又会与 `onTrack` 状态交替产生边界抖动。应改为将位置钳制回边界（用穿透距离计算推回），而非固定步进。'}

## 🟡 警告（建议修复）
- {'file': 'src/types/input.ts', 'title': '油门与刹车可同时为真，无互斥处理', 'description': '`toNormalizedInput` 未处理 forward 与 backward 同时按下（或 touch 同时触发）的情况，会输出 throttle=1 且 brake=1。物理层 `update` 中二者同时生效（+acceleration*dt 与 -brake*dt 叠加），净效果依赖具体配置（默认 18 vs 30 为净倒车），行为未定义且不直观。应显式互斥（刹车优先或取差值）。'}
- {'file': 'src/physics/VehiclePhysics.ts', 'title': '配置参数缺少运行时校验，存在除零与 clamp 参数反转风险', 'description': '`maxSpeed` 可经 Partial config 传 0 或负数：speedRatio = |speed|/maxSpeed 出现 Infinity/NaN。`grip`/`slipFactor` 越界时 `gripRate` 可为负，导致 `clamp(diff, -gripRate*dt, gripRate*dt)` 出现 min>max，clamp 返回固定端值，抓地行为退化。`maxReverse`、`acceleration`、`brake`、`turnRate` 也未校验负数。应在构造函数中对配置做区间校验或归一化。'}
- {'file': 'src/physics/VehiclePhysics.ts', 'title': '魔法值硬编码', 'description': '`BASE_GRIP_RATE = 8`、碰撞推回基础量 `0.05` 为魔法常量，与其余可配置参数（grip、slipFactor、collisionDeceleration）风格不一致，调参需改源码。建议纳入 `VehiclePhysicsConfig`。'}
- {'file': 'src/physics/VehiclePhysics.ts', 'title': 'dt 静默钳制到 0.1 掩盖卡顿，物理时间失真', 'description': '`dt = clamp(dt, 0, 0.1)` 在帧率骤降（如切后台）时静默截断，导致物理模拟变慢且无任何补偿或告警，车辆会出现「慢动作」错觉。建议对大 dt 做子步积分（substepping）或至少记录一次警告。'}

## 🟢 建议（可选优化）
- {'file': 'src/physics/VehiclePhysics.ts', 'title': '通用工具函数应沉淀到共享层', 'description': '`clamp`、`wrapAngle` 是通用数学工具，按项目「共享逻辑优先」规范应下沉到 `utils/`（并先检索是否已有同款实现），而非定义在物理模块内部。'}
- {'file': 'src/physics/VehiclePhysics.ts', 'title': 'Vec2 与 Track 坐标类型不一致', 'description': '物理模块自定义 `Vec2{x,y}`，而 Track 模块用 `THREE.Vector3`（XZ 平面）。碰撞采样 `sample(x, y)` 与中心线数据间存在隐式坐标映射，跨模块传递时易混淆 x/y 与 x/z。建议统一坐标类型（复用 THREE.Vector2/Vector3 并明确映射约定）。'}
- {'file': 'src/types/input.ts', 'title': '归一化输入无死区与模拟量支持', 'description': '`toNormalizedInput` 将 throttle/brake 直接映射为 {0,1}，无死区、无平滑，转向也是瞬时跳变。后续接手柄/模拟踏板或 AI 连续控制时需重复造轮子。可扩展为接受归一化幅度输入（0~1），由调用方决定是否量化。'}

## 审查的代码
- src/types/input.ts
- src/physics/VehiclePhysics.ts
- docs/Reqs/a8d042/6fd2a6/dev-notes.md
