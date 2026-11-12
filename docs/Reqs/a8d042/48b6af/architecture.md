# 架构设计 - 初始化项目脚手架与技术栈

## 架构模式
分层模块化架构（Layer-based Modular）：配置/构建层 → 入口引导层 → 共享类型层 → 共享工具层 → 领域模块层（camera/physics/player/race/track）

## 技术栈

- **build_tool**: Vite 5.x（ESM 原生开发服务器 + 生产构建）
- **language**: TypeScript 5.x（strict 模式，禁止 any）
- **rendering**: Three.js（WebGL，通过 ES Module 按需导入）
- **physics**: 自研轻量 2D 车辆物理（不引入 cannon/rapier，避免过度依赖）
- **testing**: Playwright（E2E 验收，覆盖浏览器可玩性）
- **package_manager**: npm（package.json 已存在）

## 模块设计

### 配置/构建层
职责: 统一构建入口、TS 编译选项（strict + 路径别名 @/）、依赖声明、页面挂载点、E2E 测试配置

### 入口引导层
职责: 应用启动编排：初始化渲染器/场景/相机，装配各领域模块，启动渲染循环；index.ts 作为对外统一导出入口

### 共享类型层
职责: 领域纯类型定义（无运行时依赖），作为跨模块契约，避免循环依赖；index.ts 统一 re-export

### 共享工具层
职责: 通用纯函数：向量运算、角度归一化、时间格式化/节流等，禁止业务内联重复逻辑

### 相机模块
职责: 第三人称跟随相机，目标局部空间偏移 + 指数平滑，update(dt) 驱动

### 物理模块
职责: 加速/制动/转向/抓地力打滑/边界碰撞减速，通过注入 TrackCollisionSource 解耦赛道采样

### 玩家模块
职责: 聚合赛车渲染体与物理状态，消费输入，暴露对外驱动接口

### 赛道/竞速模块
职责: 环形赛道几何与碰撞采样、起终点检测、单圈计时与圈数统计

## 关键决策
- 选用 Vite + TypeScript + Three.js，浏览器打开即玩，无需后端，符合验收标准
- 类型先行：所有领域接口（input/race/scene/track）先定义在 src/types，模块间只依赖类型契约，避免循环依赖
- 自研 2D 车辆物理（velocityAngle 与 heading 分离）而非引入物理引擎，原型期控制复杂度
- 共享工具层沉淀 math/time 纯函数，业务模块禁止内联辅助逻辑，符合 typescript-quality 规范
- TrackCollisionSource 采用依赖注入，物理模块不直接依赖赛道实现，保持可测试性
- Playwright 用于 E2E 验收，覆盖'浏览器打开即可玩'验收点
