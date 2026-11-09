# 代码审查 — 实现玩家赛车与第三人称跟随视角

## 评分: 5/10 🚫 需修复

## 🔴 严重问题（必须修复）
- FollowCamera.ts: 模块级 DEFAULT_CONFIG 中的 offset/lookAtOffset 是可变 Vector3 单例，构造器用浅拷贝 { ...DEFAULT_CONFIG, ...config } 合并，未传 offset 的多个实例会共享同一个 Vector3。调用 setOffset() 会 copy 到这个共享对象上，导致一个相机实例的偏移污染其它实例（跨实例状态串扰，属逻辑错误/状态破坏）。应改为构造时 clone 默认向量，例如 offset: DEFAULT_CONFIG.offset.clone()。

## 🟡 警告（建议修复）
- FollowCamera.ts: updatePosition/updateLookAt 使用 target.quaternion（局部四元数）而非 target.getWorldQuaternion()。当目标被挂载在旋转过的父节点下时偏移计算错误；且当车辆在坡道俯仰/倾斜弯道侧倾时，相机偏移会随车体 roll/pitch 一起旋转，导致地平线倾斜、观感异常。至少应对偏航单独处理或改用世界四元数并分离 roll/pitch 分量。
- FollowCamera.ts: 位置使用平滑(指数衰减)，但 updateLookAt() 每帧硬性 lookAt，观察方向无平滑。车辆急转时位置滞后而视线瞬时跳变，会产生旋转抖动/断裂感。lookAt 目标点同样应做平滑，或对相机朝向做平滑插值。
- FollowCamera.ts: updatePosition 与 updateLookAt 每帧各自 clone() 一个 Vector3（desired/lookAt），在每帧热路径产生持续 GC 分配，影响性能。应缓存为类私有字段复用，避免每帧 new。
- src/index.ts 未导出新增的 ./types/input 与 ./camera/FollowCamera，新模块无法被外部/其余模块引用，接口未对消费者开放。
- types/input.ts: VirtualButtonLayout 定义了 left/right/throttle/brake/handbrake，但缺少 reset 按钮，而 CarAction 中存在 'reset'，导致触屏用户无法触发复位操作，输入能力不完整。
- types/input.ts: CarInput.steer 由 steerLeft/steerRight 合成，但类型层未定义归一化/合成逻辑的契约，合成实现（输入归一化、刹车与油门同时按下时的优先级）无类型约束，容易出现各模块实现不一致。

## 🟢 建议（可选优化）
- FollowCamera.ts: 字段名 positionLerp 与实际语义不符（实际是指数平滑速率，非 lerp 系数），建议更名为 positionSmoothRate 或 smoothingFactor 以避免误导。
- types/input.ts: VirtualButton.holdable 的注释只说明「油门/转向为 true，手刹/复位为 false」，未说明 brake 的取值，注释与类型不完整，应补全。
- FollowCamera.ts: 建议增加对 config.offset / lookAtOffset 零长度向量的校验，避免 offset 为零向量时相机与目标重合导致 lookAt 结果未定义（NaN/视锥异常）。
- FollowCamera.ts: 建议将 DEFAULT_CONFIG 的默认向量改用工厂函数 createDefaultConfig() 生成，从根源上避免可变单例被共享的问题，而非仅在构造器 clone。
- FollowCamera.ts: snap() 内部调用 updatePosition(target, 1) 通过传 t=1 隐式表达「硬贴合」，语义不够清晰，建议拆出独立的硬贴合路径（如直接计算 desired 并 copy），避免依赖魔法值 1。

## 审查的代码
- src/types/input.ts
- src/camera/FollowCamera.ts
- docs/Reqs/a8d042/de9d1d/dev-notes.md
