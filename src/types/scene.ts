import type {
  Camera,
  ColorRepresentation,
  Object3D,
  Scene,
  Vector3Tuple,
  WebGLRendererParameters,
} from 'three'

/**
 * 场景模块类型定义
 * 为 Three.js 场景、相机、渲染器、灯光等提供统一的配置类型，
 * 供场景初始化与后续模块共享使用。
 */

/** 坐标三元组，等价于 [x, y, z] */
export type Position3D = Vector3Tuple

/** 场景背景配置 */
export interface SceneBackgroundConfig {
  /** 背景色，支持颜色值、十六进制字符串或颜色实例 */
  color?: ColorRepresentation
  /** 背景纹理 URL（可选） */
  textureUrl?: string
  /** 背景是否透明 */
  transparent?: boolean
}

/** 雾效配置 */
export interface FogConfig {
  /** 雾的类型 */
  type?: 'linear' | 'exp' | 'exp2'
  /** 雾的颜色 */
  color?: ColorRepresentation
  /** 线性雾起始距离 */
  near?: number
  /** 线性雾结束距离 */
  far?: number
  /** 指数雾密度 */
  density?: number
}

/** 场景配置 */
export interface SceneConfig {
  /** 背景配置 */
  background?: SceneBackgroundConfig
  /** 雾效配置 */
  fog?: FogConfig
  /** 场景名称 */
  name?: string
}

/** 透视相机配置 */
export interface PerspectiveCameraConfig {
  type?: 'perspective'
  /** 垂直视野角（度） */
  fov?: number
  /** 近裁剪面 */
  near?: number
  /** 远裁剪面 */
  far?: number
  /** 初始位置 */
  position?: Position3D
  /** 观察目标点 */
  lookAt?: Position3D
  /** 宽高比（默认取渲染器宽高比） */
  aspect?: number
}

/** 正交相机配置 */
export interface OrthographicCameraConfig {
  type: 'orthographic'
  near?: number
  far?: number
  position?: Position3D
  lookAt?: Position3D
  /** 视锥范围 */
  frustum?: {
    left?: number
    right?: number
    top?: number
    bottom?: number
  }
}

/** 相机配置联合类型 */
export type CameraConfig = PerspectiveCameraConfig | OrthographicCameraConfig

/** 渲染器配置 */
export interface RendererConfig {
  /** 画布容器元素 ID */
  containerId?: string
  /** 画布元素 */
  canvas?: HTMLCanvasElement
  /** WebGL 渲染器参数 */
  params?: WebGLRendererParameters
  /** 是否启用阴影 */
  shadows?: boolean
  /** 像素比 */
  pixelRatio?: number
  /** 是否自动调整尺寸 */
  autoResize?: boolean
  /** 抗锯齿 */
  antialias?: boolean
}

/** 灯光类型 */
export type LightType =
  | 'ambient'
  | 'directional'
  | 'point'
  | 'spot'
  | 'hemisphere'

/** 灯光配置 */
export interface LightConfig {
  type: LightType
  /** 颜色 */
  color?: ColorRepresentation
  /** 强度 */
  intensity?: number
  /** 位置 */
  position?: Position3D
  /** 目标点（方向光 / 聚光灯使用） */
  target?: Position3D
  /** 半球光天光色 */
  skyColor?: ColorRepresentation
  /** 半球光地光色 */
  groundColor?: ColorRepresentation
  /** 距离衰减（点光 / 聚光灯） */
  distance?: number
  /** 聚光角度（度） */
  angle?: number
  /** 聚光衰减 */
  penumbra?: number
  /** 是否投射阴影 */
  castShadow?: boolean
}

/** 场景初始化选项 */
export interface SceneInitOptions {
  scene?: SceneConfig
  camera?: CameraConfig
  renderer?: RendererConfig
  lights?: LightConfig[]
}

/** 场景运行上下文，由初始化函数返回，供后续模块引用 */
export interface SceneContext {
  /** 场景实例 */
  scene: Scene
  /** 相机实例 */
  camera: Camera
  /** 画布元素 */
  canvas: HTMLCanvasElement
  /** 场景根对象 */
  root: Object3D
  /** 添加对象到场景 */
  add: (object: Object3D) => void
  /** 从场景移除对象 */
  remove: (object: Object3D) => void
  /** 每帧更新回调注册 */
  onUpdate: (callback: (delta: number, elapsed: number) => void) => () => void
  /** 销毁并释放资源 */
  dispose: () => void
}