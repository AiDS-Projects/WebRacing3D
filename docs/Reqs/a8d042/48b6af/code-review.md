# 代码审查 — 初始化项目脚手架与技术栈

## 评分: 4/10 🚫 需修复

## 🔴 严重问题（必须修复）
- {'file': 'package.json', 'line': None, 'severity': 'critical', 'title': '运行时依赖与工具链依赖全部缺失', 'description': "代码中 `src/main.ts` 使用 `import * as THREE from 'three'`，`src/types/index.ts` 使用 `import type * as THREE from 'three'`，且项目用 TypeScript 编写，但 package.json 的 devDependencies 仅包含 `@playwright/test` 与 `vite`，没有 `dependencies` 字段，也缺少 `three`、`typescript`、`@types/three`。安装后 `vite build` 与类型检查将直接失败。", 'suggestion': '补充 `three`、`typescript`、`@types/three`（three 为运行时依赖，建议放入 dependencies 或至少 devDependencies），并确保 `npm install` 后能通过构建。'}
- {'file': 'src/index.ts', 'line': 1, 'severity': 'critical', 'title': 'src/index.ts 不是可编译的源代码', 'description': '该文件内容是一段解释「无法按要求修改」的英文对话文本（含 Markdown 表格、反引号、`src/index.ts:245` 引用等），不是合法的 TypeScript 源码，无法通过编译。且该文件路径不在 deliveryWhitelist 与 validator.whitelist 中（白名单只有 `src/types/index.ts`、`src/utils/index.ts` 等），与 generator 配置自相矛盾。', 'suggestion': '删除该占位文本，或按脚手架设计落地为真正的入口/导出文件；确保生成器白名单与实际文件树一致。'}
- {'file': 'package.json', 'line': None, 'severity': 'critical', 'title': 'generator 配置与 src/index.ts 语义不一致导致路由失效', 'description': 'package.json 的 generator.routing.skeletonMarkerFiles 为 [vite.config.ts, index.html, src/main.ts]，而 src/index.ts 文本声称存在 253 行渲染应用与入口 bootstrap，二者描述的产物完全不同。generator 是实际 source of truth，但清理目录 `removeDirectories` 声明删除 4 个目录（camera/physics/player/race），实际磁盘上还存在 `src/camera/FollowCamera.ts`、`src/player/PlayerCar.ts`、`src/race/LapTracker.ts`，说明 preGeneration cleanup 并未实际执行或未生效。', 'suggestion': '统一 generator 配置与实际文件树；确认 cleanup 是否真正运行，并明确 src/index.ts 的归属（入口 or 类型聚合），消除路由判断歧义。'}

## 🟡 警告（建议修复）
- {'file': 'vite.config.ts', 'line': None, 'severity': 'warning', 'title': "base: './' 相对路径可能导致部署路由问题", 'description': "`base: './'` 会生成相对路径资源引用，在 SPA 深层路由刷新或带 history 路由时，静态资源路径会相对于当前 URL 解析而 404；若部署在根路径应使用 '/'。", 'suggestion': '根据实际部署路径确定 base，或改用环境变量 `process.env.BASE_URL` 按需配置。'}
- {'file': 'vite.config.ts', 'line': None, 'severity': 'warning', 'title': '开发服务器暴露到公网且开启全量 CORS', 'description': "`server.host: '0.0.0.0'` 使开发服务器监听所有网卡，配合 `cors: true` 允许任意来源跨域访问，存在被局域网扫描/注入的暴露风险。", 'suggestion': "默认 `host: '127.0.0.1'`，仅在需要局域网联调时显式开启；cors 按需限定 origin。"}
- {'file': 'vite.config.ts', 'line': None, 'severity': 'warning', 'title': 'chunkSizeWarningLimit: 1024 掩盖了 three 体积问题', 'description': '将警告阈值抬高到 1024KB 只是屏蔽提示，并未解决 three 全量引入导致的包体积问题；`manualChunks` 单独拆分 three 仍会产出超大 chunk。', 'suggestion': "使用按需导入（`import { Scene } from 'three'`）配合 tree-shaking，或配置更细的 manualChunks，而非简单调高阈值。"}
- {'file': 'package.json', 'line': None, 'severity': 'warning', 'title': '包名与描述和实际项目不符', 'description': 'name 为 `ads-game-ui`，description 为「基础游戏 UI：速度表、当前圈数、计时器」，与 WebRacing3D 仓库及脚手架（Three.js 场景/相机/物理/赛车）定位不一致，易误导维护者。', 'suggestion': '统一 name/description 与仓库及脚手架目标一致。'}
- {'file': 'package.json', 'line': None, 'severity': 'warning', 'title': 'playwright 脚本缺少配置文件与测试目录', 'description': 'scripts 中定义 `test`、`test:headed`、`test:ui`、`screenshot`、`report` 均依赖 `playwright test`，但未提供 `playwright.config.ts`，且 `screenshot` 指向 `tests/screenshots` 目录在当前产物中未见。', 'suggestion': '补齐 playwright.config.ts 与测试目录，或移除未实现的脚本，避免 `npm test` 直接报错。'}
- {'file': 'package.json', 'line': None, 'severity': 'warning', 'title': 'generator 编排配置堆叠在 package.json 中', 'description': 'cleanup/routing/base_stages/validator/rework 等生成器状态机配置全部以 JSON 形式嵌入 package.json，属于非标准做法，可维护性差且易与真实产物脱节（已出现上述不一致）。', 'suggestion': '将生成器配置抽离到独立的配置模块或脚本中，保持 package.json 职责单一。'}

