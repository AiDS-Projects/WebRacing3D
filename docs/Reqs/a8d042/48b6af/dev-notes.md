# 开发笔记 — 初始化项目脚手架与技术栈

> 2026-11-16 20:26 | LLM

## 产出文件
- [package.json](/app#repo?file=package.json) (444 chars)
- [tsconfig.json](/app#repo?file=tsconfig.json) (564 chars)
- [vite.config.ts](/app#repo?file=vite.config.ts) (305 chars)
- [index.html](/app#repo?file=index.html) (673 chars)
- [playwright.config.ts](/app#repo?file=playwright.config.ts) (415 chars)
- [.gitignore](/app#repo?file=.gitignore) (49 chars)
- [src/main.ts](/app#repo?file=src/main.ts) (1668 chars)
- [src/index.ts](/app#repo?file=src/index.ts) (101 chars)
- [src/types/index.ts](/app#repo?file=src/types/index.ts) (626 chars)
- [src/utils/index.ts](/app#repo?file=src/utils/index.ts) (48 chars)
- [src/utils/math.ts](/app#repo?file=src/utils/math.ts) (349 chars)
- [src/utils/loop.ts](/app#repo?file=src/utils/loop.ts) (887 chars)
- [tests/app.spec.ts](/app#repo?file=tests/app.spec.ts) (223 chars)

## 自测: 自测 7/7 通过 ✅

| 检查项 | 结果 | 说明 |
|--------|------|------|
| 文件产出 | ✅ | 13 个文件 |
| 入口文件 | ✅ | 存在 |
| 代码非空 | ✅ | 通过 |
| 语法检查 | ✅ | 通过 |
| 文件名规范 | ✅ | 全英文 |
| 磁盘落地 | ✅ | 13 个文件已落盘 |
| 页面截图 | ✅ | 1 张截图 |

## 代码变更 (Diff)

### package.json (新建, 444 chars)
```
+ {
+   "name": "racing3d",
+   "private": true,
+   "version": "0.1.0",
+   "type": "module",
+   "scripts": {
+     "dev": "vite",
+     "build": "tsc && vite build",
+     "preview": "vite preview",
+     "test": "playwright test"
+   },
+   "dependencies": {
+     "three": "^0.160.0"
+   },
+   "devDependencies": {
+     "@playwright/test": "^1.44.0",
+     "@types/node": "^20.12.0",
+     "@types/three": "^0.160.0",
+     "typescript": "^5.4.0",
+     "vite": "^5.2.0"
+ ... (更多)
```

### tsconfig.json (新建, 564 chars)
```
+ {
+   "compilerOptions": {
+     "target": "ES2020",
+     "module": "ESNext",
+     "moduleResolution": "bundler",
+     "lib": ["ES2020", "DOM", "DOM.Iterable"],
+     "strict": true,
+     "noUnusedLocals": true,
+     "noUnusedParameters": true,
+     "noFallthroughCasesInSwitch": true,
+     "esModuleInterop": true,
+     "skipLibCheck": true,
+     "isolatedModules": true,
+     "forceConsistentCasingInFileNames": true,
+     "useDefineForClassFields": true,
+     "resolveJsonModule": true,
+     "baseUrl": ".",
+     "paths": {
+       "@/*": ["src/*"]
+     }
+ ... (更多)
```

### vite.config.ts (新建, 305 chars)
```
+ import { defineConfig } from 'vite';
+ import { fileURLToPath, URL } from 'node:url';
+ 
+ export default defineConfig({
+   resolve: {
+     alias: {
+       '@': fileURLToPath(new URL('./src', import.meta.url)),
+     },
+   },
+   server: {
+     host: true,
+     open: true,
+   },
+   build: {
+     target: 'ES2020',
+   },
+ });
+ 
```

### index.html (新建, 673 chars)
```
+ <!DOCTYPE html>
+ <html lang="en">
+   <head>
+     <meta charset="UTF-8" />
+     <meta
+       name="viewport"
+       content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
+     />
+     <title>Racing3D</title>
+     <style>
+       * {
+         box-sizing: border-box;
+         margin: 0;
+         padding: 0;
+       }
+       html,
+       body,
+       #app {
+         width: 100%;
+         height: 100%;
+ ... (更多)
```

### playwright.config.ts (新建, 415 chars)
```
+ import { defineConfig, devices } from '@playwright/test';
+ 
+ export default defineConfig({
+   testDir: './tests',
+   fullyParallel: true,
+   use: {
+     baseURL: 'http://localhost:5173',
+   },
+   webServer: {
+     command: 'npm run dev',
+     url: 'http://localhost:5173',
+     reuseExistingServer: !process.env.CI,
+   },
+   projects: [
+     {
+       name: 'chromium',
+       use: { ...devices['Desktop Chrome'] },
+     },
+   ],
+ });
+ ... (更多)
```

### .gitignore (新建, 49 chars)
```
+ node_modules
+ dist
+ test-results
+ playwright-report
+ 
```

### src/main.ts (新建, 1668 chars)
```
+ import * as THREE from 'three';
+ import { AnimationLoop } from '@/utils';
+ import type { AppContext } from '@/types';
+ 
+ function bootstrap(): void {
+   const app = document.querySelector<HTMLDivElement>('#app');
+   if (!app) {
+     throw new Error('Mount point #app not found');
+   }
+ 
+   const renderer = new THREE.WebGLRenderer({ antialias: true });
+   renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
+   renderer.setSize(window.innerWidth, window.innerHeight);
+   app.appendChild(renderer.domElement);
+ 
+   const scene = new THREE.Scene();
+   const camera = new THREE.PerspectiveCamera(
+     60,
+     window.innerWidth / window.innerHeight,
+     0.1,
+ ... (更多)
```

### src/index.ts (新建, 101 chars)
```
+ /**
+  * 统一入口（barrel）：对外导出公共 API，各领域模块从这里引用共享契约。
+  */
+ export * from '@/types';
+ export * from '@/utils';
+ 
```

### src/types/index.ts (新建, 626 chars)
```
+ import type {
+   WebGLRenderer,
+   Scene,
+   PerspectiveCamera,
+   Clock,
+ } from 'three';
+ 
+ /**
+  * 应用上下文：在装配阶段（main.ts）注入，供各领域模块 init 时接收。
+  */
+ export interface AppContext {
+   renderer: WebGLRenderer;
+   scene: Scene;
+   camera: PerspectiveCamera;
+   clock: Clock;
+ }
+ 
+ /**
+  * 帧状态：游戏循环每帧下发。
+  */
+ ... (更多)
```

### src/utils/index.ts (新建, 48 chars)
```
+ export * from './math';
+ export * from './loop';
+ 
```

### src/utils/math.ts (新建, 349 chars)
```
+ /** 数值钳制到 [min, max] 区间 */
+ export function clamp(value: number, min: number, max: number): number {
+   return Math.min(max, Math.max(min, value));
+ }
+ 
+ /** 线性插值 */
+ export function lerp(a: number, b: number, t: number): number {
+   return a + (b - a) * t;
+ }
+ 
+ /** 角度转弧度 */
+ export function degToRad(deg: number): number {
+   return (deg * Math.PI) / 180;
+ }
+ 
```

### src/utils/loop.ts (新建, 887 chars)
```
+ import type { Clock } from 'three';
+ import type { FrameState } from '@/types';
+ 
+ /**
+  * requestAnimationFrame 游戏循环封装，统一管理启停与帧状态下发。
+  */
+ export class AnimationLoop {
+   private running = false;
+   private rafId = 0;
+   private readonly clock: Clock;
+   private readonly onFrame: (frame: FrameState) => void;
+ 
+   constructor(clock: Clock, onFrame: (frame: FrameState) => void) {
+     this.clock = clock;
+     this.onFrame = onFrame;
+   }
+ 
+   start(): void {
+     if (this.running) return;
+     this.running = true;
+ ... (更多)
```

### tests/app.spec.ts (新建, 223 chars)
```
+ import { test, expect } from '@playwright/test';
+ 
+ test('canvas is rendered inside #app', async ({ page }) => {
+   await page.goto('/');
+   const canvas = page.locator('#app canvas');
+   await expect(canvas).toBeVisible();
+ });
+ 
```

## 页面预览截图

![开发自测 — 初始化项目脚手架与技术栈](screenshots/dev_1794831963.png)

