# 开发笔记 — 初始化项目脚手架与技术栈

> 2026-11-16 20:43 | LLM

## 产出文件
- [tsconfig.json](/app#repo?file=tsconfig.json) (858 chars)
- [vite.config.ts](/app#repo?file=vite.config.ts) (613 chars)
- [package.json](/app#repo?file=package.json) (5718 chars)
- [index.html](/app#repo?file=index.html) (718 chars)
- [playwright.config.ts](/app#repo?file=playwright.config.ts) (476 chars)

## 自测: 自测 7/7 通过 ✅

| 检查项 | 结果 | 说明 |
|--------|------|------|
| 文件产出 | ✅ | 5 个文件 |
| 入口文件 | ✅ | 存在 |
| 代码非空 | ✅ | 通过 |
| 语法检查 | ✅ | 通过 |
| 文件名规范 | ✅ | 全英文 |
| 磁盘落地 | ✅ | 5 个文件已落盘 |
| 页面截图 | ✅ | 1 张截图 |

## 代码变更 (Diff)

### tsconfig.json (新建, 858 chars)
```
+ {
+   "compilerOptions": {
+     "target": "ES2020",
+     "useDefineForClassFields": true,
+     "lib": ["ES2020", "DOM", "DOM.Iterable"],
+     "module": "ESNext",
+     "moduleResolution": "bundler",
+     "moduleDetection": "force",
+     "skipLibCheck": true,
+ 
+     "strict": true,
+     "noUnusedLocals": true,
+     "noUnusedParameters": true,
+     "noFallthroughCasesInSwitch": true,
+     "noUncheckedIndexedAccess": true,
+ 
+     "resolveJsonModule": true,
+     "isolatedModules": true,
+     "esModuleInterop": true,
+     "allowSyntheticDefaultImports": true,
+ ... (更多)
```

### vite.config.ts (新建, 613 chars)
```
+ import { fileURLToPath, URL } from 'node:url'
+ import { defineConfig } from 'vite'
+ 
+ export default defineConfig({
+   // 路径别名：@/ -> src/
+   resolve: {
+     alias: {
+       '@': fileURLToPath(new URL('./src', import.meta.url)),
+     },
+   },
+ 
+   // 开发服务器配置
+   server: {
+     host: true, // 监听局域网，便于真机/远程调试
+     port: 5173,
+     open: true, // 启动后自动打开浏览器
+     hmr: {
+       overlay: true, // 编译错误直接覆盖提示
+     },
+   },
+ ... (更多)
```

### package.json (新建, 5718 chars)
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
+   "dependencies": {
+     "three": "^0.160.0"
+   },
+ ... (更多)
```

### index.html (新建, 718 chars)
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

### playwright.config.ts (新建, 476 chars)
```
+ import { defineConfig, devices } from '@playwright/test';
+ 
+ export default defineConfig({
+   testDir: './tests',
+   testMatch: /.*\.(test|spec)\.[jt]sx?/,
+   fullyParallel: true,
+   use: {
+     baseURL: 'http://localhost:4173',
+   },
+   webServer: {
+     command: 'npm run build && npm run preview',
+     url: 'http://localhost:4173',
+     reuseExistingServer: !process.env.CI,
+   },
+   projects: [
+     {
+       name: 'chromium',
+       use: { ...devices['Desktop Chrome'] },
+     },
+   ],
+ ... (更多)
```

## 页面预览截图

![开发自测 — 初始化项目脚手架与技术栈](screenshots/dev_1794832975.png)

