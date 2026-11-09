# 开发笔记 — 实现基础车辆物理系统

> 2026-11-10 01:37 | LLM

## 产出文件
- [src/types/input.ts](/app#repo?file=src/types/input.ts) (877 chars)
- [src/physics/VehiclePhysics.ts](/app#repo?file=src/physics/VehiclePhysics.ts) (4727 chars)

## 自测: 自测 7/7 通过 ✅

| 检查项 | 结果 | 说明 |
|--------|------|------|
| 文件产出 | ✅ | 2 个文件 |
| 入口文件 | ✅ | 存在 |
| 代码非空 | ✅ | 通过 |
| 语法检查 | ✅ | 通过 |
| 文件名规范 | ✅ | 全英文 |
| 磁盘落地 | ✅ | 2 个文件已落盘 |
| 页面截图 | ✅ | 1 张截图 |

## 代码变更 (Diff)

### src/types/input.ts (修改)
```diff
--- a/src/types/input.ts
+++ b/src/types/input.ts
@@ -1,115 +1,45 @@
 /**

- * 输入系统类型定义

- * 覆盖键盘（W/S/A/D + 方向键）与触屏虚拟按键两类输入源，

- * 并定义合成后的车辆控制输入（供物理/移动模块消费）。

+ * 共享输入类型层

+ * 将车辆输入从「离散按键状态」抽象为「归一化连续输入」，

+ * 供输入绑定层、物理模块与后续 AI 控制器统一复用。

  */

 

-/** 车辆控制动作 */

-export type CarAction =

-  | 'throttle' // 油门

-  | 'brake' // 刹车

-  | 'steerLeft' // 左转

-  | 'steerRight' // 右转

-  | 'handbrake' // 手刹

-  | 'reset'; // 复位

-

-/** 支持的键盘按键 */

-export type KeyCode =

-  | 'KeyW'

-  | 'KeyA'

-  | 'KeyS'

-  | 'KeyD'

-  | 'ArrowUp'

-  | 'ArrowDown'

-  | 'ArrowLeft'

-  | 'ArrowRight'

-  | 'Space'

-  | 'KeyR';

-

-/** 单个动作的输入状态（含边沿触发信息） */

-export interface ActionState {

-  /** 是否正在按下 */

-  pressed: boolean;

-  /** 本帧内是否刚按下（上升沿） */

-  justPressed: boolean;

-  /** 本帧内是否刚释放（下降沿） */

-  justReleased: boolean;

+/**

+ * 车辆原始输入状态：由键盘与触屏虚拟按键共同写入。

+ * 表示各方向按键是否被按下（离散布尔量）。

+ */

+export interface CarInput {

+  /** 前进（W / ↑） */

+  forward: boolean

+  /** 后退（S / ↓） */

... (共 155 行变更)
```

### src/physics/VehiclePhysics.ts (新建, 4727 chars)
```
+ export interface Vec2 {
+   x: number;
+   y: number;
+ }
+ 
+ /** 车辆物理配置 */
+ export interface VehiclePhysicsConfig {
+   /** 前进最大速度（单位/秒） */
+   maxSpeed: number;
+   /** 倒车最大速度（单位/秒，正值表示倒车速度上限） */
+   maxReverse: number;
+   /** 加速率（单位/秒²） */
+   acceleration: number;
+   /** 制动力（单位/秒²），同时用于倒车加速 */
+   brake: number;
+   /** 无输入时的滚动摩擦减速率（单位/秒²） */
+   friction: number;
+   /** 最大转向角速度（弧度/秒） */
+   turnRate: number;
+   /** 转向输入平滑响应速度（1/秒） */
+ ... (更多)
```

## 页面预览截图

![开发自测 — 实现基础车辆物理系统](screenshots/dev_1794245824.png)

