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