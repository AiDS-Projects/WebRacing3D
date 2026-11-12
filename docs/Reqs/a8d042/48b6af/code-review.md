# 代码审查 — 初始化项目脚手架与技术栈

## 评分: 4/10 🚫 需修复

## 🔴 严重问题（必须修复）
- {'file': 'package.json', 'severity': 'critical', 'title': '缺少 three 依赖声明', 'description': "src/camera/FollowCamera.ts 与 src/physics/VehiclePhysics.ts 均 import 了 three（import * as THREE from 'three'），vite.config.ts 的 manualChunks 也引用了 'three'，但 package.json 的 dependencies/devDependencies 中完全没有 three。安装后 vite build 会因无法解析 'three' 而失败。", 'suggestion': '在 dependencies 中显式声明 "three": "^0.1xx.x" 并锁定版本；同时将 vite.config.ts 中 manualChunks 的 three 与实际依赖版本对齐。'}
- {'file': 'src/camera/FollowCamera.ts', 'severity': 'critical', 'title': 'DEFAULT_CONFIG 可变对象被所有实例共享，setOffset 污染全局默认值', 'description': 'DEFAULT_CONFIG.offset / lookAtOffset 是模块级 new THREE.Vector3(...) 单例，构造函数用浅拷贝 { ...DEFAULT_CONFIG, ...config } 合并，所有未显式传入 offset 的 FollowCamera 实例共享同一 Vector3 引用。setOffset() 通过 this.config.offset.copy(offset) 原地修改该共享对象，导致后续创建的实例默认 offset 被永久篡改，产生跨实例状态污染。', 'suggestion': '合并配置时深拷贝 Vector3（例如 new THREE.Vector3().copy(DEFAULT_CONFIG.offset)），或让每个实例独立 new 默认偏移；DEFAULT_CONFIG 应使用 Object.freeze 或工厂函数返回新对象。'}

## 🟡 警告（建议修复）
- {'file': 'package.json', 'severity': 'warning', 'title': '缺少 typescript 与 @types/node 依赖', 'description': '项目包含 .ts 源文件（src/main.ts、src/types/index.ts 等）且 vite.config.ts 使用了 node:url / import.meta.url，但 devDependencies 中无 typescript、@types/node。vite 用 esbuild 转译不会做类型检查，无法通过 tsc 校验，node:url 类型也会报错。', 'suggestion': '添加 "typescript" 与 "@types/node" 到 devDependencies，并在 scripts 中补充 "typecheck": "tsc --noEmit"。'}
- {'file': 'src/physics/VehiclePhysics.ts', 'severity': 'warning', 'title': 'get state() 直接返回内部可变对象，破坏封装', 'description': 'getter 返回 this.state 的原始引用而非副本，调用方可绕过 VehiclePhysics 直接修改 position/heading/speed 等内部状态；同时 reset() 会整体替换 this.state 为新对象，使此前通过 getter 持有的旧引用变为悬空快照，二者结合极易造成状态不一致。', 'suggestion': '返回只读快照（如 Object.freeze 副本或 Readonly<VehicleState> 类型），状态变更统一收敛到类内部方法，符合项目「状态管理不变性」规范。'}
- {'file': 'package.json', 'severity': 'warning', 'title': 'scripts 引用了不在交付白名单中的路径', 'description': '"screenshot": "playwright test tests/screenshots" 与 "verify": "node scripts/verify.mjs" 指向的 tests/screenshots 目录与 scripts/verify.mjs 均不在 deliveryWhitelist 白名单内，仓库中大概率不存在，执行会直接报错。', 'suggestion': '补全对应测试与校验脚本文件，或从 scripts 中移除尚未实现的命令，避免交付不可运行的脚本。'}
- {'file': 'package.json', 'severity': 'warning', 'title': 'generator 字段混入 npm 清单', 'description': 'package.json 中嵌入了大量非标准的 generator 工作流元数据（deliveryWhitelist、scaffoldOnly、validator 等），这些属于构建/编排工具内部配置，与 npm 包清单语义无关，会污染 manifests 并可能被工具误读。', 'suggestion': '将 generator 编排配置迁移到独立配置文件（如 generator.config.json 或 scripts 目录），package.json 仅保留 npm 标准字段。'}

## 🟢 建议（可选优化）
- {'file': 'src/camera/FollowCamera.ts', 'severity': 'suggestion', 'title': '构造函数未深拷贝传入的 Vector3 配置', 'description': '即使调用方显式传入 config.offset，也仅保存了外部 Vector3 的引用，调用方后续修改该 Vector3 会静默影响相机行为，缺少所有权边界。', 'suggestion': '构造时对 offset / lookAtOffset 做 copy() 拷贝，明确相机内部拥有独立副本。'}
- {'file': 'src/camera/FollowCamera.ts', 'severity': 'suggestion', 'title': 'update 每帧反复 clone 与分配 Vector3', 'description': 'updatePosition / updateLookAt 每次调用都执行 offset.clone()、lookAtOffset.clone()，在每帧热路径产生大量临时对象分配与 GC 压力。', 'suggestion': '复用预分配的临时 Vector3 成员变量（desired / lookAt 缓存），避免每帧 new。'}
- {'file': 'src/physics/VehiclePhysics.ts', 'severity': 'suggestion', 'title': '魔法数值缺少语义化注释', 'description': 'DEFAULT_VEHICLE_CONFIG 中 turnRate: 2.6、steerSpeed: 6、grip: 0.85、slipFactor: 0.6 等均为硬编码魔法值，缺乏单位或调参依据说明，后续调优难以理解每个系数的物理含义。', 'suggestion': '为关键系数补充注释说明其物理意义与调参经验值范围，或抽离为可配置的调参表。'}
- {'file': 'vite.config.ts', 'severity': 'suggestion', 'title': 'build.target 与依赖兼容性未对齐', 'description': "build.target 固定为 'es2020'，但 three 新版本可能输出更高版本语法，且未配置 cssCodeSplit/sourcemap 等产物选项，构建策略较单一。", 'suggestion': '根据 three 实际版本确认 target 兼容性，并考虑按环境补充 sourcemap 与 minify 策略。'}

## 审查的代码
- vite.config.ts
- package.json
- docs/Reqs/a8d042/48b6af/dev-notes.md
