# 代码审查 — 初始化项目脚手架与技术栈

## 评分: 4/10 🚫 需修复

## 🔴 严重问题（必须修复）
- {'file': 'package.json', 'line': 'devDependencies', 'title': '缺少 three 运行时依赖，构建必然失败', 'description': "src/main.ts 使用 `import * as THREE from 'three'`，src/types/index.ts 使用 `THREE.Color/ToneMapping/Texture`，vite.config.ts 的 manualChunks 与 optimizeDeps.include 也显式引用 'three'，但 package.json 仅声明了 @playwright/test 和 vite，完全没有 three 及 @types/three。安装依赖后 dev/build 会因找不到模块 three 而崩溃。three 属于运行时依赖，应放入 dependencies 而非 devDependencies，并补充 @types/three。"}
- {'file': 'src/main.ts', 'line': 'checkCrossFileDuplicates', 'title': '跨文件重复检查用 includes 判断，将“引用”误判为“重复定义”', 'description': 'checkCrossFileDuplicates 对每个已声明类型名调用 `content.includes(name)`。任何文件只要在函数签名/注解中引用类型名（如 utils 中使用 Vec3），就会被误报为“重复定义了类型”。这会让校验器对正常引用产生大量假阳性，导致 scaffold 校验永远无法通过。应使用与 extractDeclarations 相同的声明语法正则进行匹配，而非子串包含。'}
- {'file': 'src/main.ts', 'line': 'generateFileContent', 'title': '对 tsconfig.json 生成 `export {}`，输出非法 JSON', 'description': "SCAFFOLD_FILE_TREE 包含 'tsconfig.json' 与 'vite.config.ts'，generateFileContent 对非目录路径一律返回 SCAFFOLD_TEMPLATE（`export {}`）。tsconfig.json 是 JSON 文件，`export {}` 是非法 JSON，生成的配置必然损坏且无法被解析。生成器应对 .json 与 .ts 文件区分内容模板。"}
- {'file': 'src/main.ts', 'line': '1', 'title': 'main.ts 自身使用被禁止的 `import * as THREE`，且嵌入完整 ProductAgent 流水线，违反 scaffoldOnly 约束', 'description': '脚手架语法约束 bannedImports 明确禁止 `import * as THREE` 与 `import three`，validateScaffoldOutput 的正则 `/import\\s+\\*\\s+as\\s+THREE/` 会命中本文件第 1 行，即 main.ts 一旦进入校验即被自身规则拒绝。同时该“骨架”文件实际内嵌了 classifyTicket/buildFileTree/runProductAgent 等完整规划器逻辑，与 SCAFFOLD_TEMPLATE 宣称的“`export {}` 占位、不引入业务模块”目标自相矛盾，存在明显范围失控与语义错位。'}

## 🟡 警告（建议修复）
- {'file': 'vite.config.ts', 'line': 'build.sourcemap', 'title': '生产构建开启 sourcemap 泄露源码', 'description': "`sourcemap: true` 会将完整源代码映射打进生产产物，便于攻击者还原源码逻辑。生产环境应设为 false 或 'hidden'，仅保留 stack trace 定位能力。"}
- {'file': 'src/main.ts', 'line': 'classifyTicket', 'title': '分类器子串匹配过于粗糙且冗余', 'description': "`ticket.raw.toLowerCase().includes(keyword.toLowerCase())` 为朴素子串匹配，'skeleton' 会命中 'skeletonizer' 等普通英文单词造成误分类；同时对 'skeleton' 等纯小写关键词重复调用 toLowerCase() 属无意义操作，中文关键词更无需大小写归一化。"}
- {'file': 'src/main.ts', 'line': 'extractDeclarations', 'title': '声明提取正则遗漏 re-export 与 export default', 'description': "正则仅覆盖 `export type|interface|const|class|enum|function`，无法识别 `export { Foo } from './foo'`、`export type { Bar }`、`export default` 等语法，导致这些导出名不会被纳入跨文件重复检查，检查存在盲区。"}
- {'file': 'src/main.ts', 'line': 'SCAFFOLD_FILE_TREE', 'title': '固定文件树与白名单不一致', 'description': "SCAFFOLD_FILE_TREE 含 'src/index.ts'、目录 'src/core/'，而 generator.validator 白名单与 deliveryWhitelist 均为 'src/main.ts' 且不含 'src/index.ts'。文件树与白名单的入口文件命名（index.ts vs main.ts）不一致，会造成路径校验与交付清单相互矛盾。"}
- {'file': 'vite.config.ts', 'line': 'server.port', 'title': '硬编码魔法值', 'description': '端口 5173、chunkSizeWarningLimit 1500 等为硬编码魔法数字，缺乏集中配置或注释说明，维护时难以追溯其取值依据。'}
- {'file': 'vite.config.ts', 'line': 'server.open', 'title': 'open: true 强制自动打开浏览器', 'description': '在 CI 或多次并行 dev 场景下，自动拉起浏览器窗口会造成干扰。建议改为 false 或通过环境变量控制。'}

## 🟢 建议（可选优化）
- {'file': 'vite.config.ts', 'line': 'plugins', 'title': '空 plugins 数组冗余', 'description': '`plugins: []` 可整体省略，保留空数组无实际作用，反而暗示未来需在此处扩展但当前无插件。'}
- {'file': 'src/types/index.ts', 'line': 'ColorLike', 'title': 'number 作为颜色类型语义歧义', 'description': '`ColorLike = string | number | THREE.Color` 中的 number 未说明是十六进制整型、RGB 分量还是索引，缺乏注释约束，调用方难以确定取值范围。'}
- {'file': 'package.json', 'line': 'name', 'title': '包名与项目/描述不一致', 'description': "项目为 WebRacing3D，包名为 'ads-game-ui'，description 又写“基础游戏 UI：速度表…”，三者指向混乱，建议统一命名与描述口径。"}
- {'file': 'src/main.ts', 'line': 'buildFileTree', 'title': '冗余展开拷贝', 'description': '`return [...SCAFFOLD_FILE_TREE]` 的展开拷贝无必要，直接 `return SCAFFOLD_FILE_TREE` 即可，且避免误导读者以为存在可变性保护需求。'}
- {'file': 'package.json', 'line': 'generator.deliveryWhitelist', 'title': '白名单引用未交付文件', 'description': 'deliveryWhitelist 与 validator 白名单列出 tsconfig.json、tsconfig.node.json、index.html，但当前展示内容中这些文件均未实际交付，清单与交付物不匹配，需补齐或从白名单移除。'}

## 审查的代码
- vite.config.ts
- package.json
- src/main.ts
- src/types/index.ts
- src/types/input.ts
- src/types/scene.ts
- src/utils/index.ts
- docs/Reqs/a8d042/48b6af/dev-notes.md
