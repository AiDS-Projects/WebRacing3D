# 代码审查 — 实现玩家赛车与第三人称跟随视角

## 评分: 4/10 🚫 需修复

## 🔴 严重问题（必须修复）
- {'file': 'src/camera/FollowCamera.ts', 'location': 'DEFAULT_CONFIG / constructor / setOffset', 'title': '默认配置 Vector3 被浅拷贝共享，setOffset 跨实例污染全局默认值', 'description': 'DEFAULT_CONFIG 是模块级单例，offset 与 lookAtOffset 为 THREE.Vector3 实例。构造函数 `{ ...DEFAULT_CONFIG, ...config }` 是浅拷贝，未显式传入 offset 时，`this.config.offset` 与 `DEFAULT_CONFIG.offset` 指向同一个对象。`setOffset()` 通过 `this.config.offset.copy(offset)` 原地修改，会污染全局默认值，导致后续创建的 FollowCamera 实例初始相机位置被上一个实例的偏移覆盖，属于跨实例状态污染的确定性逻辑 bug。', 'suggestion': '构造函数中对向量做深拷贝：`offset: (config.offset ?? DEFAULT_CONFIG.offset).clone()`，lookAtOffset 同理；或让 DEFAULT_CONFIG 提供工厂函数每次返回新 Vector3。'}
- {'file': 'src/input/KeyboardInput.ts', 'location': 'onGlobalPointerEnd', 'title': '全局 pointerup 兜底清空全部虚拟按键，破坏多点触控', 'description': 'window 上的 pointerup/pointercancel 兜底直接执行 `pressedVirtual.clear()`。元素级 onPointerEnd 在 target 阶段先触发并删除对应 control，随后事件冒泡到 window 触发 onGlobalPointerEnd，把仍然按住的其他虚拟按键一并清空。双指同时按「油门+转向」时，松开一根手指会导致另一根手指对应的按键失效，触屏设备上无法同时加速与转向，属真实逻辑 bug。', 'suggestion': 'onGlobalPointerEnd 应仅清理事件对应指针的按键，使用 pointerId 追踪（如 Map<pointerId, ControlName>），或在元素级 pointerdown 时 setPointerCapture，避免依赖全局兜底 clear。'}

## 🟡 警告（建议修复）
- {'file': 'src/physics/VehiclePhysics.ts', 'location': 'get state()', 'title': 'state getter 直接暴露内部可变引用，破坏状态管理不变性', 'description': '`get state()` 返回 `this._state` 原引用，外部调用方可直接修改 position/heading/speed 等字段，绕过 update() 的物理逻辑与 clamp，破坏封装并违反项目 TypeScript 规范的「状态管理不变性」要求（reset 方法内部已做防御性拷贝，但 getter 又把这个保护抵消了）。', 'suggestion': '返回只读视图（Readonly<VehicleState>）或深拷贝；若要兼容现有消费方，至少用 `Object.freeze` 包装或提供 `getState(): Readonly<VehicleState>`。'}
- {'file': 'src/input/KeyboardInput.ts', 'location': 'bindVirtualButtonsFromContainer', 'title': 'DOM data-control 属性未经运行时校验即断言为 ControlName', 'description': "`node.dataset.control as ControlName | undefined` 只做了真值判断，未校验值是否属于合法 ControlName 集合。DOM 属性属外部输入，拼写错误（如 'steerleft'、'throtle'）会被静默接受并写入 virtualButtons，导致该按键永远无法触发且无任何告警。违反项目「类型安全边界：外部数据必须运行时校验」规范。", 'suggestion': '增加类型守卫或合法值集合校验：`const VALID: Set<string> = new Set([...]); if (control && VALID.has(control)) ...`，非法值给出 warn 日志。'}
- {'file': 'src/input/KeyboardInput.ts', 'location': 'onPointerDown / onPointerEnd', 'title': 'event.currentTarget 用 as 断言为 HTMLElement，未处理 null', 'description': '`event.currentTarget as HTMLElement` 是不安全断言：currentTarget 在事件处理期间有效，但类型上为 EventTarget | null，且事件回调异步路径下可能已失效。违反项目「减少 as 断言」规范。', 'suggestion': '使用类型守卫：`const el = event.currentTarget; if (!(el instanceof HTMLElement)) return;` 后再取 control。'}
- {'file': 'src/camera/FollowCamera.ts', 'location': 'updatePosition / updateLookAt', 'title': '每帧 clone() 分配临时 Vector3，产生持续 GC 压力', 'description': 'updatePosition 与 updateLookAt 每帧各执行一次 `this.config.offset.clone()` 和 `this.config.lookAtOffset.clone()`，赛车类游戏主循环高频调用时会产生可观的短期对象分配，触发 GC 抖动影响帧率稳定性。', 'suggestion': '复用模块级或实例级 scratch Vector3（temp.applyQuaternion...set）避免每帧分配。'}

## 🟢 建议（可选优化）
- {'file': 'src/input/KeyboardInput.ts', 'location': 'isActive', 'title': 'isActive 反向遍历 pressedKeys，update 每帧 O(7n) 查找', 'description': 'isActive 对每个 control 都遍历整个 pressedKeys 集合做反向映射查找，update 每帧调用 7 次。当前键盘按键数少影响不大，但可更清晰高效。', 'suggestion': 'pressedKeys 直接存 ControlName 集合（keydown 时 add control，keyup 时删除该 code 对应的 control），使 isActive 变为 O(1) 的 Set.has。'}
- {'file': 'src/input/KeyboardInput.ts', 'location': 'unbindVirtualButton / dispose', 'title': '解绑未还原 touchAction/userSelect 样式', 'description': "bindVirtualButton 设置了 element.style.touchAction='none' 和 userSelect='none'，但 unbindVirtualButton 与 dispose 未还原，元素复用（如 HUD 重挂载）后样式残留。", 'suggestion': '在解绑时恢复原样式值（绑定前先缓存原始值）。'}
- {'file': 'src/input/KeyboardInput.ts', 'location': 'update / reset 动作', 'title': 'reset 为电平触发而非边沿触发', 'description': "update 中 reset 直接取 isActive('reset')，按住 R 期间会持续为 true。若消费方每帧检测 true 即执行重置，会导致按住时反复重置。", 'suggestion': '对 reset（以及可能 boost）这类一次性动作做边沿检测，仅「上一帧 false → 本帧 true」时置 true。'}
- {'file': 'src/physics/VehiclePhysics.ts', 'location': 'DEFAULT_VEHICLE_CONFIG', 'title': '导出的默认配置对象可变，可被外部修改', 'description': 'DEFAULT_VEHICLE_CONFIG 作为模块导出对象未冻结，任何导入方可直接修改其字段，污染所有使用默认配置的实例。', 'suggestion': '用 Object.freeze 冻结，或改为返回新对象的工厂函数 getDefaultConfig()。'}
- {'file': 'src/physics/VehiclePhysics.ts', 'location': 'DEFAULT_VEHICLE_CONFIG 数值', 'title': '物理参数缺少语义说明与单位注释', 'description': 'maxSpeed=30、grip=0.85、slipFactor=0.6、collisionDeceleration=0.5 等魔法数值缺少调参依据与手感说明，后续调整成本高。', 'suggestion': '为关键参数补充注释（如 grip/slipFactor 如何耦合影响打滑手感），或将可调参数集中到配置文件。'}

## 审查的代码
- src/input/KeyboardInput.ts
- docs/Reqs/a8d042/de9d1d/dev-notes.md
