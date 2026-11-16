# 代码审查 — 初始化项目脚手架与技术栈

## 评分: 4/10 🚫 需修复

## 🔴 严重问题（必须修复）
- {'file': 'src/camera/FollowCamera.ts', 'location': 'DEFAULT_CONFIG 定义与构造函数', 'title': 'DEFAULT_CONFIG 中 Vector3 对象被多实例共享，setOffset 原地修改导致实例间状态污染', 'description': '模块级常量 DEFAULT_CONFIG 的 offset / lookAtOffset 是 THREE.Vector3 实例。构造函数用 `{ ...DEFAULT_CONFIG, ...config }` 只做浅拷贝，所有使用默认配置的 FollowCamera 实例会共享同一个 Vector3 引用；setOffset() 通过 `this.config.offset.copy(offset)` 原地修改该共享对象，导致其他已创建实例的相机偏移被意外篡改，属跨实例数据污染（运行时逻辑错误，非仅在极端条件下触发）。', 'suggestion': '构造函数中对引用类型字段做深拷贝，例如：`offset: new THREE.Vector3().copy(config.offset ?? DEFAULT_CONFIG.offset)`，lookAtOffset 同理；或改为按需惰性创建。'}
- {'file': 'package.json', 'location': 'scripts.build / tsconfig.json', 'title': '构建流程不执行类型检查，TS 类型错误直接流入产物', 'description': "build 脚本仅为 `vite build`，未执行 `tsc`；tsconfig.json 配置 `noEmit: true` 仅服务于编辑器与 IDE，构建/CI 环节无任何类型校验。这与项目自身'类型安全边界'规范（禁止 any、外部数据必须运行时校验）直接冲突，类型错误、any 泄漏、非法断言都无法被自动化拦截。", 'suggestion': '新增 `"typecheck": "tsc --noEmit"` 脚本，并将 build 改为 `tsc --noEmit && vite build`，或在 CI 中强制运行 typecheck。'}

## 🟡 警告（建议修复）
- {'file': 'vite.config.ts', 'location': 'build.sourcemap', 'title': '生产构建开启 sourcemap，暴露源码', 'description': '`build.sourcemap: true` 会在 dist 中生成 .map 文件，向生产环境泄露完整源代码，增大攻击面与逆向风险，且无明显使用场景说明。', 'suggestion': '改为 `sourcemap: false` 或仅用环境变量控制（如 `process.env.SOURCEMAP`），或使用 hidden sourcemap 仅上传至监控平台。'}
- {'file': 'vite.config.ts', 'location': 'build.chunkSizeWarningLimit', 'title': 'chunkSizeWarningLimit 提高到 1500 掩盖真实体积告警', 'description': "将阈值调高到 1500KB 以'适配 three.js'，本质是关闭了 chunk 体积告警。后续业务代码膨胀、依赖增多时不会再有预警，属于用配置掩盖问题而非解决。", 'suggestion': '保留默认 500，改用 manualChunks 或按需引入 three 子模块拆分，必要时用 rollup 插件分析真实体积。'}
- {'file': 'vite.config.ts', 'location': 'server.open / server.host', 'title': 'server.open: true 在无头/远程环境会产生副作用', 'description': '`open: true` 会在每次启动时尝试打开系统默认浏览器，在 CI、SSH、容器等无 GUI 环境下会报错或产生非预期行为；`host: true` 暴露到局域网也缺少访问控制说明。', 'suggestion': "用 `open: process.env.OPEN_BROWSER === '1'` 之类的开关，或在 CI 环境禁用。"}
- {'file': 'playwright.config.ts', 'location': 'projects', 'title': '仅配置 chromium 单一浏览器，测试覆盖不足', 'description': 'projects 只包含 chromium，未覆盖 webkit/firefox。对依赖 three.js/WebGL 的游戏 UI，不同浏览器 GPU 与渲染实现差异大，单浏览器测试容易漏掉兼容性问题。', 'suggestion': '补充 webkit、firefox 项目；对 WebGL 不稳定的浏览器可加 testIgnore 或独立配置。'}
- {'file': 'package.json', 'location': 'generator 字段', 'title': 'package.json 内嵌大量生成器编排元数据，污染包清单', 'description': 'generator 字段包含 workOrderType、classifier、validator、routing 等内部脚手架编排逻辑，与运行时依赖声明混在 package.json 中。其中 `removeDirectories`/`businessDirectories` 要求删除 src/camera、src/physics、src/race 等目录，而仓库实际又存在 FollowCamera.ts、VehiclePhysics.ts，且 contentSemanticGate 明确 ban 掉 `VehiclePhysicsConfig` 等标识符——配置与已交付代码语义冲突，维护者极易误读。', 'suggestion': '将 generator 元数据移出 package.json（如独立的 generator.config.json），并消除 scaffold 规则与现有业务代码的相互矛盾。'}

## 🟢 建议（可选优化）
- {'file': 'index.html', 'location': '<html lang="en">', 'title': '页面语言标记与实际内容语言不符', 'description': 'html 使用 lang="en"，但项目描述、注释、面向用户的文案均为中文，屏幕阅读器与翻译工具会按英文处理，造成可访问性问题。', 'suggestion': '改为 lang="zh-CN"。'}
- {'file': 'index.html', 'location': 'viewport meta', 'title': '禁止用户缩放的 viewport 存在可访问性隐患', 'description': '`maximum-scale=1.0, user-scalable=no` 禁止用户手动缩放，对低视力用户不友好，与 WCAG 无障碍要求冲突。', 'suggestion': '移除 maximum-scale 与 user-scalable 限制，保留 width 与 initial-scale。'}
- {'file': 'tsconfig.json', 'location': 'compilerOptions', 'title': '缺少 noImplicitOverride 等严格选项', 'description': '已启用 strict、noUnusedLocals 等，但缺少 `noImplicitOverride`，子类重写父类方法未加 override 时无法在编译期发现签名不匹配或意外覆盖。', 'suggestion': '补充 `noImplicitOverride: true`，并视需要加入 `noPropertyAccessFromIndexSignature`。'}
- {'file': 'src/camera/FollowCamera.ts', 'location': 'setOffset 方法', 'title': '配置项 setter 不完整，且 update(dt) 未处理非正 dt', 'description': '仅提供 setOffset，缺少 setLookAtOffset/setPositionLerp 等对应 setter；同时 update(dt) 中若 dt 为 0 或负值，`1 - Math.exp(-lerp*dt)` 会产生 t<=0 甚至 t>1 的外推，导致相机抖动或反向过度插值。', 'suggestion': '补充完整配置 setter，并在 update 入口对 dt 做 `Math.max(0, dt)` 归一处理。'}
- {'file': 'src/physics/VehiclePhysics.ts', 'location': '文件截断处', 'title': '存在未闭合/悬空的 JSDoc 注释片段', 'description': '展示片段末尾出现孤立的 `/** ` 注释头且未见闭合，存在注释不完整或代码缺失的风险。', 'suggestion': '核对源文件该处注释是否完整闭合，避免遗留半截注释影响文档生成与阅读。'}

## 审查的代码
- tsconfig.json
- vite.config.ts
- package.json
- index.html
- playwright.config.ts
- docs/Reqs/a8d042/48b6af/dev-notes.md
