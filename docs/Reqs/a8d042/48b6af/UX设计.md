# UX 设计 — 初始化项目脚手架与技术栈

> 所属需求：WebRacing3D 可玩原型 — 核心玩法验证

## 交互流程图

```mermaid
本工单为脚手架搭建，无业务页面跳转，唯一『界面』是全屏渲染画布。流程描述如下：

```mermaid
stateDiagram-v2
    [*] --> Boot: 访问 localhost:5173
    Boot --> InitRenderer: 加载 main.ts
    InitRenderer --> InitScene: 创建 Renderer/Scene/Camera
    InitScene --> Ready: 渲染空白场景 + 启动主循环
    InitRenderer --> Error: WebGL 不支持 / 初始化异常
    Ready --> Resize: 窗口尺寸变化
    Resize --> Ready: 更新相机宽高比
    Error --> [*]: 展示错误提示
    Ready --> [*]
```

说明：该流程对应『渲染器/场景/相机创建入口 + 主循环骨架』，其中 Boot→Ready 为开发启动路径；Error 分支用于验收标准 2 中『控制台 error=0』的兜底；Resize 为后续响应式规则所需的最小闭环。
```

## 组件线框说明

主要区域与组件结构（自上而下，全屏单页）：

1. 游戏视口容器（GameViewport，占满 100vw/100vh）
   - 承载 Three.js 渲染器 canvas，作为唯一渲染目标
   - 无任何业务 UI 叠加，纯渲染画布

2. 调试信息浮层（DebugOverlay，仅开发环境显示）
   - 位置：左上角
   - 内容：FPS 实时值、帧耗时（用于验收标准 8 的 60fps 采样验证）
   - 结构：半透明背景条 + 等宽字体文本，点击/拖拽不可交互

3. 初始化遮罩层（BootOverlay，仅初始化期间存在）
   - 覆盖整个视口，渲染器就绪后自动淡出
   - 内容：居中 Loading 提示文本（如『场景初始化中…』）

4. 错误提示浮层（ErrorOverlay，仅异常时显示）
   - 居中卡片：错误原因文案 + 重试按钮
   - 触发条件：WebGL 上下文创建失败

核心组件：GameViewport（全屏 canvas 容器）、DebugOverlay（FPS 浮层）、BootOverlay（加载遮罩）、ErrorOverlay（错误卡片）。

## 交互状态定义

本工单可交互组件极少，仅 ErrorOverlay 的重试按钮具备交互；其余组件只展示状态：

1. GameViewport（渲染画布）
   - normal：正常渲染空白场景
   - loading：渲染器/场景初始化中，被 BootOverlay 覆盖
   - error：WebGL 不可用，被 ErrorOverlay 覆盖
   - resize：窗口尺寸变化时重建相机宽高比（非用户点击状态）

2. ErrorOverlay 重试按钮
   - normal：可点击，文案『重试』
   - hover：指针悬停，背景微亮
   - active：按下，scale 0.95 + 亮度变化
   - disabled：无（错误恢复不需要禁用态）
   - loading：点击后重新初始化渲染器，按钮显示 spinner、禁止重复点击
   - success：恢复成功，遮罩整体淡出（150ms）

3. DebugOverlay（FPS 浮层）
   - normal：显示实时 FPS
   - empty：无（始终有数据）
   - error：无
   - 说明：纯只读，无 hover/active/disabled/loading 状态

4. BootOverlay（初始化遮罩）
   - loading：显示『场景初始化中…』
   - success：淡出消失（150ms fade out）
   - error：转交 ErrorOverlay 处理

## 响应式/适配规则

断点定义：mobile < 768px / tablet 768-1024px / desktop > 1024px。

本工单仅一个全屏画布，响应式规则集中在画布尺寸与浮层定位：

1. GameViewport
   - 全断点统一：canvas 始终填满视口（100vw/100vh），通过 resize 事件同步 renderer.setSize 与 camera.aspect
   - 禁止固定像素尺寸，保证不同分辨率下渲染不拉伸

2. DebugOverlay
   - mobile：左上角，字号缩小，内容精简为 FPS 单值
   - tablet/desktop：左上角，可扩展显示 FPS + 帧耗时

3. BootOverlay / ErrorOverlay
   - 全断点统一居中
   - ErrorOverlay 卡片宽度：mobile 90vw，tablet 60vw，desktop 480px 固定

4. 预留：后续 HUD/面板/触屏虚拟按键在此断点体系下叠加，本工单不实现。

## UI 资产清单（初稿）

本工单为脚手架搭建，PRD 边界条件明确排除美术资产导入，因此资产清单极简，仅保留开发/验证所需最小项：

- icon: refresh（ErrorOverlay 重试按钮图标，24px，outline 风格，用于 WebGL 初始化失败重试）
- icon: warning（ErrorOverlay 错误提示图标，24px，outline 风格，用于异常提示）
- illustration: 无（本工单无空状态/列表等场景）
- image: 无（本工单无横幅、插画等需求）

说明：FPS 浮层、Loading 遮罩均为纯文本实现，无需图标/图片资源。上述两个 icon 可在无资源时用文本『重试』与符号『!』替代，避免本工单引入资产依赖。
