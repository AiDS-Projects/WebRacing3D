import * as THREE from 'three';

/* ============================================================================
 * 骨架占位：场景初始化
 * ==========================================================================*/

/**
 * 创建并返回空的 THREE 场景。
 *
 * 本文件为脚手架骨架，仅完成场景初始化占位：
 * 不引入 camera / physics / player / race 等业务模块，
 * 业务逻辑由后续工单在对应模块中实现后接入。
 */
function createScene(): THREE.Scene {
  return new THREE.Scene();
}

/* ============================================================================
 * planner/ProductAgent 入口：工单分类与脚手架生成
 * ==========================================================================*/

/** 脚手架关键词：命中任一即判定为 scaffold_only 工单 */
const SCAFFOLD_KEYWORDS = ['骨架', 'skeleton', '统一入口', '目录结构', '类型定义'];

/** 脚手架固定文件树（scaffold_only 模式下生成器绑定） */
const SCAFFOLD_FILE_TREE = [
  'src/core/',
  'src/types/index.ts',
  'src/utils/index.ts',
  'src/index.ts',
  'vite.config.ts',
  'tsconfig.json',
];

/** 业务参考实现黑名单：scaffold_only 模式下禁止注入的条目 */
const SCAFFOLD_BLACKLIST_ENTRIES = [
  'types/track',
  'VehiclePhysics',
  'LapTracker',
];

/** 业务域标识符：脚手架输出中禁止出现的符号 */
const BUSINESS_IDENTIFIERS = [
  'TrackPoint3D',
  'LapResult',
  'VehiclePhysicsConfig',
  'CarInput',
];

/** 脚手架文件内容模板：`export {}` + TODO 占位注释 */
const SCAFFOLD_TEMPLATE = `export {};

// TODO: 脚手架占位，待后续工单实现具体逻辑
`;

/** 工单 */
interface Ticket {
  /** 工单原文 */
  raw: string;
}

/** 分类后的工单 */
interface ClassifiedTicket {
  raw: string;
  scaffoldOnly: boolean;
}

/** 知识库检索条目 */
interface RAGEntry {
  name: string;
}

/** 分类器：命中脚手架关键词即置 scaffold_only=true */
function classifyTicket(ticket: Ticket): ClassifiedTicket {
  const scaffoldOnly = SCAFFOLD_KEYWORDS.some((keyword) =>
    ticket.raw.toLowerCase().includes(keyword.toLowerCase())
  );
  return { raw: ticket.raw, scaffoldOnly };
}

/** 上下文注入（RAG/知识库检索） */
function buildContext(ticket: ClassifiedTicket, ragEntries: RAGEntry[]): string {
  if (ticket.scaffoldOnly) {
    // scaffold_only 模式：跳过业务参考实现，上下文仅保留工单原文
    return ticket.raw;
  }
  const refs = ragEntries
    .filter((entry) => !SCAFFOLD_BLACKLIST_ENTRIES.includes(entry.name))
    .map((entry) => entry.name)
    .join('\n');
  return `${ticket.raw}\n\n${refs}`;
}

/** 生成器：返回当前工单应生成的文件树 */
function buildFileTree(ticket: ClassifiedTicket): string[] {
  if (ticket.scaffoldOnly) {
    return [...SCAFFOLD_FILE_TREE];
  }
  // 非 scaffold 模式：文件树由业务工单决定（本骨架暂返回空）
  return [];
}

/** 生成器：返回单个文件的脚手架内容 */
function generateFileContent(path: string, ticket: ClassifiedTicket): string {
  if (!ticket.scaffoldOnly || path.endsWith('/')) {
    // 目录占位不生成文件内容
    return '';
  }
  return SCAFFOLD_TEMPLATE;
}

/** 校验结果 */
interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/** 校验器：内容语义门禁（路径白名单 + 业务标识符 + three 导入 + 跨文件重复定义） */
function validateScaffoldOutput(files: Record<string, string>): ValidationResult {
  const errors: string[] = [];

  for (const [path, content] of Object.entries(files)) {
    // 1. 路径白名单校验
    if (!SCAFFOLD_FILE_TREE.includes(path)) {
      errors.push(`路径不在脚手架白名单内: ${path}`);
    }

    // 2. 业务域标识符校验
    for (const id of BUSINESS_IDENTIFIERS) {
      if (content.includes(id)) {
        errors.push(`${path} 包含业务域标识符: ${id}`);
      }
    }

    // 3. 语法约束：禁止 three 导入
    if (/import\s+\*\s+as\s+THREE/.test(content) || /import\s+three/.test(content)) {
      errors.push(`${path} 包含被禁止的 three 导入`);
    }
  }

  // 4. types/index.ts 跨文件重复定义一致性检查
  errors.push(...checkCrossFileDuplicates(files));

  return { valid: errors.length === 0, errors };
}

/** 跨文件重复定义检查：其他文件不得重复定义 types/index.ts 中已导出的声明 */
function checkCrossFileDuplicates(files: Record<string, string>): string[] {
  const errors: string[] = [];
  const typesFile = files['src/types/index.ts'];
  if (!typesFile) {
    return errors;
  }

  const declared = extractDeclarations(typesFile);
  for (const [path, content] of Object.entries(files)) {
    if (path === 'src/types/index.ts') {
      continue;
    }
    for (const name of declared) {
      if (content.includes(name)) {
        errors.push(`${path} 重复定义了类型: ${name}`);
      }
    }
  }
  return errors;
}

/** 提取 export 声明名，用于跨文件重复定义检查 */
function extractDeclarations(content: string): string[] {
  const re = /export\s+(?:type|interface|const|class|enum|function)\s+([A-Za-z_$][\w$]*)/g;
  const names: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(content)) !== null) {
    names.push(match[1]);
  }
  return names;
}

/** Agent 执行结果 */
interface AgentResult {
  context: string;
  files: Record<string, string>;
  validation: ValidationResult;
}

/** planner/ProductAgent 入口：分类 -> 注入上下文 -> 生成 -> 校验 */
function runProductAgent(ticket: Ticket, ragEntries: RAGEntry[] = []): AgentResult {
  const classified = classifyTicket(ticket);
  const context = buildContext(classified, ragEntries);

  const files: Record<string, string> = {};
  for (const path of buildFileTree(classified)) {
    files[path] = generateFileContent(path, classified);
  }

  const validation = validateScaffoldOutput(files);
  return { context, files, validation };
}

export { createScene, classifyTicket, runProductAgent };