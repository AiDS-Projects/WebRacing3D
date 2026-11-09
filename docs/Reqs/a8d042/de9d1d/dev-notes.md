# 开发笔记 — 实现玩家赛车与第三人称跟随视角

> 2026-11-10 01:23 | LLM

## 产出文件
- [src/index.ts](/app#repo?file=src/index.ts) (228 chars)
- [src/main.ts](/app#repo?file=src/main.ts) (10500 chars)
- [src/camera/FollowCamera.ts](/app#repo?file=src/camera/FollowCamera.ts) (2757 chars)

## 自测: 自测 7/7 通过 ✅

| 检查项 | 结果 | 说明 |
|--------|------|------|
| 文件产出 | ✅ | 3 个文件 |
| 入口文件 | ✅ | 存在 |
| 代码非空 | ✅ | 通过 |
| 语法检查 | ✅ | 通过 |
| 文件名规范 | ✅ | 全英文 |
| 磁盘落地 | ✅ | 3 个文件已落盘 |
| 页面截图 | ✅ | 1 张截图 |

## 代码变更 (Diff)

### src/index.ts (修改)
```diff
--- a/src/index.ts
+++ b/src/index.ts
@@ -2,4 +2,6 @@
 export * from './types/scene';

 export * from './types/track';

 export * from './track/TrackBuilder';

-export * from './utils/math';
+export * from './utils/math';

+export * from './player/PlayerCar';

+export * from './camera/FollowCamera';
```

### src/main.ts (修改)
```diff
--- a/src/main.ts
+++ b/src/main.ts
@@ -1,5 +1,4 @@
 import * as THREE from 'three';

-import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

 

 /* ============================================================================

  * 类型定义层

@@ -28,6 +27,14 @@
   width: number;

   height: number;

   aspect: number;

+}

+

+/** 键盘输入状态 */

+interface KeyState {

+  forward: boolean;

+  backward: boolean;

+  left: boolean;

+  right: boolean;

 }

 

 /* ============================================================================

@@ -44,6 +51,22 @@
   },

 };

 

+/** 赛车物理参数 */

+const CAR_CONFIG = {

+  acceleration: 12,

+  maxSpeed: 20,

+  reverseMaxSpeed: 8,

+  friction: 6,

+  turnSpeed: 2.2,

+};

+

+/** 第三人称跟随相机参数 */

+const FOLLOW_CONFIG = {

+  distance: 6.5,

+  height: 2.8,

+  lerpSpeed: 6,

+};

+

 function getSize(container: HTMLElement): SceneSize {

   const width = container.clientWidth || window.innerWidth;

   const height = container.clientHeight || window.innerHeight;

@@ -117,6 +140,56 @@
   return group;

 }

 

... (共 247 行变更)
```

### src/camera/FollowCamera.ts (无变化)

## 页面预览截图

![开发自测 — 实现玩家赛车与第三人称跟随视角](screenshots/dev_1794245013.png)