## 🟢 建议（可选优化）
- {'file': 'src/types/index.ts', 'line': None, 'severity': 'suggestion', 'title': '类型模块混入运行时常量', 'description': '`src/types/index.ts` 以 `import type` 开头、定位为纯类型层，却导出了运行时常量 `PRE_GENERATION_CLEANUP_DIRS` 与状态机类型，违背「类型与实现分离」边界。', 'suggestion': '将运行时常量移到 `src/utils/` 或独立常量模块，types 目录只保留纯类型声明。'}
- {'file': 'src/types/index.ts', 'line': None, 'severity': 'suggestion', 'title': '索引签名可用 Record 替代', 'description': '`AssetMap` 与 `EventMap` 使用 `[id: string]: ...` 索引签名，语义不如 `Record<string, X>` 明确，且对 null/undefined 安全提示较弱。', 'suggestion': '改用 `Record<string, ...>` 并配合 `strict`/`noUncheckedIndexedAccess` 提升类型安全。'}
- {'file': 'src/types/index.ts', 'line': None, 'severity': 'suggestion', 'title': 'Vec3 与 THREE.Vector3 语义重复', 'description': '自定义可序列化 `Vec3` 与 THREE.Vector3 概念重叠，缺少说明为何需要可序列化版本，易在使用时混淆转换。', 'suggestion': '在注释中明确 Vec3 的序列化用途，或提供 Vec3 与 THREE.Vector3 的转换工具函数。'}
- {'file': 'src/types/index.ts', 'line': None, 'severity': 'suggestion', 'title': '注释与实际目录数量不符', 'description': '清理逻辑相关文档声称「五个错误目录」，但 `PRE_GENERATION_CLEANUP_DIRS` 仅列出 4 个（camera/physics/player/race）。', 'suggestion': '修正注释为「四个」或补齐缺失目录，保持文档与代码一致。'}
- {'file': 'vite.config.ts', 'line': None, 'severity': 'suggestion', 'title': 'assetsInclude 对 gltf/glb/ktx2 处理语义不完整', 'description': 'gltf/glb 在 Vite 中默认按 URL 资源处理即可，显式声明无额外收益；ktx2 纹理实际需要 BasisTextureLoader 运行时解码，仅加入 assetsInclude 无法保证正确加载。', 'suggestion': '精简 assetsInclude 为真正需要按静态资源处理的扩展，并在文档中说明 ktx2 的加载链路。'}

## 审查的代码
- vite.config.ts
- package.json
- src/main.ts
- src/index.ts
- src/types/index.ts
- src/types/input.ts
- docs/Reqs/a8d042/48b6af/dev-notes.md
