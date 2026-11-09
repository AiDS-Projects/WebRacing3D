# 代码审查 — 构建 3D 环形赛道场景

## 评分: 4/10 🚫 需修复

## 🔴 严重问题（必须修复）
- {'id': 'C1', 'file': 'src/index.ts', 'line': 4, 'title': '导出路径与文件命名不一致，存在模块解析失败风险', 'description': 'index.ts 导出 `./track/TrackBuilder`，但实际提供的源码文件为 `src/track/Track.ts`，内部也未定义名为 TrackBuilder 的导出。若 TrackBuilder.ts 不存在，构建将直接报错。同理 `./main`、`./utils/math` 均未在提供片段中验证存在。', 'suggestion': '统一文件名与导出符号，确认 TrackBuilder/main/math 实际存在并暴露对应命名导出。'}
- {'id': 'C2', 'file': 'src/camera/FollowCamera.ts', 'line': 25, 'title': 'DEFAULT_CONFIG 中的 Vector3 为模块级共享可变对象', 'description': '`DEFAULT_CONFIG.offset` 是模块级单例 Vector3。构造函数用 `{ ...DEFAULT_CONFIG, ...config }` 浅拷贝后，未传 offset 的实例其 `this.config.offset` 与全局默认是同一个对象引用。调用 `setOffset()` 执行 `this.config.offset.copy(offset)` 会污染全局默认值，导致后续新建的 FollowCamera 实例拿到被篡改的偏移。', 'suggestion': '在构造函数中对 Vector3 字段做深拷贝（如 `offset: (config.offset ?? DEFAULT_CONFIG.offset).clone()`）。'}
- {'id': 'C3', 'file': 'src/track/Track.ts', 'line': 118, 'title': 'buildWall 声称双面渲染，实际几何为单面', 'description': '函数注释标注「双面渲染」，但只生成了一层顶点且法线统一指向外侧（outwardSign），索引也未复制背面。默认材质背面剔除下，从赛道内侧看护栏将完全不可见，形成视觉与物理护栏不一致。', 'suggestion': '要么补背面顶点+反向法线，要么在材质上显式设置 `side: THREE.DoubleSide` 并删除误导性注释。'}
- {'id': 'C4', 'file': 'src/types/track.ts', 'line': 1, 'title': '两套并行中心线数据模型与配置割裂，契约无实现支撑', 'description': 'types/track.ts 定义 TrackCenterlinePoint/TrackCenterline/TrackBounds/TrackConfig，track/Track.ts 又定义 TrackCenterlineSample/TrackCenterlineData/NearestSampleResult 与 TRACK_CONFIG，字段命名（distance/cumulativeDistance、samples/points）互不兼容。且 TrackData 声明的 `sample`/`progressOf` 函数契约在 Track.ts 中无对应实现，TrackConfig.radius/trackWidth 等参数未接入构建逻辑。', 'suggestion': '合并为单一数据模型（建议以 types/track.ts 为准），并在构建器中真正实现 sample/progressOf，将 TrackConfig 接线到几何生成。'}

