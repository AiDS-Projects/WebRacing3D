# 代码审查 — 初始化项目脚手架与技术栈

## 评分: 5/10 🚫 需修复

## 🔴 严重问题（必须修复）
- {'file': '.eslintrc.cjs', 'line': 18, 'title': '启用 type-checking 规则但未配置 parserOptions.project', 'description': "extends 中引用了 plugin:@typescript-eslint/recommended-requiring-type-checking，这类规则依赖 TS 类型信息，必须在 parserOptions 中提供 project（或 projectService），但当前 parserOptions 只有 ecmaVersion/sourceType/ecmaFeatures，没有 project 字段。运行 ESLint 时会直接报错 'You have used a rule which requires type information...'，导致整个 lint 工具链无法工作，与本任务『初始化脚手架』的目标直接冲突。", 'suggestion': "在 parserOptions 中补充 project: './tsconfig.json'（若存在 tsconfig.node.json 等多份配置需用数组或 projectService），并确保 type-aware 规则能拿到完整类型上下文。"}
- {'file': 'src/utils/index.ts', 'line': 210, 'title': 'updateCameraAspect 用 window 尺寸而非渲染画布尺寸计算宽高比', 'description': 'updateCameraAspect 通过 getAspectRatio() 读取 window.innerWidth/innerHeight 来计算宽高比，而 AppConfig 是 container 容器式渲染（renderer 绑定到指定 HTMLElement）。当画布不等于视口（例如嵌入布局、侧边栏、缩放容器）时，相机 aspect 与真实渲染分辨率不一致，导致画面拉伸/变形，属于渲染正确性逻辑错误。', 'suggestion': '应从 renderer.domElement（canvas.clientWidth/Height）或传入的容器尺寸计算 aspect，而不是全局 window 尺寸；同时把该函数改为接收 renderer 或 container 参数，保持单一数据来源。'}

## 🟡 警告（建议修复）
- {'file': 'src/utils/index.ts', 'line': 165, 'title': 'disposeMaterial 用 as unknown as Dict + Object.keys 反射遍历材质属性', 'description': '为查找纹理，代码用 (material as unknown as Dict)[key] 对材质对象做反射式遍历，并通过 (value as THREE.Texture).isTexture 判断。这违反了项目自身『减少 as 断言、外部/内部数据走严格类型』的规范，且 Object.keys 只返回自身可枚举属性，可能漏掉继承或不可枚举的贴图槽位；对每个材质逐 key 遍历也低效。', 'suggestion': "维护一份明确的贴图字段清单（如 ['map','normalMap','roughnessMap','metalnessMap','aoMap','emissiveMap','alphaMap','envMap'] 等），显式读取并 dispose，去掉 as unknown as Dict 断言。"}
- {'file': 'src/types/index.ts / src/utils/index.ts', 'line': 0, 'title': 'Size、Listener/EventCallback 等类型跨文件重复定义', 'description': 'interface Size 在 src/types/index.ts 与 src/utils/index.ts 各定义一份，Listener<T> 与 EventCallback<T>、Dict 与 EventMap 语义高度重叠。违反项目『共享逻辑优先、单一数据源』规则，后续改动容易出现两处不一致。', 'suggestion': '统一由 src/types/index.ts 作为类型唯一出口，utils 层从 types 重新导出或直接引用，删除重复定义。'}
- {'file': 'src/types/index.ts', 'line': 0, 'title': 'AssetMap 联合类型中混入裸 object 使类型退化为无意义', 'description': 'AssetMap 的索引值类型为 THREE.Texture | THREE.Object3D | THREE.Audio | object | HTMLVideoElement，其中小写 object 会吸收所有前面的对象类型，联合实际等价于 object | HTMLVideoElement，导致调用方拿到的都是 object，无法获得任何有效类型推断，形同 any。', 'suggestion': '改为 unknown 并在消费处用类型守卫收窄，或设计为带 kind 判别字段的联合类型，去除裸 object。'}
- {'file': 'src/utils/index.ts', 'line': 185, 'title': 'resizeRendererToDisplaySize 硬编码像素比上限且未 setPixelRatio', 'description': 'Math.min(window.devicePixelRatio, 2) 中的 2 是魔法值，且完全忽略 RendererConfig.pixelRatio 配置；同时只调用 setSize(width,height,false)，从未调用 renderer.setPixelRatio，导致设备像素比与配置脱节，高 DPI 屏上可能渲染模糊或尺寸异常。', 'suggestion': '像素比上限提取为常量或从配置读取，并在设置尺寸前调用 renderer.setPixelRatio(pixelRatio)。'}
- {'file': 'src/utils/index.ts', 'line': 200, 'title': 'updateCameraAspect 存在明显死代码', 'description': 'const canvas = camera.projectionMatrix; void canvas; 两行无任何作用，变量名 canvas 与 projectionMatrix 语义严重不符，是遗留调试/草稿代码，降低可读性并误导维护者。', 'suggestion': '删除这两行死代码。'}

## 🟢 建议（可选优化）
- {'file': 'src/utils/index.ts', 'line': 0, 'title': 'random() 是对 Math.random() 的无意义包装', 'description': 'random() 仅 return Math.random()，没有额外语义或参数，属于低价值抽象。', 'suggestion': '删除该函数，直接使用 Math.random()。'}
- {'file': 'src/utils/index.ts', 'line': 0, 'title': 'Maybe/Nullable/Optional 三个别名语义重叠', 'description': 'Maybe<T>=T|null|undefined、Nullable<T>=T|null、Optional<T>=T|undefined 同时存在，增加心智负担且易混用。', 'suggestion': '只保留 Maybe 或 Nullable 一个，Optional 可直接用 TS 内建的可选/Partial 表达。'}
- {'file': 'src/types/index.ts', 'line': 0, 'title': 'IUpdatable/IDisposable 使用 C# 风格 I 前缀', 'description': 'TypeScript 生态惯例不使用 I 前缀（eslint 生态亦不推荐），与项目其余接口命名（RendererConfig、AppConfig 等）不一致。', 'suggestion': '重命名为 Updatable/Disposable，保持命名一致。'}
- {'file': 'src/utils/index.ts', 'line': 0, 'title': 'disposeObject 仅处理 Mesh，未覆盖 Sprite/Line/Points', 'description': 'traverse 中只对 THREE.Mesh 做 geometry/material 释放，Sprite、Line、Points 等同样持有 geometry 与 material 的对象会内存泄漏。', 'suggestion': '泛化到任意持有 geometry/material 的对象（如判断 object.geometry / object.material 存在即释放）。'}
- {'file': 'src/utils/index.ts', 'line': 0, 'title': 'normalize 在 min===max 时静默返回 0 可能掩盖错误', 'description': '区间为零时直接返回 0 会让调用方无法区分『合法归一化结果』与『非法输入』，可能掩盖上游传参错误。', 'suggestion': '考虑返回 NaN 或显式抛错/加 JSDoc 说明约定，便于定位问题。'}

## 审查的代码
- src/types/index.ts
- src/utils/index.ts
- .eslintrc.cjs
- .prettierrc
- .claude/manifest.json
- package.json
- tsconfig.json
- vite.config.ts
- src/index.ts
- docs/Reqs/a8d042/48b6af/dev-notes.md
