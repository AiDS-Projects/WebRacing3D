# 代码审查 — 初始化项目脚手架与技术栈

## 评分: 5/10 🚫 需修复

## 🔴 严重问题（必须修复）
- {'file': 'src/camera/FollowCamera.ts', 'line': 'DEFAULT_CONFIG 与 setOffset()', 'title': '默认配置中的 Vector3 为共享可变引用，setOffset 会污染全局默认值', 'description': 'DEFAULT_CONFIG.offset/lookAtOffset 是模块级单例 Vector3。构造时 `this.config = { ...DEFAULT_CONFIG, ...config }` 是浅拷贝，未传 offset 的实例其 this.config.offset 与 DEFAULT_CONFIG.offset 是同一引用。调用 setOffset() 时执行 `this.config.offset.copy(offset)`，会直接改写 DEFAULT_CONFIG.offset，导致后续所有使用默认配置的实例初始偏移被永久篡改，产生跨实例状态污染。', 'suggestion': '构造函数内深拷贝：`offset: config.offset ? config.offset.clone() : new THREE.Vector3(0,5.5,-10)`，或用工厂函数生成默认值，避免共享可变对象。'}
- {'file': 'package.json / tsconfig.json', 'line': 'build 脚本与 compilerOptions', 'title': '`tsc && vite build` 缺少 noEmit，编译产物会写入 src 源码树', 'description': 'tsconfig 未设置 `noEmit: true` 且无 `outDir`，执行 `npm run build` 时 tsc 会在 src/ 目录就地生成 main.js、index.js、utils/*.js 及 .d.ts/.map 文件，污染源码目录，并可能被误导入或误提交。这是脚手架构建管线的缺陷。', 'suggestion': '改为 `tsc --noEmit && vite build`，或在 compilerOptions 中显式设置 `"noEmit": true`。'}

## 🟡 警告（建议修复）
- {'file': 'src/physics/VehiclePhysics.ts', 'line': 'get state()', 'title': 'getter 直接暴露可变内部状态对象，违反状态管理不变性规则', 'description': '`get state()` 返回内部 state 引用，调用方可直接执行 `physics.state.speed = 999`、`physics.state.steer = 5`，绕过 update() 中的抓地力、转向、速度钳制等所有约束，破坏物理不变量（speed 应限制在 [-maxReverse, maxSpeed]、steer 应在 [-1,1]）。', 'suggestion': '返回只读快照或结构化克隆（如 `return { ...this.state, position: { ...this.state.position } }`），或声明为 `Readonly<VehicleState>` 并深冻结 position 子对象。'}
- {'file': 'src/utils/math.ts 与 src/physics/VehiclePhysics.ts', 'line': 'clamp 函数', 'title': 'clamp 逻辑重复，违反共享逻辑优先规则', 'description': 'utils/math.ts 已有泛型 clamp(value,min,max)，VehiclePhysics.ts 内又内联定义了局部 clamp(v,min,max)，属于 ≥2 处重复逻辑，未沉淀到共享层。wrapAngle 同样属于应归入 utils 的通用数学工具，却内联在物理模块中。', 'suggestion': '删除 VehiclePhysics.ts 中的局部 clamp，改从 `@/utils` 导入；将 wrapAngle 抽到 utils/math.ts 统一导出。'}
- {'file': 'src/main.ts', 'line': 'bootstrap() 与 resize 监听', 'title': '缺少资源释放与事件监听清理，存在内存/WebGL 上下文泄漏', 'description': 'resize 监听器通过匿名函数注册且永不移除；renderer、scene、几何体/材质未调用 dispose()。已定义的 Lifecycle.dispose() 契约在装配层未落地，在 SPA 卸载或热更新场景下会持续累积 WebGL 上下文与监听器。', 'suggestion': 'bootstrap 返回/暴露清理函数，移除 resize 监听，并递归遍历 scene 调用 geometry/material 的 dispose() 及 renderer.dispose()。'}
- {'file': 'tsconfig.json', 'line': 'include 字段', 'title': 'include 仅含 src，vite.config/playwright.config/tests 不在类型检查范围内', 'description': '`include: ["src"]` 导致 `tsc` 不会检查 vite.config.ts、playwright.config.ts 与 tests/*.spec.ts，这些文件的类型错误无法在构建期暴露；@types/node 虽已安装却未被 tsc 覆盖到配置文件。', 'suggestion': '将 include 扩展为 ["src", "vite.config.ts", "playwright.config.ts", "tests"]，或单独为配置文件建立 tsconfig.node.json。'}
- {'file': 'index.html', 'line': 'viewport meta', 'title': 'maximum-scale=1.0 / user-scalable=no 禁用缩放，损害无障碍性', 'description': '禁止用户缩放页面违反 WCAG 无障碍标准，对视力障碍用户不友好，且该设置对 3D 游戏类应用并非必要。', 'suggestion': '移除 maximum-scale 与 user-scalable=no，仅保留 width=device-width, initial-scale=1.0。'}
- {'file': 'src/utils/loop.ts', 'line': 'tick 回调', 'title': 'onFrame 抛出异常会导致循环静默终止', 'description': '`this.onFrame(...)` 之后才调用 `requestAnimationFrame(tick)`，若回调内部抛错，下一次 raf 不会注册，running 仍为 true 但循环已停止，无任何错误日志，难以排查。', 'suggestion': '用 try/finally 包裹，确保 requestAnimationFrame(tick) 始终执行，或在 catch 中记录错误后恢复。'}

