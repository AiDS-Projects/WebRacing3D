# 开发笔记 — 初始化项目脚手架与技术栈

> 2026-11-10 00:46 | LLM

## 产出文件
- [package.json](/app#repo?file=package.json) (456 chars)
- [tsconfig.json](/app#repo?file=tsconfig.json) (583 chars)
- [vite.config.ts](/app#repo?file=vite.config.ts) (903 chars)
- [index.html](/app#repo?file=index.html) (842 chars)
- [src/types/scene.ts](/app#repo?file=src/types/scene.ts) (3040 chars)
- [src/utils/math.ts](/app#repo?file=src/utils/math.ts) (2101 chars)
- [.eslintrc.cjs](/app#repo?file=.eslintrc.cjs) (733 chars)
- [.prettierrc](/app#repo?file=.prettierrc) (392 chars)
- [src/index.ts](/app#repo?file=src/index.ts) (84 chars)

## 自测: 自测 7/7 通过 ✅

| 检查项 | 结果 | 说明 |
|--------|------|------|
| 文件产出 | ✅ | 9 个文件 |
| 入口文件 | ✅ | 存在 |
| 代码非空 | ✅ | 通过 |
| 语法检查 | ✅ | 通过 |
| 文件名规范 | ✅ | 全英文 |
| 磁盘落地 | ✅ | 9 个文件已落盘 |
| 页面截图 | ✅ | 1 张截图 |

## 代码变更 (Diff)

### package.json (修改)
```diff
--- a/package.json
+++ b/package.json
@@ -1,20 +1,21 @@
 {

-  "name": "vite-ts-threejs-scaffold",

+  "name": "threejs-scaffold",

+  "private": true,

   "version": "0.1.0",

-  "private": true,

   "type": "module",

-  "description": "Vite + TypeScript + Three.js 项目骨架，建立目录结构、类型定义与共享工具层",

+  "description": "初始化项目脚手架与技术栈 — Vite + TypeScript + Three.js 项目骨架",

   "scripts": {

     "dev": "vite",

     "build": "tsc && vite build",

-    "preview": "vite preview"

+    "preview": "vite preview",

+    "typecheck": "tsc --noEmit"

   },

   "dependencies": {

-    "three": "^0.160.0"

+    "three": "^0.169.0"

   },

   "devDependencies": {

-    "@types/three": "^0.160.0",

-    "typescript": "^5.4.5",

-    "vite": "^5.2.11"

+    "@types/three": "^0.169.0",

+    "typescript": "^5.5.4",

+    "vite": "^5.4.8"

   }

 }
```

### tsconfig.json (新建, 583 chars)
```
+ {
+   "compilerOptions": {
+     "target": "ES2022",
+     "useDefineForClassFields": true,
+     "module": "ESNext",
+     "lib": ["ES2022", "DOM", "DOM.Iterable"],
+     "skipLibCheck": true,
+ 
+     "moduleResolution": "bundler",
+     "allowImportingTsExtensions": true,
+     "resolveJsonModule": true,
+     "isolatedModules": true,
+     "moduleDetection": "force",
+     "noEmit": true,
+ 
+     "strict": true,
+     "noUnusedLocals": true,
+     "noUnusedParameters": true,
+     "noFallthroughCasesInSwitch": true,
+ 
+ ... (更多)
```

### vite.config.ts (新建, 903 chars)
```
+ import { defineConfig } from 'vite';
+ import { resolve } from 'node:path';
+ 
+ export default defineConfig({
+   root: '.',
+   base: './',
+   resolve: {
+     alias: {
+       '@': resolve(__dirname, 'src'),
+       '@core': resolve(__dirname, 'src/core'),
+       '@types': resolve(__dirname, 'src/types'),
+       '@utils': resolve(__dirname, 'src/utils'),
+       '@shared': resolve(__dirname, 'src/shared'),
+       '@scenes': resolve(__dirname, 'src/scenes'),
+       '@components': resolve(__dirname, 'src/components'),
+     },
+   },
+   server: {
+     host: '0.0.0.0',
+     port: 5173,
+ ... (更多)
```

### index.html (修改)
```diff
--- a/index.html
+++ b/index.html
@@ -1,5 +1,25 @@
 <!DOCTYPE html>

 <html lang="zh-CN">

-<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>初始化项目脚手架与技术栈</title>

-<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:sans-serif;background:#f0f2f5;min-height:100vh;display:flex;justify-content:center;align-items:center}.container{background:#fff;border-radius:12px;padding:40px;box-shadow:0 4px 20px rgba(0,0,0,.1);max-width:600px;width:90%;text-align:center}h1{color:#1a1a2e;margin-bottom:16px}</style>

-</head><body><div class="container"><h1>初始化项目脚手架与技术栈</h1><p>搭建 Vite + TypeScript + Three.js 项目骨架，建立目录结构、类型定义与共享工具层，为后续模块提供统一入口。</p></div></body></html>
+<head>

+<meta charset="UTF-8">

+<meta name="viewport" content="width=device-width,initial-scale=1.0">

+<title>初始化项目脚手架与技术栈</title>

+<style>

+*{margin:0;padding:0;box-sizing:border-box}

+html,body{height:100%}

+body{font-family:sans-serif;background:#f0f2f5;min-height:100vh;display:flex;justify-content:center;align-items:center}

+.container{background:#fff;border-radius:12px;padding:40px;box-shadow:0 4px 20px rgba(0,0,0,.1);max-width:600px;width:90%;text-align:center}

+h1{color:#1a1a2e;margin-bottom:16px}

+#app{position:fixed;inset:0;z-index:-1}

+canvas{display:block}

+</style>

+</head>

+<body>

+<div class="container">

+  <h1>初始化项目脚手架与技术栈</h1>

+  <p>搭建 Vite + TypeScript + Three.js 项目骨架，建立目录结构、类型定义与共享工具层，为后续模块提供统一入口。</p>

+</div>

+<div id="app"></div>

+<script type="module" src="/src/main.ts"></script>

+</body>

+</html>
```

### src/types/scene.ts (修改)
```diff
--- a/src/types/scene.ts
+++ b/src/types/scene.ts
@@ -1,256 +1,166 @@
+import type {

+  Camera,

+  ColorRepresentation,

+  Object3D,

+  Scene,

+  Vector3Tuple,

+  WebGLRendererParameters,

+} from 'three'

+

 /**

- * scene.ts — 场景相关类型定义

- * 用于描述 Three.js 场景配置、相机、渲染器、光照与场景图结构，

- * 为场景模块提供统一的数据契约。

+ * 场景模块类型定义

+ * 为 Three.js 场景、相机、渲染器、灯光等提供统一的配置类型，

+ * 供场景初始化与后续模块共享使用。

  */

 

-import type * as THREE from 'three'

+/** 坐标三元组，等价于 [x, y, z] */

+export type Position3D = Vector3Tuple

 

-/** 坐标系约定：Three.js 默认使用右手系，Y 轴向上 */

-export type Axis = 'x' | 'y' | 'z'

-

-/** 三维向量 */

-export interface Vec3 {

-  x: number

-  y: number

-  z: number

+/** 场景背景配置 */

+export interface SceneBackgroundConfig {

+  /** 背景色，支持颜色值、十六进制字符串或颜色实例 */

+  color?: ColorRepresentation

+  /** 背景纹理 URL（可选） */

+  textureUrl?: string

+  /** 背景是否透明 */

+  transparent?: boolean

 }

 

-/** 欧拉角（弧度） */

-export interface Euler3 {

-  x: number

-  y: number

-  z: number

+/** 雾效配置 */

+export interface FogConfig {

... (共 386 行变更)
```

### src/utils/math.ts (修改)
```diff
--- a/src/utils/math.ts
+++ b/src/utils/math.ts
@@ -1,24 +1,26 @@
 /**

  * 共享数学工具层

- * 为 Three.js 场景提供统一的数学常量与常用计算函数

+ * 提供 Three.js 项目通用的数学辅助函数与常量。

  */

-import * as THREE from "three";

 

-/** 常用数学常量 */

-export const DEG2RAD = Math.PI / 180;

-export const RAD2DEG = 180 / Math.PI;

-export const TWO_PI = Math.PI * 2;

-export const HALF_PI = Math.PI / 2;

-export const EPSILON = 1e-6;

-

-/** 将数值钳制到 [min, max] 区间 */

-export function clamp(value: number, min: number, max: number): number {

-  return Math.max(min, Math.min(max, value));

+/** 角度转弧度 */

+export function degToRad(deg: number): number {

+  return (deg * Math.PI) / 180;

 }

 

-/** 线性插值（不钳制 t） */

+/** 弧度转角度 */

+export function radToDeg(rad: number): number {

+  return (rad * 180) / Math.PI;

+}

+

+/** 将数值限制在 [min, max] 区间内 */

+export function clamp(value: number, min: number, max: number): number {

+  return Math.min(Math.max(value, min), max);

+}

+

+/** 在 [min, max] 区间内进行线性插值 */

 export function lerp(a: number, b: number, t: number): number {

-  return a + (b - a) * t;

+  return a + (b - a) * clamp(t, 0, 1);

 }

 

 /** 将 value 从 [inMin, inMax] 映射到 [outMin, outMax] */

@@ -29,142 +31,58 @@
   outMin: number,

   outMax: number

 ): number {

-  if (Math.abs(inMax - inMin) < EPSILON) return outMin;

+  if (inMin === inMax) return outMin;

   const t = (value - inMin) / (inMax - inMin);

... (共 221 行变更)
```

### .eslintrc.cjs (新建, 733 chars)
```
+ module.exports = {
+   root: true,
+   env: {
+     browser: true,
+     es2021: true,
+     node: true,
+   },
+   parser: '@typescript-eslint/parser',
+   parserOptions: {
+     ecmaVersion: 'latest',
+     sourceType: 'module',
+   },
+   plugins: ['@typescript-eslint'],
+   extends: [
+     'eslint:recommended',
+     'plugin:@typescript-eslint/recommended',
+     'prettier',
+   ],
+   ignorePatterns: ['dist', 'node_modules', '*.cjs', '*.config.*'],
+   rules: {
+ ... (更多)
```

### .prettierrc (新建, 392 chars)
```
+ {
+   "semi": true,
+   "singleQuote": true,
+   "trailingComma": "all",
+   "printWidth": 100,
+   "tabWidth": 2,
+   "useTabs": false,
+   "endOfLine": "lf",
+   "arrowParens": "always",
+   "bracketSpacing": true,
+   "bracketSameLine": false,
+   "quoteProps": "as-needed",
+   "jsxSingleQuote": false,
+   "htmlWhitespaceSensitivity": "css",
+   "vueIndentScriptAndStyle": false,
+   "singleAttributePerLine": false
+ }
```

### src/index.ts (修改)
```diff
--- a/src/index.ts
+++ b/src/index.ts
@@ -1,164 +1,3 @@
-import * as THREE from 'three';

-import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

-

-// ============================================================================

-// 类型定义层

-// ============================================================================

-

-/** 应用初始化配置 */

-export interface AppOptions {

-  /** 挂载容器 */

-  container: HTMLElement;

-  /** 是否开启抗锯齿，默认 true */

-  antialias?: boolean;

-  /** 是否启用轨道控制器，默认 true */

-  controls?: boolean;

-  /** 相机远裁剪面 */

-  far?: number;

-  /** 相机近裁剪面 */

-  near?: number;

-}

-

-/** 渲染帧信息 */

-export interface FrameInfo {

-  /** 距离上次帧的时间（秒） */

-  delta: number;

-  /** 应用启动以来的总时间（秒） */

-  elapsed: number;

-}

-

-/** 可插拔的更新模块接口，为后续业务模块提供统一契约 */

-export interface Updatable {

-  update(frame: FrameInfo): void;

-}

-

-// ============================================================================

-// 共享工具层

-// ============================================================================

-

-/** 创建 WebGL 渲染器 */

-function createRenderer(container: HTMLElement, antialias = true): THREE.WebGLRenderer {

-  const renderer = new THREE.WebGLRenderer({ antialias });

-  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

-  renderer.setSize(container.clientWidth, container.clientHeight);

-  container.appendChild(renderer.domElement);

-  return renderer;

-}

-

... (共 170 行变更)
```

## 页面预览截图

![开发自测 — 初始化项目脚手架与技术栈](screenshots/dev_1794242771.png)

