# 开发笔记 — 实现玩家赛车与第三人称跟随视角

> 2026-11-10 01:08 | LLM

## 产出文件
- [src/types/input.ts](/app#repo?file=src/types/input.ts) (2196 chars)
- [src/camera/FollowCamera.ts](/app#repo?file=src/camera/FollowCamera.ts) (2757 chars)

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

### src/types/input.ts (新建, 2196 chars)
```
+ /**
+  * 输入系统类型定义
+  * 覆盖键盘（W/S/A/D + 方向键）与触屏虚拟按键两类输入源，
+  * 并定义合成后的车辆控制输入（供物理/移动模块消费）。
+  */
+ 
+ /** 车辆控制动作 */
+ export type CarAction =
+   | 'throttle' // 油门
+   | 'brake' // 刹车
+   | 'steerLeft' // 左转
+   | 'steerRight' // 右转
+   | 'handbrake' // 手刹
+   | 'reset'; // 复位
+ 
+ /** 支持的键盘按键 */
+ export type KeyCode =
+   | 'KeyW'
+   | 'KeyA'
+   | 'KeyS'
+ ... (更多)
```

### src/camera/FollowCamera.ts (新建, 2757 chars)
```
+ import * as THREE from 'three';
+ 
+ // ============================================================================
+ // 类型定义层
+ // ============================================================================
+ 
+ /** 第三人称跟随相机配置 */
+ export interface FollowCameraConfig {
+   /** 相机相对目标的偏移（目标局部空间，会随目标旋转） */
+   offset?: THREE.Vector3;
+   /** 观察点相对目标的偏移（目标局部空间） */
+   lookAtOffset?: THREE.Vector3;
+   /** 位置平滑系数（指数衰减，越大越跟手，默认 6） */
+   positionLerp?: number;
+   /** 是否启用平滑跟随，false 则每帧硬性贴合，默认 true */
+   smooth?: boolean;
+ }
+ 
+ // ============================================================================
+ // 共享工具层
+ ... (更多)
```

## 页面预览截图

![开发自测 — 实现玩家赛车与第三人称跟随视角](screenshots/dev_1794244117.png)