## 🟢 建议（可选优化）
- {'file': 'src/physics/VehiclePhysics.ts', 'line': 'Vec2 接口', 'title': 'Vec2 应沉淀到共享类型层', 'description': 'Vec2 是通用二维向量类型，定义在物理模块内不利于其他领域（如赛道、渲染）复用，应归入 src/types。', 'suggestion': '将 Vec2 移至 src/types/index.ts 统一导出。'}
- {'file': 'src/utils/loop.ts', 'line': 'stop() 与 Lifecycle 契约', 'title': '命名不一致：AnimationLoop 用 stop，Lifecycle 用 dispose', 'description': 'Lifecycle 接口约定 dispose()，AnimationLoop 却仅提供 stop()，语义不统一，装配层若想统一走 dispose 需额外适配。', 'suggestion': '为 AnimationLoop 增加 dispose()（内部调用 stop 并置空回调）或统一命名。'}
- {'file': 'src/main.ts', 'line': 'setPixelRatio', 'title': 'devicePixelRatio 可能为 0 的边界未处理', 'description': '`Math.min(window.devicePixelRatio, 2)` 在极少数环境下 devicePixelRatio 可能为 0，导致 setPixelRatio(0) 异常。', 'suggestion': '使用 `Math.max(1, Math.min(window.devicePixelRatio, 2))` 兜底。'}
- {'file': 'index.html', 'line': 'lang 属性', 'title': 'lang="en" 与中文注释/内容不匹配', 'description': '页面声明为英文语言，但代码注释与面向用户文案为中文，语义不一致。', 'suggestion': '统一为 lang="zh-CN" 或保持英文注释。'}
- {'file': '.gitignore', 'line': '忽略规则', 'title': '缺少常见忽略项', 'description': '未忽略 .env*、*.local、coverage、.DS_Store、IDE 目录（.vscode/.idea）等，存在误提交风险。', 'suggestion': '补充 .env*、*.local、coverage、.DS_Store、.vscode/、.idea/ 等条目。'}

## 审查的代码
- package.json
- tsconfig.json
- vite.config.ts
- index.html
- playwright.config.ts
- .gitignore
- src/main.ts
- src/index.ts
- src/types/index.ts
- src/utils/index.ts
- src/utils/math.ts
- src/utils/loop.ts
- tests/app.spec.ts
- docs/Reqs/a8d042/48b6af/dev-notes.md
