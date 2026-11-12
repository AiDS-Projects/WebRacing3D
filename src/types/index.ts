import type * as THREE from 'three';

/** 三维向量坐标（可序列化） */
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/** 颜色配置：支持 CSS 字符串或 THREE.Color */
export type ColorLike = string | number | THREE.Color;

/** 相机类型 */
export type CameraType = 'perspective' | 'orthographic';

/** 透视相机配置 */
export interface PerspectiveCameraConfig {
  type: 'perspective';
  fov?: number;
  near?: number;
  far?: number;
  aspect?: number;
  position?: Vec3;
  lookAt?: Vec3;
}

/** 正交相机配置 */
export interface OrthographicCameraConfig {
  type: 'orthographic';
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
  near?: number;
  far?: number;
  position?: Vec3;
  lookAt?: Vec3;
}

/** 相机统一配置 */
export type CameraConfig = PerspectiveCameraConfig | OrthographicCameraConfig;

/** 渲染器配置 */
export interface RendererConfig {
  antialias?: boolean;
  alpha?: boolean;
  pixelRatio?: number | 'device';
  shadowMap?: boolean;
  toneMapping?: THREE.ToneMapping;
  toneMappingExposure?: number;
  clearColor?: ColorLike;
  clearAlpha?: number;
}

/** 场景基础配置 */
export interface SceneConfig {
  background?: ColorLike;
  environment?: string | THREE.Texture;
  fog?: {
    color: ColorLike;
    near?: number;
    far?: number;
    density?: number;
  };
}

/** 应用初始化配置 */
export interface AppConfig {
  container: HTMLElement;
  renderer?: RendererConfig;
  camera?: CameraConfig;
  scene?: SceneConfig;
  autoResize?: boolean;
}

/** 光源通用基类 */
export interface LightConfigBase {
  id?: string;
  color?: ColorLike;
  intensity?: number;
}

/** 方向光配置 */
export interface DirectionalLightConfig extends LightConfigBase {
  type: 'directional';
  position: Vec3;
  castShadow?: boolean;
  target?: Vec3;
}

/** 环境光配置 */
export interface AmbientLightConfig extends LightConfigBase {
  type: 'ambient';
}

/** 点光源配置 */
export interface PointLightConfig extends LightConfigBase {
  type: 'point';
  position: Vec3;
  distance?: number;
  decay?: number;
}

/** 聚光灯配置 */
export interface SpotLightConfig extends LightConfigBase {
  type: 'spot';
  position: Vec3;
  target?: Vec3;
  angle?: number;
  penumbra?: number;
  castShadow?: boolean;
}

/** 光源统一配置 */
export type LightConfig =
  | DirectionalLightConfig
  | AmbientLightConfig
  | PointLightConfig
  | SpotLightConfig;

/** 资源类型 */
export type AssetKind = 'texture' | 'model' | 'audio' | 'json' | 'video';

/** 资源清单条目 */
export interface AssetManifestEntry {
  id: string;
  url: string;
  kind: AssetKind;
}

/** 资源加载结果 */
export interface AssetMap {
  [id: string]: THREE.Texture | THREE.Object3D | THREE.Audio | object | HTMLVideoElement;
}

/** 帧更新上下文 */
export interface UpdateContext {
  delta: number;
  elapsed: number;
  time: number;
}

/** 可更新对象接口 */
export interface IUpdatable {
  update(context: UpdateContext): void;
}

/** 可释放对象接口 */
export interface IDisposable {
  dispose(): void;
}

/** 事件回调类型 */
export type EventCallback<T = unknown> = (payload: T) => void;

/** 事件映射 */
export interface EventMap {
  [event: string]: unknown;
}

/** 日志级别 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/** 尺寸（像素） */
export interface Size {
  width: number;
  height: number;
}

/** 交互模式 */
export type InteractionMode = 'orbit' | 'fly' | 'none';

/** 应用状态快照 */
export interface AppState {
  running: boolean;
  paused: boolean;
  frame: number;
  elapsed: number;
}

/* ============================================================================
 * 脚手架初始化：生成器 / 状态机 / 校验器 类型
 * ============================================================================ */

/** 骨架标志文件：任一缺失即判定项目需走全量骨架生成 */
export type SkeletonFlagFile = 'vite.config.ts' | 'index.html' | 'src/main.ts';

/** 生成路由 */
export type GenerationRoute = 'full' | 'incremental';

/** 增量生成器路由判断结果 */
export interface GenerationRouteDecision {
  route: GenerationRoute;
  /** 缺失的骨架标志文件；非空时强制走全量生成 */
  missingFlags: SkeletonFlagFile[];
  /** 骨架标志缺失时，禁止对语义不一致文件做 diff */
  forceFull: boolean;
}

/** 生成器前置 cleanup 步骤要删除的错误业务目录（恢复空项目基线） */
export const PRE_GENERATION_CLEANUP_DIRS = [
  'src/camera/',
  'src/physics/',
  'src/player/',
  'src/race/',
] as const;

/** 单个待清理目录 */
export type CleanupDirectory = (typeof PRE_GENERATION_CLEANUP_DIRS)[number];