## 🟡 警告（建议修复）
- {'id': 'W1', 'file': 'src/track/Track.ts', 'line': 80, 'title': 'buildStripedRibbon 未做闭环包裹，与其它构建函数不一致', 'description': 'buildFlatRibbon 与 buildWall 均用 `u % 1` 处理 i===segments 时的闭合，而 buildStripedRibbon 末段 `u1 = (i+1)/segments = 1.0` 直接传入 getPointAt/getTangentAt，未包裹。闭合点数值可能产生缝隙或切向跳变，红白条纹在接缝处也可能错位。', 'suggestion': '统一闭环采样策略，对 u1 同样做 `% 1` 处理，并验证末段条纹与首段颜色衔接。'}
- {'id': 'W2', 'file': 'src/track/Track.ts', 'line': 63, 'title': '横向符号约定混乱，存在左右颠倒风险', 'description': 'computeSide 注释写「车道左向」，实际 `crossVectors(tangent, UP)` 在默认坐标系下的结果方向与「左/右」的关系未明；types/track.ts 中 TrackBounds 注释「右为正」，buildWall 用 `Math.sign(lateralOffset)` 推外侧法线。三处符号约定互相依赖却无统一说明，极易在碰撞检测中把左右边界算反。', 'suggestion': '统一约定（如明确 side = 右侧法向），并在 computeSide、TrackBounds、TrackSide 处一致化注释与实现。'}
- {'id': 'W3', 'file': 'src/track/Track.ts', 'line': 24, 'title': '几何尺寸硬编码且不可派生校验', 'description': 'roadHalfWidth=4.0、curbWidth=0.8、barrierLateralOffset=4.95 等为手写魔法值，4.95 与 4.0+0.8 之间的差值（0.15）无解释，改任一处即可能产生护栏与路肩重叠或悬空。curveSegments=256 与 sampleCount=512 两套离散精度也未对齐。', 'suggestion': '用派生关系（如 barrierLateralOffset = roadHalfWidth + curbWidth + gap）或常量公式替代手写值，统一几何分段与采样精度。'}
- {'id': 'W4', 'file': 'src/track/Track.ts', 'line': 36, 'title': 'CONTROL_POINTS 硬编码，TrackConfig 形参形同虚设', 'description': '赛道形状由写死的 CONTROL_POINTS 决定，types/track.ts 中 TrackConfig.radius/trackWidth 等参数完全没有参与构建，配置层与实际构建器脱节。', 'suggestion': '让 TrackConfig 实际驱动控制点生成或半径/宽度，或明确删除无用配置字段避免误导调用方。'}
- {'id': 'W5', 'file': 'src/track/Track.ts', 'line': 52, 'title': '逐顶点重复调用弧长参数化查找，构建性能可优化', 'description': 'buildFlatRibbon/buildStripedRibbon/buildWall 对每个采样点调用 curve.getPointAt/getTangentAt，内部每次做弧长参数化查表，存在重复计算。', 'suggestion': '先用 getSpacedPoints/getTangent 一次性预采样缓存，几何构建时直接读取。'}
- {'id': 'W6', 'file': 'src/types/track.ts', 'line': 141, 'title': 'TrackStartLine.direction 注释自相矛盾', 'description': '注释写「单位切向量，垂直起跑线」——切向量沿行进方向，应与起跑线平行而非垂直，二者语义冲突，会误导圈数/穿越判定实现。', 'suggestion': '明确该向量是起跑线的法向（穿越方向）还是切向，并统一命名。'}

## 🟢 建议（可选优化）
- {'id': 'S1', 'file': 'src/types/track.ts', 'line': 1, 'title': '用 TrackPoint3D 统一坐标类型，消除手写接口重复', 'description': 'track/Track.ts 手写 THREE.Vector3 接口（TrackCenterlineSample 等）与 types/track.ts 的 Vector3Tuple 契约重复，NearestSampleResult 与 TrackSample 概念重叠。', 'suggestion': '统一复用 TrackPoint3D/Vector3Tuple 契约，收敛为单一中心线类型。'}
- {'id': 'S2', 'file': 'src/types/track.ts', 'line': 122, 'title': 'direction 字面量联合类型建议命名化', 'description': '`direction: 1 | -1 | 0` 的语义依赖注释，建议提取为 `type TrackDirection = 1 | -1 | 0` 或枚举并附常量名（Forward/Reverse/Idle）。', 'suggestion': '提取命名类型/枚举提升可读性与复用。'}
- {'id': 'S3', 'file': 'src/track/Track.ts', 'line': 21, 'title': 'stripeSegments 等配置缺少语义注释', 'description': 'stripeSegments=2 表示「每段红白条纹对应的段数」仅能靠推理，curveSegments/grassSize 等也缺说明。', 'suggestion': '为每个配置常量补充单位与语义说明。'}
- {'id': 'S4', 'file': 'src/track/Track.ts', 'line': 155, 'title': 'buildCenter 函数不完整且缺 JSDoc', 'description': 'buildCenter 在展示片段中即被截断，且核心构建入口缺少 JSDoc，调用方难以理解返回值与副作用。', 'suggestion': '补全实现并为构建入口补充完整 JSDoc。'}
- {'id': 'S5', 'file': 'src/types/track.ts', 'line': 130, 'title': 'TrackConfig.radius 语义含糊', 'description': '注释「具体语义由构建器决定」等于未定义契约，配合硬编码 CONTROL_POINTS 更显歧义。', 'suggestion': '明确定义 radius 含义或移除该字段。'}

## 审查的代码
- src/types/track.ts
- src/track/Track.ts
- src/index.ts
- docs/Reqs/a8d042/c4c38e/dev-notes.md
