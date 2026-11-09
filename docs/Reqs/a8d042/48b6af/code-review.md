# 代码审查 — 初始化项目脚手架与技术栈

## 评分: 5/10 🚫 需修复

## 🔴 严重问题（必须修复）
- {'file': 'vite.config.ts', 'line': 7, 'message': 'package.json 声明 "type": "module"，vite.config.ts 以 ESM 加载，但代码使用 CJS 专有的 __dirname（第 7 行起多处 resolve(__dirname, \'src\')）。ESM 环境下 __dirname 未定义，Vite 加载配置时会抛 ReferenceError: __dirname is not defined，导致 dev/build/preview 全部无法启动。应改用 fileURLToPath(new URL(\'./src\', import.meta.url))。', 'suggestion': "import { fileURLToPath, URL } from 'node:url'; 用 fileURLToPath(new URL('./src', import.meta.url)) 替换所有 resolve(__dirname, ...)"}

## 🟡 警告（建议修复）
- {'file': 'index.html', 'line': 24, 'message': '#app 设置 position:fixed; inset:0; z-index:-1，负 z-index 使画布渲染到 body 背景（#f0f2f5）之后，Three.js canvas 很可能被背景遮挡而不可见。应使用 z-index:0 或移除负值，并让 .container 处于更高的正层级。', 'suggestion': '将 #app 的 z-index 改为 0（或移除），.container 设为 position:relative; z-index:1。'}
- {'file': 'src/main.ts', 'line': 1, 'message': '违反「共享逻辑优先」规则：src/types/scene.ts 已定义 CameraConfig、SceneConfig、SceneContext 等共享类型，但 main.ts 重新内联定义了 CameraConfig、AppConfig、SceneSize 等本地接口，造成类型定义重复且共享层形同虚设。后续场景模块维护两套类型极易漂移。', 'suggestion': '删除 main.ts 内联类型，改从 src/types/scene.ts 导入 SceneInitOptions / CameraConfig / RendererConfig 等。'}
- {'file': '.eslintrc.cjs', 'line': 1, 'message': 'ESLint 配置引用了 @typescript-eslint/parser、plugin:@typescript-eslint、prettier(eslint-config-prettier)，但这些包均未在 package.json devDependencies 中声明，且 scripts 中没有任何 lint/format 命令。配置文件是死配置，无法执行，且会误导后续开发者以为已接入 lint。', 'suggestion': '补齐 @typescript-eslint/parser、@typescript-eslint/eslint-plugin、eslint、eslint-config-prettier、prettier 依赖，并在 scripts 增加 lint/format 命令。'}
- {'file': 'tsconfig.json', 'line': 24, 'message': 'include 仅含 ["src"]，vite.config.ts 不在类型检查范围内，__dirname 等配置错误无法被 tsc 捕获（本案例中该错误正是因此漏检）。', 'suggestion': '将 vite.config.ts 纳入 include，或单独配置 tsconfig.node.json 供配置类文件使用。'}
- {'file': 'src/main.ts', 'line': 2, 'message': 'OrbitControls 被导入但未在可见代码中使用，tsconfig 开启 noUnusedLocals:true 会导致 build(tsc) 阶段编译失败。同时 createDemoContent/createLights 中大量硬编码魔法值（0x1a1a2e、0x2e2e4a、shadow.mapSize 2048、Math.min(devicePixelRatio,2) 的 2、相机 fov/near/far）。', 'suggestion': '移除未使用导入或将 OrbitControls 接入；将颜色/阴影分辨率/像素比上限等抽为常量或配置项。'}
- {'file': 'src/index.ts', 'line': 1, 'message': "export * from './main' 无效：main.ts 是副作用型入口，无任何具名导出，该 re-export 导出空集合，反而会把 main.ts 的启动副作用扩散到任何 import 该模块的消费者。", 'suggestion': "明确 index.ts 的职责，只 re-export 类型与工具（types/scene、utils/math），移除对 './main' 的 re-export。"}
- {'file': '.prettierrc', 'line': 2, 'message': 'Prettier 配置 semi:true，但 src/types/scene.ts 采用无分号风格（import 与部分声明无分号），与 src/utils/math.ts 的分号风格不一致，说明格式化未统一执行。', 'suggestion': '统一代码风格：要么改为 semi:false，要么对 types/scene.ts 执行 prettier 格式化。'}

## 🟢 建议（可选优化）
- {'file': 'src/utils/math.ts', 'line': 42, 'message': 'smoothstep(edge0, edge1, x) 未处理 edge0===edge1 的情况，会除零产生 NaN；mapRange 虽已处理 inMin===inMax，但返回 outMin 这一约定未在注释说明，边界行为不直观。', 'suggestion': 'smoothstep 在 edge0===edge1 时返回 0；为 mapRange 的退化分支补充注释说明。'}
- {'file': 'src/utils/math.ts', 'line': 57, 'message': 'distance 函数是 2D 距离却使用了通用命名，与 distance3 命名不对称，易误用；建议命名 distance2 或在文档中明确维度。', 'suggestion': '重命名为 distance2 以与 distance3 对齐，减少误用。'}
- {'file': 'src/main.ts', 'line': 15, 'message': 'getSize 使用 container.clientWidth || window.innerWidth，当容器合法宽度为 0（隐藏/初始化中）时会静默回退到窗口尺寸，且 width/height 相除未防 height 为 0 的除零风险。', 'suggestion': '显式判断 width/height 是否有效，height 为 0 时回退默认宽高比。'}
- {'file': 'package.json', 'line': 8, 'message': '"build": "tsc && vite build" 与 "typecheck": "tsc --noEmit" 语义重叠，tsconfig 已设 noEmit:true，build 中的 tsc 仅做类型检查但命名上易被误认为会产出文件。', 'suggestion': 'build 改为 "tsc --noEmit && vite build" 以消除歧义。'}
- {'file': 'src/utils/math.ts', 'line': 31, 'message': 'randomInt(min, max) 采用 max+1 再 floor 的实现，当 max 接近 Number.MAX_SAFE_INTEGER 或为极大值时 max+1 会丢失精度，返回区间上限错误。', 'suggestion': '改用 Math.floor(min + Math.random() * (max - min + 1)) 并限制输入范围，或对极端值做说明。'}

## 审查的代码
- package.json
- tsconfig.json
- vite.config.ts
- index.html
- src/types/scene.ts
- src/utils/math.ts
- .eslintrc.cjs
- .prettierrc
- src/index.ts
- docs/Reqs/a8d042/48b6af/dev-notes.md
