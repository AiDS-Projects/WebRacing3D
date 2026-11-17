# 架构设计 - 实现玩家赛车与第三人称跟随视角

## 架构模式
分层模块化架构（Layer-based Modular）增量扩展：在既有「配置/构建层 → 入口引导层 → 共享类型层 → 共享工具层 → 领域模块层（camera/physics/player/race/track）」之上，新增/补全输入领域模块（input/），将键盘与触屏统一为 VehicleInput 单一契约源，由 PlayerCar 聚合 VehiclePhysics（已存在）与程序化赛车模型，FollowCamera（已存在）复用为跟随视角。不推翻已有代码，只做增量接线。

## 技术栈

- **language**: TypeScript（strict，禁 any）
- **renderer**: Three.js WebGL（复用既有 THREE.PerspectiveCamera / Object3D / Group）
- **build**: Vite（沿用既有 index.html + package.json）
- **validation**: Zod（仅用于 postMessage 等外部边界校验；本工单内输入事件直接走类型守卫）
- **assets**: 程序化几何体（Box/BoxGeometry、CylinderGeometry 等拼装赛车，无外部模型资源，满足零依赖浏览器直开）
- **input_runtime**: 浏览器原生 KeyboardEvent + Pointer Events（指针事件统一处理鼠标与多点触控）

## 模块设计

### types/input.ts
职责: 定义输入动作与归一化输入的共享类型：InputAction（throttle/brake/left/right/reset）、InputState（各按键/触点的布尔或 0~1 值）、以及到 VehicleInput 的映射契约。作为 input 模块与 physics 模块的唯一交接面。

### player/PlayerCar.ts
职责: 聚合赛车实体：1) 用 Three.js 基元拼装程序化赛车模型（车身 Box + 车顶 Box + 四轮 Cylinder，统一 Group）；2) 持有一个 VehiclePhysics 实例；3) 暴露 root: THREE.Object3D 供 FollowCamera 与场景挂载；4) 暴露 update(dt, input) 驱动物理并同步网格变换（位置/朝向/轮转）。车头朝向约定必须与 VehiclePhysics.heading 一致（定义 +X 为车头，模型绕 Y 轴按 heading 旋转）。

### input/KeyboardInput.ts
职责: 监听 window keydown/keyup，维护按键集合，映射 W/↑=throttle、S/↓=brake、A/D/←/→=steer、R=reset，输出 InputState。使用 e.code（物理键位）而非 e.key（避免布局差异），阻止箭头键页面滚动默认行为，处理 keyup 消除长按。

### input/TouchInput.ts
职责: 基于 Pointer Events 的触屏虚拟按键：左侧转向区（左右）+ 右侧油门/刹车按钮，多触点各自用 pointerId 追踪，输出与键盘同构的 InputState。支持 pointerdown/up/cancel 三态，触点离开按钮判定释放，避免单触点被 touchstart 吞掉。

### input/InputManager.ts
职责: 输入聚合与优先级：同时持 KeyboardInput 与 TouchInput，每帧 read() 合并两者为单一 VehicleInput。合并策略：转向取「非零优先」（触屏活动时覆盖键盘）；油门/刹车取两者最大值；reset 取逻辑或。是 PlayerCar 唯一直接依赖的输入来源。

### ui/TouchControls.ts
职责: 渲染触屏虚拟按键 DOM 覆盖层（仅移动端/触屏设备显示，可用 matchMedia('(pointer: coarse)') 判定），生成左转/右转/油门/刹车按钮元素，向 TouchInput 注册命中区域。样式为纯 DOM + CSS，不与 Three.js 画布耦合。

### camera/FollowCamera.ts
职责: 已有通用第三人称跟随相机，无需改动。通过 setTarget(player.root) 绑定赛车，update(dt) 按 offset(0,5.5,-10) / lookAtOffset(0,1.6,0) 平滑跟随。配置 positionLerp 与 lookAtOffset 供本工单调参。

### scenes/RaceScene.ts（或 main.ts 内引导）
职责: 入口引导层接线：实例化 PlayerCar、InputManager、FollowCamera、TouchControls，加入 utils/loop.ts 渲染循环；每帧执行 read input → player.update(dt, input) → camera.update(dt) → renderer.render。挂载赛车 root 与相机到场景。

## 关键决策
- 赛车模型采用 Three.js 基元程序化拼装（Group + Box/Cylinder），不引入外部 .gltf 资源，保持「浏览器打开即玩、零网络依赖」的验收底线。
- 键盘与触屏统一收敛为 VehiclePhysics 已定义的 VehicleInput 契约（throttle/brake/steer），避免输入层各自为政；InputManager 是 PlayerCar 唯一输入来源。
- 车头朝向约定为 +X（heading=0 时车头朝 +X），赛车模型构建时即按此旋转对齐，规避「模型朝向与物理 heading 不一致」的经典集成 bug。
- 触屏使用 Pointer Events（统一 mouse/touch/pen），按 pointerId 追踪多触点，支持「同时转向 + 加速」的多指操作，而非过时的 touchstart/touchend。
- FollowCamera 完全复用不改动，通过 setTarget(player.root) 绑定，仅调 positionLerp/lookAtOffset 参数，遵守「增量不推翻既有代码」。
- 虚拟按键仅在 pointer: coarse（触屏）设备显示，桌面端自动隐藏，避免桌面键盘用户看到冗余 UI。
