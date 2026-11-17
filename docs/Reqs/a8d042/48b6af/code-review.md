# 代码审查 — 初始化项目脚手架与技术栈

## 评分: 4/10 🚫 需修复

## 🔴 严重问题（必须修复）
- {'title': 'FollowCamera 默认配置共享可变 Vector3，导致跨实例状态污染', 'file': 'src/camera/FollowCamera.ts', 'description': 'DEFAULT_CONFIG 中的 offset/lookAtOffset 是模块级共享的 Vector3 实例；构造函数用 { ...DEFAULT_CONFIG, ...config } 浅拷贝，只复制引用而未复制对象本身。setOffset() 通过 this.config.offset.copy(offset) 直接改写共享的 DEFAULT_CONFIG.offset。后果：多个 FollowCamera 实例（或使用默认配置的后续实例）会互相干扰，默认值被永久污染，属于隐蔽的跨实例状态腐蚀逻辑错误。', 'suggestion': '构造时深拷贝默认配置中的向量：offset: DEFAULT_CONFIG.offset.clone(), lookAtOffset: DEFAULT_CONFIG.lookAtOffset.clone()；或改为 getter 返回克隆值，保证每个实例持有独立副本。'}

## 🟡 警告（建议修复）
- {'title': 'resize 处理程序未同步更新 SceneContext.size，数据陈旧', 'file': 'src/main.ts', 'description': 'resize 回调只更新了 camera.aspect、updateProjectionMatrix() 与 renderer.setSize()，但从未更新 ctx.size。而 scene.ts 注释明确声明 size 用于「渲染循环与 resize 共用」，二者不一致；后续依赖 ctx.size 的模块会读到初始化时的陈旧尺寸。', 'suggestion': '在 resize 回调中同步 ctx.size.width = w、ctx.size.height = h，或封装为统一的 resize action。'}
- {'title': '渲染循环使用硬编码固定步长，动画速度依赖帧率', 'file': 'src/main.ts', 'description': 'elapsed = clamp(elapsed + 0.016, 0, 10) 与 mesh.rotation.y += 0.01 均为写死的帧增量。在高刷屏（120Hz）上旋转/动画速度会翻倍，低帧率下会变慢，表现不一致。', 'suggestion': '基于 requestAnimationFrame 的时间戳计算真实 dt（如 performance.now() 差值），所有动画量乘以 dt。'}
- {'title': 'clamp 在 VehiclePhysics 与 utils/math.ts 重复定义，违反「共享逻辑优先」', 'file': 'src/physics/VehiclePhysics.ts', 'description': 'VehiclePhysics.ts 内部又定义了私有 clamp/wrapAngle，与 src/utils/math.ts 已有的 clamp 重复，且 wrapAngle 也是可复用工具，直接违反项目 typescript-quality 规范第 1 条（重复逻辑 ≥2 处必须抽象到共享层）。', 'suggestion': '删除局部 clamp，从 utils/math.ts 导入；将 wrapAngle 沉淀到 utils/math.ts 供全局复用。'}
- {'title': 'VehiclePhysics.get state() 直接暴露内部可变引用，违反「状态管理不变性」', 'file': 'src/physics/VehiclePhysics.ts', 'description': 'get state() 返回 this._state 本身，update() 也返回同一 _state 引用。外部可绕过受控逻辑直接改写 position/heading/speed 等字段（例如破坏 wrapAngle 的不变量），状态变更不可追踪，违反 typescript-quality 规范第 3 条。', 'suggestion': '返回只读副本或结构化克隆（Readonly<VehicleState> + 克隆 position），状态变更仅通过 reset/update 等受控方法完成。'}
- {'title': '生产构建开启 sourcemap 泄露源码', 'file': 'vite.config.ts', 'description': 'build.sourcemap: true 会将完整 TypeScript 源码打包进生产产物，便于攻击者逆向，属于信息泄露风险。', 'suggestion': '生产构建关闭或改用 hidden-sourcemap，仅内部排查时按需生成。'}

## 🟢 建议（可选优化）
- {'title': 'document.getElementById 的 as HTMLCanvasElement 断言无类型守卫/注释', 'file': 'src/main.ts', 'description': 'document.getElementById("app") as HTMLCanvasElement | null 是从 HTMLElement|null 向 HTMLCanvasElement|null 的向下断言，若该 id 实际是 div 会在运行时静默通过编译却在 WebGLRenderer 处崩溃。规范要求「减少 as 断言」且必须附注释。', 'suggestion': '用 instanceof HTMLCanvasElement 类型守卫或显式校验元素类型后再使用。'}
- {'title': 'utils/math.ts 的 degToRad 未被使用（死代码）', 'file': 'src/utils/math.ts', 'description': '当前脚手架与仓库已有代码均未引用 degToRad，属于过早添加的未用导出。', 'suggestion': '删除或在确有调用方后再引入，保持工具层最小化。'}
- {'title': 'AmbientLight(1.4) + DirectionalLight(1.2) 强度叠加可能过曝', 'file': 'src/main.ts', 'description': 'three r155+ 默认物理光照与 tone mapping 下，环境光 1.4 加方向光 1.2 的叠加强度偏大，且未设置 renderer.toneMapping/outputColorSpace，画面可能发白。', 'suggestion': '适当降低强度或显式设置 toneMapping（如 ACESFilmicToneMapping）与 outputColorSpace = SRGBColorSpace。'}
- {'title': 'DirectionalLight 未显式设置 position，依赖默认值', 'file': 'src/main.ts', 'description': 'new THREE.DirectionalLight(0xffffff, 1.2) 未设置 position，光照方向依赖默认 (0,1,0) 朝向原点，语义不明确且易在后续调整中破坏。', 'suggestion': '显式 light.position.set(...) 并考虑加入光照阴影。'}
- {'title': '魔法数字 0.05/0.01 未命名，resize 监听器无清理', 'file': 'src/main.ts', 'description': 'lerp 系数 0.05、旋转增量 0.01 等散落为字面量，可读性差；window resize 监听器未提供 removeEventListener 的清理路径。', 'suggestion': '将可调参数提取为具名常量；如后续组件化，在卸载时移除监听器。'}

## 审查的代码
- index.html
- package.json
- README.md
- src/main.ts
- src/types/scene.ts
- src/utils/math.ts
- tsconfig.json
- vite.config.ts
- docs/Reqs/a8d042/48b6af/dev-notes.md
