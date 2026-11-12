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