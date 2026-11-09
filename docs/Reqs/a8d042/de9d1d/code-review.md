# 代码审查 — 实现玩家赛车与第三人称跟随视角

## 评分: 4/10 🚫 需修复

## 🔴 严重问题（必须修复）
- index.ts 引用了不存在的模块路径：`./player/PlayerCar` 与 `./track/TrackBuilder`。实际实现中玩家赛车是内联在 main.ts 的 `createPlayerCar()` 函数里，赛道文件是 `track/Track.ts`，并不存在 `player/PlayerCar.ts` 和 `track/TrackBuilder.ts`，导致构建/导入阶段直接报错（模块解析失败）。
- FollowCamera 的默认配置存在共享可变对象缺陷：`DEFAULT_CONFIG` 中的 `offset`、`lookAtOffset` 是模块级单例 Vector3，构造函数 `{ ...DEFAULT_CONFIG, ...config }` 是浅拷贝，多个实例会共享同一个 Vector3 引用。`setOffset()` 内部执行 `this.config.offset.copy(offset)` 会原地修改共享的 DEFAULT_CONFIG，污染之后创建的所有 FollowCamera 实例（跨实例状态串扰，属隐藏 bug）。

## 🟡 警告（建议修复）
- main.ts 中定义的 `FOLLOW_CONFIG`（distance 6.5、height 2.8）是死代码：从未被使用。实际相机偏移由 FollowCamera 自带默认值 offset(0, 5.5, -10) 决定，与 FOLLOW_CONFIG 数值完全不一致，存在配置漂移/重复定义，易误导后续维护者。
- App 类没有 dispose() 生命周期方法：requestAnimationFrame 未取消（rafId 只存未清）、keydown/keyup/resize 监听器（onKeyDown/onKeyUp/onResize）从未移除。组件卸载或重复创建 App 时会造成事件监听泄漏与 RAF 泄漏。
- delta time 未做钳制：使用 clock.getDelta() 时，浏览器标签页切后台再返回会得到极大的 dt，导致物理位移/相机跟随瞬间跳变甚至穿越赛道（tunneling），应限制如 Math.min(dt, 0.05)。
- getSize() 用 `container.clientWidth || window.innerWidth` 兜底：当容器隐藏（display:none）时 clientWidth 为 0，会混用窗口尺寸，导致相机 aspect 与 renderer 实际尺寸不一致；且 height 为 0 时 aspect 会退化为 NaN/Infinity 未被防护。
- createDemoContent() 把演示内容（地面、网格、立方体、坐标轴 AxesHelper）硬编码进生产 App 入口，演示代码与业务逻辑未分离，正式场景应移除或抽离。
- createPlayerCar / createDemoContent 中创建的 Geometry 与 Material 均未调用 dispose()，renderer 也未提供释放入口，多次创建 App 会导致 WebGL 资源（显存）无法回收。

## 🟢 建议（可选优化）
- FollowCamera 每帧在 updatePosition/updateLookAt 中调用 `offset.clone()`、`lookAtOffset.clone()`，产生大量临时对象，高频调用下带来 GC 压力；建议在类中预分配临时 Vector3 复用（如 _tmpOffset、_tmpLookAt）。
- createPlayerCar() 中车身/座舱/车轮的尺寸与位置（0.55、1.0、-0.2、0.32、1.15 等）均为魔法数字，建议提取为命名常量，提升可读性与可调性。
- Track.ts 的 buildFlatRibbon 用数组 push 动态构建 positions/normals/indices，可预先按 segments 计算数组长度并一次性分配，减少扩容开销。
- FollowCamera 默认配置建议改为工厂函数或深拷贝（offset/lookAtOffset 用 clone），从根上消除共享可变单例；同时可补充 reset()/销毁语义。
- index.ts 的桶文件同时 re-export 内部类型（types/scene、types/track）与公共 API，建议区分对外 API 与内部类型导出，避免 tree-shaking 边界不清。

## 审查的代码
- src/index.ts
- src/main.ts
- src/camera/FollowCamera.ts
- docs/Reqs/a8d042/de9d1d/dev-notes.md
