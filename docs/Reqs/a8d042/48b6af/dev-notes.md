# 开发笔记 — 初始化项目脚手架与技术栈

> 2026-11-17 17:42 | LLM

## 产出文件
- [index.html](/app#repo?file=index.html) (506 chars)
- [package.json](/app#repo?file=package.json) (361 chars)
- [README.md](/app#repo?file=README.md) (485 chars)
- [src/main.ts](/app#repo?file=src/main.ts) (1875 chars)
- [src/types/scene.ts](/app#repo?file=src/types/scene.ts) (394 chars)
- [src/utils/math.ts](/app#repo?file=src/utils/math.ts) (343 chars)
- [tsconfig.json](/app#repo?file=tsconfig.json) (390 chars)
- [vite.config.ts](/app#repo?file=vite.config.ts) (183 chars)

## 自测: 自测 7/7 通过 ✅

| 检查项 | 结果 | 说明 |
|--------|------|------|
| 文件产出 | ✅ | 8 个文件 |
| 入口文件 | ✅ | 存在 |
| 代码非空 | ✅ | 通过 |
| 语法检查 | ✅ | 通过 |
| 文件名规范 | ✅ | 全英文 |
| 磁盘落地 | ✅ | 8 个文件已落盘 |
| 页面截图 | ✅ | 1 张截图 |

## 代码变更 (Diff)

### index.html (新建, 506 chars)
```
+ <!DOCTYPE html>
+ <html lang="zh-CN">
+ <head>
+   <meta charset="UTF-8" />
+   <meta name="viewport" content="width=device-width, initial-scale=1.0" />
+   <title>WebRacing3D</title>
+   <style>
+     * { margin: 0; padding: 0; box-sizing: border-box; }
+     html, body { width: 100%; height: 100%; overflow: hidden; background: #101820; }
+     #app { display: block; width: 100%; height: 100%; }
+   </style>
+ </head>
+ <body>
+   <canvas id="app"></canvas>
+   <script type="module" src="/src/main.ts"></script>
+ </body>
+ </html>
+ 
```

### package.json (新建, 361 chars)
```
+ {
+   "name": "webracing3d",
+   "private": true,
+   "type": "module",
+   "scripts": {
+     "dev": "vite",
+     "build": "tsc && vite build",
+     "preview": "vite preview",
+     "typecheck": "tsc --noEmit"
+   },
+   "dependencies": {
+     "three": "^0.170.0"
+   },
+   "devDependencies": {
+     "@types/three": "^0.170.0",
+     "typescript": "^5.4.0",
+     "vite": "^5.4.0"
+   }
+ }
+ 
```

### src/main.ts (新建, 1875 chars)
```
+ import * as THREE from "three";
+ import { clamp, lerp } from "./utils/math";
+ import type { SceneContext, ViewportSize } from "./types/scene";
+ 
+ function createContext(canvas: HTMLCanvasElement): SceneContext {
+   const size: ViewportSize = {
+     width: canvas.clientWidth || window.innerWidth,
+     height: canvas.clientHeight || window.innerHeight,
+   };
+ 
+   const scene = new THREE.Scene();
+   scene.background = new THREE.Color(0x101820);
+ 
+   const camera = new THREE.PerspectiveCamera(60, size.width / size.height, 0.1, 100);
+   camera.position.set(0, 1.5, 5);
+   camera.lookAt(0, 0, 0);
+ 
+   const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
+   renderer.setPixelRatio(window.devicePixelRatio || 1);
+   renderer.setSize(size.width, size.height);
+ ... (更多)
```

### src/types/scene.ts (新建, 394 chars)
```
+ import type * as THREE from "three";
+ 
+ /** 视口尺寸（渲染循环与 resize 共用）。 */
+ export interface ViewportSize {
+   width: number;
+   height: number;
+ }
+ 
+ /**
+  * 场景上下文：后续业务模块统一从这里取 scene / camera / renderer，
+  * 避免各自 new 一套渲染器。脚手架只提供最小可运行实例。
+  */
+ export interface SceneContext {
+   scene: THREE.Scene;
+   camera: THREE.PerspectiveCamera;
+   renderer: THREE.WebGLRenderer;
+   mesh: THREE.Mesh;
+   size: ViewportSize;
+ }
+ 
```

### src/utils/math.ts (新建, 343 chars)
```
+ /** 把 v 限制在 [min, max]。 */
+ export function clamp(v: number, min: number, max: number): number {
+   return Math.min(Math.max(v, min), max);
+ }
+ 
+ /** 线性插值。 */
+ export function lerp(a: number, b: number, t: number): number {
+   return a + (b - a) * t;
+ }
+ 
+ /** 角度转弧度。 */
+ export function degToRad(deg: number): number {
+   return (deg * Math.PI) / 180;
+ }
+ 
```

### tsconfig.json (新建, 390 chars)
```
+ {
+   "compilerOptions": {
+     "target": "ES2020",
+     "module": "ESNext",
+     "moduleResolution": "bundler",
+     "strict": true,
+     "esModuleInterop": true,
+     "skipLibCheck": true,
+     "forceConsistentCasingInFileNames": true,
+     "resolveJsonModule": true,
+     "isolatedModules": true,
+     "noEmit": true,
+     "lib": ["ES2020", "DOM", "DOM.Iterable"]
+   },
+   "include": ["src/**/*.ts"]
+ }
+ 
```

### vite.config.ts (新建, 183 chars)
```
+ import { defineConfig } from "vite";
+ 
+ export default defineConfig({
+   base: "./",
+   server: {
+     strictPort: false,
+   },
+   build: {
+     outDir: "dist",
+     sourcemap: true,
+   },
+ });
+ 
```

## 页面预览截图

![开发自测 — 初始化项目脚手架与技术栈](screenshots/dev_1794908500.png)

