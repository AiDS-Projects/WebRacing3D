# 开发笔记 — 初始化项目脚手架与技术栈

> 2026-11-12 12:08 | LLM

## 产出文件
- [tsconfig.node.json](/app#repo?file=tsconfig.node.json) (581 chars)
- [vite.config.ts](/app#repo?file=vite.config.ts) (878 chars)
- [package.json](/app#repo?file=package.json) (2125 chars)
- [index.html](/app#repo?file=index.html) (10801 chars)
- [src/main.ts](/app#repo?file=src/main.ts) (429 chars)
- [src/types/index.ts](/app#repo?file=src/types/index.ts) (3351 chars)

## 自测: 自测 7/7 通过 ✅

| 检查项 | 结果 | 说明 |
|--------|------|------|
| 文件产出 | ✅ | 6 个文件 |
| 入口文件 | ✅ | 存在 |
| 代码非空 | ✅ | 通过 |
| 语法检查 | ✅ | 通过 |
| 文件名规范 | ✅ | 全英文 |
| 磁盘落地 | ✅ | 6 个文件已落盘 |
| 页面截图 | ✅ | 1 张截图 |

## 代码变更 (Diff)

### tsconfig.node.json (新建, 581 chars)
```
+ {
+   "compilerOptions": {
+     "composite": true,
+     "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
+     "skipLibCheck": true,
+     "module": "ESNext",
+     "moduleResolution": "bundler",
+     "allowSyntheticDefaultImports": true,
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
+     "types": ["node"]
+ ... (更多)
```

### vite.config.ts (新建, 878 chars)
```
+ import { defineConfig } from 'vite'
+ import { fileURLToPath, URL } from 'node:url'
+ 
+ export default defineConfig({
+   root: '.',
+   base: './',
+   resolve: {
+     alias: {
+       '@': fileURLToPath(new URL('./src', import.meta.url)),
+       '@types': fileURLToPath(new URL('./src/types', import.meta.url)),
+       '@utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
+       '@core': fileURLToPath(new URL('./src/core', import.meta.url)),
+       '@scenes': fileURLToPath(new URL('./src/scenes', import.meta.url)),
+     },
+   },
+   server: {
+     host: '0.0.0.0',
+     port: 5173,
+     open: true,
+   },
+ ... (更多)
```

### package.json (新建, 2125 chars)
```
+ {
+   "name": "ads-game-ui",
+   "version": "1.0.0",
+   "private": true,
+   "description": "基础游戏 UI：速度表、当前圈数、计时器与开始/重置界面",
+   "type": "module",
+   "scripts": {
+     "dev": "vite",
+     "build": "vite build",
+     "preview": "vite preview",
+     "test": "playwright test",
+     "test:headed": "playwright test --headed",
+     "test:ui": "playwright test --ui",
+     "screenshot": "playwright test tests/screenshots",
+     "report": "playwright show-report",
+     "verify": "node scripts/verify.mjs"
+   },
+   "devDependencies": {
+     "@playwright/test": "^1.48.0",
+     "vite": "^5.4.0"
+ ... (更多)
```

### index.html (新建, 10801 chars)
```
+ <!DOCTYPE html>
+ <html lang="zh-CN">
+ <head>
+ <meta charset="UTF-8" />
+ <meta name="viewport" content="width=device-width, initial-scale=1.0" />
+ <title>竞速仪表盘 - 基础游戏 UI</title>
+ <style>
+   :root {
+     --bg: #0b0f14;
+     --panel: #121a24;
+     --accent: #00e5a0;
+     --accent2: #ff4d6d;
+     --text: #e8f0f7;
+     --muted: #6b7a8a;
+     --dial: #0d141c;
+   }
+   * { margin: 0; padding: 0; box-sizing: border-box; }
+   html, body { height: 100%; }
+   body {
+     background: radial-gradient(circle at 50% 30%, #16222f 0%, var(--bg) 70%);
+ ... (更多)
```

### src/main.ts (新建, 429 chars)
```
+ import * as THREE from 'three';
+ 
+ /* ============================================================================
+  * 骨架占位：场景初始化
+  * ==========================================================================*/
+ 
+ /**
+  * 创建并返回空的 THREE 场景。
+  *
+  * 本文件为脚手架骨架，仅完成场景初始化占位：
+  * 不引入 camera / physics / player / race 等业务模块，
+  * 业务逻辑由后续工单在对应模块中实现后接入。
+  */
+ function createScene(): THREE.Scene {
+   return new THREE.Scene();
+ }
+ 
+ export { createScene };
```

### src/types/index.ts (新建, 3351 chars)
```
+ import type * as THREE from 'three';
+ 
+ /** 三维向量坐标（可序列化） */
+ export interface Vec3 {
+   x: number;
+   y: number;
+   z: number;
+ }
+ 
+ /** 颜色配置：支持 CSS 字符串或 THREE.Color */
+ export type ColorLike = string | number | THREE.Color;
+ 
+ /** 相机类型 */
+ export type CameraType = 'perspective' | 'orthographic';
+ 
+ /** 透视相机配置 */
+ export interface PerspectiveCameraConfig {
+   type: 'perspective';
+   fov?: number;
+   near?: number;
+ ... (更多)
```

## 页面预览截图

![开发自测 — 初始化项目脚手架与技术栈](screenshots/dev_1794456509.png)

