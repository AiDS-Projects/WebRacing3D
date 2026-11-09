# 架构设计 - 构建 3D 环形赛道场景

## 架构模式
分层模块化架构 (Layer-based Modular) — 入口/配置层 → 共享层(types/utils) → 领域模块(track)。赛道模块遵循现有 `Updatable` 契约接入 `src/index.ts` 的 App 循环，数据层(中心线)与视觉层(网格)分离，不推翻已有代码

## 技术栈

- **language**: TypeScript 5.x（strict，noUnusedLocals/noUnusedParameters）
- **3d_engine**: Three.js（ESM，`import * as THREE`）
- **build_tool**: Vite
- **path_alias**: @/* → src/*
- **curve**: THREE.CatmullRomCurve3（closed）作为中心线唯一数据源
- **geometry**: 手工 BufferGeometry 带状(ribbon)构建，非 ShapeGeometry 挤出
- **types**: 复用 src/types/scene.ts，新增 src/types/track.ts
- **math**: 复用 src/utils/math.ts（clamp/degToRad/lerp 等），新增 src/utils/trackMath.ts

## 模块设计

### TrackTypes
职责: 

### TrackMath
职责: 

### Centerline
职责: 

### TrackGeometry
职责: 

### TrackModule
职责: 

## 关键决策
- 以 THREE.CatmullRomCurve3 的 closed 曲线作为中心线唯一数据源，视觉网格与碰撞/圈数检测共用同一份采样数据，避免两套几何漂移
- 采用固定分辨率等距重采样为 TrackPoint[]（而非保留解析曲线），使最近点查询与圈数进度计算稳定且可控复杂度
- 用手工 BufferGeometry 带状构建路面，而非 ShapeGeometry 挤出——每个采样点同时产出左右边界与切线/法线，直接服务后续碰撞检测
- 遵循现有 src/index.ts 的 Updatable 契约，TrackModule 实现该接口并暴露只读 trackData，对 App 零侵入
- 数据层(centerline.ts)与视觉层(trackGeometry.ts)分离，本工单只产出数据+静态网格，每帧 update 留空作为后续物理/检测挂载点
