# 代码审查 — 初始化项目脚手架与技术栈

## 评分: 3/10 🚫 需修复

## 🔴 严重问题（必须修复）
- {'level': 'critical', 'file': 'package.json', 'message': '缺少运行时/构建依赖：vite.config.ts 的 optimizeDeps.include 与 manualChunks 均引用 \'three\'，src/main.ts 执行 `import * as THREE from \'three\'`，但 devDependencies 中只有 @playwright/test 和 vite，未声明 three、typescript、@types/node（tsconfig.node.json 的 types:["node"] 也依赖 @types/node）。dev/build 将直接报模块解析失败，脚手架无法启动。'}
- {'level': 'critical', 'file': 'tsconfig.node.json', 'message': '"composite": true 与 "noEmit": true 互斥。composite 项目要求可被引用并需产生声明/构建信息，noEmit 与之冲突（TS 会报配置错误），会导致该 tsconfig 失效、类型检查/引用解析异常。'}
- {'level': 'critical', 'file': 'index.html', 'message': '脚手架契约违约：package.json.generator.skeleton 明确要求 mainTs 仅 sceneInitPlaceholderOnly，且 bannedBusinessModules 禁止 camera/physics/player/race 业务模块，但 index.html 内联脚本实现了完整业务逻辑（速度表绘制、圈数/计时器、键盘加速/刹车状态机）。这超出「初始化项目脚手架」范围，且业务代码未按交付白名单拆分，会被验收阶段判定为越界。'}

## 🟡 警告（建议修复）
- {'level': 'warning', 'file': 'package.json', 'message': 'build 脚本仅为 `vite build`，未执行 tsc 类型检查，类型错误无法在构建阶段拦截；应增加 typecheck 脚本并在 build/CI 中串联。'}
- {'level': 'warning', 'file': 'vite.config.ts', 'message': "别名 '@types' 与 npm 的 '@types/*' 类型包作用域重名，容易在 import '@types/...' 时产生歧义或与 TS 模块解析冲突，建议改名（如 '@typeDefs'）。"}
- {'level': 'warning', 'file': 'index.html', 'message': '业务逻辑与样式以 <script>/<style> 内联在 index.html，完全绕过项目 TypeScript 质量规范（类型安全边界、禁止 any、共享逻辑沉淀），无法被 ESLint/TS 检查，后续难以维护与复用。'}
- {'level': 'warning', 'file': 'index.html', 'message': 'canvas 声明 width/height=680 但 CSS 强制 width:100%（max-width 340px），未按 devicePixelRatio 缩放，高 DPI 屏幕下表盘刻度与弧线会明显模糊。'}
- {'level': 'warning', 'file': 'index.html', 'message': '大量魔法值散落：MAX_SPEED/ACCEL/BRAKE/DRAG 等物理常量、颜色分区 [0,80]/[80,160]/[160,MAX_SPEED]、START_DEG=135/SWEEP_DEG=270 均硬编码在 IIFE 内，无配置来源，与 src/types 中已声明的 RendererConfig/SceneConfig 等配置体系脱节。'}
- {'level': 'warning', 'file': 'index.html', 'message': '空格键开始/重置（提示文案声明）但未调用 e.preventDefault()，页面存在滚动风险；且内联脚本使用 ES5 的 var 与 IIFE，与项目 TS 严格规范不一致。'}

## 🟢 建议（可选优化）
- {'level': 'suggestion', 'file': 'index.html', 'message': '将 <style> 与 <script> 抽取为独立文件（如 src/ui/ 或 styles/），与组件文件 PascalCase、样式同名规范保持一致。'}
- {'level': 'suggestion', 'file': 'index.html', 'message': '为开始/重置按钮补充 aria-label 或 role，状态变更时更新 aria-pressed/disabled 语义，提升可访问性。'}
- {'level': 'suggestion', 'file': 'src/types/index.ts', 'message': 'ColorLike 中 number 类型未说明其语义（THREE.Color 的十六进制整型），建议补充注释；toneMapping 使用 THREE.ToneMapping 枚举作为类型时建议约束为具体枚举成员联合类型以收紧边界。'}
- {'level': 'suggestion', 'file': 'src/types/index.ts', 'message': '骨架阶段定义了 CameraConfig/PerspectiveCameraConfig 等相机类型，与 generator 中禁止 camera 业务模块的约束存在语义冲突，建议确认这些类型是否应延后至对应业务工单引入。'}
- {'level': 'suggestion', 'file': 'vite.config.ts', 'message': 'manualChunks 仅将 three 拆分为单 chunk，收益有限；可考虑按业务域拆分，或降低 chunkSizeWarningLimit=1500 以暴露真实分包告警。'}

## 审查的代码
- tsconfig.node.json
- vite.config.ts
- package.json
- index.html
- src/main.ts
- src/types/index.ts
- docs/Reqs/a8d042/48b6af/dev-notes.md
