# 代码审查 — 实现基础游戏 UI

## 评分: 4/10 🚫 需修复

## 🔴 严重问题（必须修复）
- {'file': 'src/player/PlayerCar.ts', 'line': '约 56-60（cameraOffset/cameraLook 定义）与 constructor/followCamera', 'title': '第三人称相机不会跟随车辆移动', 'description': 'cameraOffset(0,5.5,-10) 与 cameraLook(0,1.6,0) 均为世界坐标系常量，且从未与 this.position 相加。camera.position 始终被 lerp 到固定世界偏移、lookAt 始终指向固定世界点 (0,1.6,0)。结果是车辆移动后相机仍停留在原点附近，与注释宣称的『第三人称跟随相机』完全不符，属于核心逻辑错误。', 'suggestion': '每帧应计算 desired = this.position + cameraOffset（并按 heading 旋转偏移），lookAt 应指向 this.position + cameraLook，再 lerp。'}
- {'file': 'src/player/PlayerCar.ts', 'line': 'dispose() 方法', 'title': 'dispose() 未释放 Three.js 几何体与材质，GPU 内存泄漏', 'description': 'buildCar() 中创建的 MeshStandardMaterial、几何体（车轮/车身）及可能的纹理未记录引用，dispose() 仅移除事件监听与 touchRoot，未调用 geometry.dispose() / material.dispose() / material.map?.dispose()。多次创建销毁 PlayerCar（如重开一局）会持续累积显存，最终导致 GPU 内存耗尽或崩溃。', 'suggestion': '在 buildCar 中收集所有 geometry/material/texture 引用到数组，dispose() 中统一遍历调用其 dispose()。'}

## 🟡 警告（建议修复）
- {'file': 'playwright.config.ts', 'line': 'use 块内 UPDATE_SNAPSHOTS 三元展开', 'title': '死代码：UPDATE_SNAPSHOTS 分支展开为空对象，无实际作用', 'description': '...(process.env.UPDATE_SNAPSHOTS === "1" ? {} : {}) 两个分支均为空对象，展开后等价于无操作。注释还写着『默认读取基线截图做比对』，但实际没有任何更新基线的机制，属于误导性死代码。', 'suggestion': '要么实现真正的 updateSnapshots 配置（如 expect.toHaveScreenshot 的 update 逻辑），要么删除该段。'}
- {'file': 'package.json / playwright.config.ts', 'line': 'scripts.screenshot 与 testDir', 'title': 'screenshot 脚本指向的目录不在 testDir 范围内', 'description': 'testDir 配置为 ./tests/e2e，而 "screenshot": "playwright test tests/screenshots" 指定了另一个目录，Playwright 会因该目录无匹配测试或路径冲突而报错/空跑，截图验收脚本不可用。', 'suggestion': '统一测试目录，或将截图用例放入 tests/e2e 下并按 spec 文件名过滤。'}
- {'file': 'index.html', 'line': '配置区（ACCEL/BRAKE/DRAG/LAP_LENGTH/TOTAL_LAPS/MAX_SPEED）', 'title': '魔法值硬编码且使用 var 而非 const', 'description': '加速 150、刹车 260、阻力 35、圈长 1.0 等参数均为裸数字，缺乏单位注释或集中配置；同时使用 var 声明常量，与项目 TS 规范（const、类型安全）不一致，存在被误改的风险。', 'suggestion': '提取为单一配置对象并使用 const；补充物理参数注释（单位、调参依据）。'}
- {'file': 'playwright.config.ts', 'line': 'webServer.command 与 vite.config.ts', 'title': '端口配置不一致且语义混乱', 'description': 'vite.config.ts 中 server.port=5173、preview.port=4173（均 strictPort），而 webServer 通过 CLI --port 4173 强行覆盖 dev 端口，导致 dev 与 preview 共用 4173。虽然能运行，但 baseURL 默认 4173 本意指向 preview，配置意图混乱，易在本地同时跑 dev+preview 时端口冲突。', 'suggestion': '明确区分 dev 与 preview 端口，webServer 使用 preview 或统一 server.port。'}

## 🟢 建议（可选优化）
- {'file': 'src/player/PlayerCar.ts', 'line': 'getSpeedRatio()', 'title': '倒车时速度表指针仍正向偏转', 'description': '使用 Math.abs(this.speed)/maxSpeed 归一化，倒车时（负速度）指针仍向正区间偏转，无法区分前进/倒车。对赛车 HUD 可能造成误导。', 'suggestion': '若仪表需区分方向，应保留符号或单独处理倒车显示。'}
- {'file': 'index.html', 'line': '<script> 内联脚本', 'title': '内联 JS 与项目技术栈不一致', 'description': 'index.html 使用内联 IIFE + var 的 ES5 风格，而项目 package.json 为 type:module、vite.config 为 TypeScript，代码风格割裂，无法复用类型与工具函数。', 'suggestion': '将 UI 逻辑拆分为独立 TS 模块并 import，与整体规范对齐。'}
- {'file': 'index.html', 'line': 'getContext("2d") 调用处', 'title': '缺少 null 检查', 'description': 'const ctx = canvas.getContext("2d") 未做空值守卫，一旦返回 null（罕见但可能），后续 drawGauge 将直接抛 TypeError。', 'suggestion': '增加 if (!ctx) return/throw 的防御性校验。'}
- {'file': 'package.json', 'line': '根对象', 'title': '缺少 engines 与 Node 版本约束', 'description': '未声明 Node 版本及包管理器信息，Vite 5 与 Playwright 1.48 对 Node 版本有要求，CI/协作者环境不一致易引发构建失败。', 'suggestion': '补充 engines 字段（如 node >= 18）并可选配置 packageManager。'}
- {'file': 'playwright.config.ts', 'line': 'use.viewport 1280x720', 'title': '截图视口过大导致大量空白', 'description': '游戏 dashboard 主体 max-width 仅 460px，截图视口 1280x720 会包含大量空白背景，基线截图对内容变化不敏感，降低验收有效性。', 'suggestion': '按实际 UI 尺寸设置更紧凑的 viewport 或对元素级截图。'}

## 审查的代码
- index.html
- package.json
- vite.config.ts
- playwright.config.ts
- src/player/PlayerCar.ts
- docs/Reqs/a8d042/662fb6/dev-notes.md
