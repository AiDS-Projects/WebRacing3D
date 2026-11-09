# 开发笔记 — 实现计时与圈数系统

> 2026-11-10 01:43 | LLM

## 产出文件
- [src/types/race.ts](/app#repo?file=src/types/race.ts) (2384 chars)
- [src/race/LapTracker.ts](/app#repo?file=src/race/LapTracker.ts) (10421 chars)
- [src/race/StartLine.ts](/app#repo?file=src/race/StartLine.ts) (7106 chars)
- [src/utils/time.ts](/app#repo?file=src/utils/time.ts) (6161 chars)

## 自测: 自测 7/7 通过 ✅

| 检查项 | 结果 | 说明 |
|--------|------|------|
| 文件产出 | ✅ | 4 个文件 |
| 入口文件 | ✅ | 存在 |
| 代码非空 | ✅ | 通过 |
| 语法检查 | ✅ | 通过 |
| 文件名规范 | ✅ | 全英文 |
| 磁盘落地 | ✅ | 4 个文件已落盘 |
| 页面截图 | ✅ | 1 张截图 |

## 代码变更 (Diff)

### src/types/race.ts (新建, 2384 chars)
```
+ /** 计时与圈数系统类型定义 */
+ 
+ /** 比赛阶段 */
+ export type RacePhase = 'idle' | 'countdown' | 'racing' | 'finished';
+ 
+ /** 起终点检测器配置 */
+ export interface StartFinishConfig {
+   /** 检测线中心在世界坐标中的位置 */
+   position: { x: number; y: number; z: number };
+   /** 检测线法线方向（归一化向量） */
+   normal: { x: number; y: number; z: number };
+   /** 检测线半宽（用于判定车辆是否穿越） */
+   halfWidth: number;
+   /** 两次有效触发之间的最小间隔（毫秒），避免单次穿越重复触发 */
+   debounceMs: number;
+ }
+ 
+ /** 单圈计时数据 */
+ export interface LapTiming {
+   /** 圈序号，从 1 开始 */
+ ... (更多)
```

### src/race/LapTracker.ts (新建, 10421 chars)
```
+ import type {
+   LapResult,
+   TrackData,
+   TrackPoint3D,
+   TrackProgress,
+ } from '../types/track'
+ 
+ // ============================================================================
+ // 类型定义层
+ // ============================================================================
+ 
+ /** 单圈成绩记录 */
+ export interface LapRecord {
+   /** 圈序号（1 起） */
+   lap: number
+   /** 本圈耗时（秒） */
+   time: number
+   /** 完成本圈时的累计用时（秒） */
+   total: number
+ }
+ ... (更多)
```

### src/race/StartLine.ts (新建, 7106 chars)
```
+ import * as THREE from 'three';
+ 
+ /**
+  * 单圈结算结果
+  */
+ export interface LapResult {
+   /** 圈号（从 1 开始） */
+   lap: number;
+   /** 本圈耗时（秒） */
+   lapTime: number;
+   /** 累计总耗时（秒） */
+   totalTime: number;
+   /** 历史最快单圈（秒） */
+   bestLap: number;
+   /** 本圈是否刷新了最快纪录 */
+   isBest: boolean;
+ }
+ 
+ export interface StartLineOptions {
+   /** 起终点线中心位置 */
+ ... (更多)
```

### src/utils/time.ts (新建, 6161 chars)
```
+ import type {
+   LapResult,
+   TrackData,
+   TrackPoint3D,
+   TrackProgress,
+ } from '../types/track'
+ 
+ // ============================================================================
+ // 类型定义层
+ // ============================================================================
+ 
+ /** 单圈成绩记录 */
+ export interface LapRecord {
+   /** 圈序号（1 起） */
+   lap: number
+   /** 本圈耗时（秒） */
+   time: number
+   /** 完成本圈时的累计用时（秒） */
+   total: number
+ }
+ ... (更多)
```

## 页面预览截图

![开发自测 — 实现计时与圈数系统](screenshots/dev_1794246199.png)

