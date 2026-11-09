# 架构设计 - 实现玩家赛车与第三人称跟随视角

## 架构模式
分层模块化架构 (Layer-based Modular) — 入口/配置层 → 共享层(types/utils) → 领域模块(input/player/camera)。本工单在既有 App + Updatable 可插拔框架之上增量扩展：新增输入聚合层、玩家车辆领域模块与第三人称跟随相机模块，三者均以实现 Updatable 接口的可插拔单元接入现有渲染循环，不推翻现有场景初始化与 App 主类。

## 技术栈

- **rendering**: Three.js (WebGLRenderer + PCFSoftShadowMap + ACESFilmicToneMapping)
- **language**: TypeScript (strict + noUnusedLocals + noUnusedParameters)
- **bundler**: Vite (HMR 支持)
- **geometry**: Three.js 原生几何体组合建模 (BoxGeometry / CylinderGeometry)，零外部资源加载
- **ui**: 原生 DOM + CSS 覆盖层 (触屏虚拟按键)
- **input_validation**: 手写类型守卫 (与现有代码风格一致，不新增 zod 等依赖)
- **state**: 领域模块内受控类方法 (无外部状态库，遵循不可变更新约定)

## 模块设计

### 输入类型定义
职责: 定义归一化输入状态与输入源配置类型，供 InputManager 与业务层共享。

### 玩家车辆类型定义
职责: 定义车辆模型与跟随相机的配置类型，保持与 scene.ts 一致的配置驱动风格。

### 输入管理器
职责: 统一聚合键盘(W/S/A/D/方向键)与触屏虚拟按键，产出归一化 InputState；对外只暴露只读状态与订阅/清理方法，业务层不直接接触 DOM 事件。

### 触屏虚拟按键
职责: 生成油门/刹车/左转/右转虚拟按键 DOM 覆盖层，用 PointerEvent(含 Touch 派生) 监听按下/抬起，并以 pointerId 维护多指状态，回写 InputManager 的内部按键集合。

### 车辆模型构建器
职责: 用 Three.js 原生几何体拼装赛车外观（车身 Box、四轮 Cylinder、车窗/车灯点缀），返回 THREE.Group，统一命名便于后续按 name 定位子部件。

### 玩家车辆
职责: 持有车辆 root 位姿与速度，实现 Updatable 接口；消费 InputState 做运动学占位更新(加速/刹车/转向/朝向)，为后续物理模块(抓地力/碰撞)预留单一入口。

### 第三人称跟随相机
职责: 读取车辆 root 位姿，计算后方偏移目标点，用阻尼插值平滑跟随并 lookAt 车辆前方，替代驾驶模式下的 OrbitControls。

### 入口组装
职责: 在 App 组装阶段禁用 OrbitControls、实例化 InputManager/PlayerCar/FollowCamera 并注册 updatables；保持 App 类主体与渲染循环不变。

## 关键决策
- 复用现有 App + Updatable 可插拔框架：PlayerCar 与 FollowCamera 均实现 Updatable，经 app.addUpdatable 注册；不新建渲染循环、不修改 FrameInfo 结构。
- 输入抽象为归一化 InputState(各轴 ∈ [-1,1])，InputManager 统一聚合键盘与触屏，业务层只消费 InputState，与具体输入设备解耦，为后续物理/计时模块复用。
- 车辆模型用 Three.js 原生几何体组合(车身 Box + 四轮 Cylinder)，不引入 GLTFLoader 或外部模型文件，保证浏览器打开即玩、零加载依赖。
- 驾驶模式禁用现有 OrbitControls(构造时 controls:false 或运行时切换)，由 FollowCamera 接管相机，避免两套相机控制冲突。
- 键盘/触屏事件属外部输入，用类型守卫(键盘动作判别 + PointerEvent/TouchEvent 判别)校验后再消费，遵循项目'禁止 any/unsafe 访问'红线。
- PlayerCar 本工单仅做运动学占位(位置/朝向/速度)，保留 update(frame, input) 单一入口，作为后续物理模块(速度相关抓地力、边界碰撞)的接入缝，避免本次过度实现。
- 共享逻辑沉淀：速度/转向钳制复用 src/utils/math.ts 的 clamp/lerp，虚拟按键尺寸与相机参数走配置常量，禁止业务内联重复辅助函数。