/** base_stages 状态机阶段名（含 development_failed） */
export type BaseStageName =
  | 'init'
  | 'development'
  | 'development_failed'
  | 'validation'
  | 'complete';

/** 阶段执行结果 */
export interface StageResult {
  stage: BaseStageName;
  /** 生成/校验产出的文件清单；为空或非法时进入失败重试分支 */
  files: string[];
}

/** development 阶段失败信息（对应 2026-10-15_02） */
export interface DevelopmentFailedInfo {
  stage: 'development_failed';
  reason: 'empty_files' | 'invalid_files';
  files: string[];
}

/** 校验器路径白名单硬门禁：非白名单路径在返回前直接判 fail */
export const VALIDATOR_PATH_WHITELIST: readonly string[] = [
  'src/',
  'src/main.ts',
  'src/types/',
  'index.html',
  'vite.config.ts',
];

/** 校验器路径黑名单（错误业务目录，禁止再次入库） */
export const VALIDATOR_PATH_BLOCKLIST: readonly string[] = [
  'src/camera/',
  'src/physics/',
  'src/player/',
  'src/race/',
];

/** 校验结果 */
export interface ValidationResult {
  ok: boolean;
  /** 命中黑名单或不在白名单内的路径 */
  blockedPaths: string[];
}

/* ============================================================================
 * scaffold_only 模式：分类器 / 上下文注入 / 生成器 / 语法约束 / 内容语义门禁
 * ============================================================================ */

/** planner/ProductAgent 入口 classify_ticket() 命中的骨架关键词（命中即 scaffold_only=true） */
export const SCAFFOLD_ONLY_KEYWORDS = [
  '骨架',
  'skeleton',
  '统一入口',
  '目录结构',
  '类型定义',
] as const;

/** 骨架关键词 */
export type ScaffoldOnlyKeyword = (typeof SCAFFOLD_ONLY_KEYWORDS)[number];

/** classify_ticket() 工单分类结果 */
export interface TicketClassification {
  /** 命中骨架关键词后置 true，进入 scaffold_only 模式 */
  scaffoldOnly: boolean;
  /** 命中的骨架关键词；空数组表示普通模式 */
  matchedKeywords: ScaffoldOnlyKeyword[];
}

/** classify_ticket() 分类器入口签名 */
export type TicketClassifier = (ticketText: string) => TicketClassification;

/** scaffold_only 模式下禁止注入的业务参考实现条目（RAG/知识库检索阶段跳过） */
export const SCAFFOLD_ONLY_BLOCKED_CONTEXT = [
  'types/track',
  'VehiclePhysics',
  'LapTracker',
] as const;

/** 被禁止注入的上下文条目 */
export type BlockedContextEntry = (typeof SCAFFOLD_ONLY_BLOCKED_CONTEXT)[number];

/** scaffold_only 模式固定文件树（生成器绑定该固定结构） */
export const SCAFFOLD_ONLY_FILE_TREE = [
  'src/core/',
  'src/types/index.ts',
  'src/utils/index.ts',
  'src/index.ts',
  'vite.config.ts',
  'tsconfig.json',
] as const;

/** 固定文件树中的单个文件路径 */
export type ScaffoldOnlyFile = (typeof SCAFFOLD_ONLY_FILE_TREE)[number];

/** scaffold_only 模式文件内容模板：`export {}` + TODO 占位注释 */
export const SCAFFOLD_ONLY_FILE_TEMPLATE = `export {}

// TODO: 待实现（scaffold_only 骨架占位）`;

/** scaffold_only 输出禁止出现的 import 语句 */
export const SCAFFOLD_ONLY_FORBIDDEN_IMPORTS = [
  'import * as THREE',
  'import three',
] as const;

/** scaffold_only 输出禁止出现的业务域标识符 */
export const SCAFFOLD_ONLY_FORBIDDEN_IDENTIFIERS = [
  'TrackPoint3D',
  'LapResult',
  'VehiclePhysicsConfig',
  'CarInput',
] as const;

/** 被禁止的业务域标识符 */
export type ForbiddenBusinessIdentifier =
  (typeof SCAFFOLD_ONLY_FORBIDDEN_IDENTIFIERS)[number];

/** 校验器内容语义门禁：单文件业务内容检查结果 */
export interface FileSemanticGate {
  path: string;
  /** 是否包含业务域标识符或非法 import */
  containsBusinessContent: boolean;
  /** 命中的非法标识符 / import 清单 */
  matchedTokens: string[];
}

/** 跨文件重复定义一致性检查结果（针对 types/index.ts） */
export interface DuplicateDefinitionGate {
  /** 检测到的重复定义标识符 */
  duplicateIdentifiers: string[];
  /** 是否一致（无重复定义） */
  consistent: boolean;
}

/** 内容语义门禁升级后的校验结果 */
export interface SemanticValidationResult extends ValidationResult {
  /** 逐文件业务标识符校验明细 */
  fileGates: FileSemanticGate[];
  /** types/index.ts 跨文件重复定义一致性检查 */
  duplicateGate: DuplicateDefinitionGate;
}