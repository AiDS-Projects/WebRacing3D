/**
 * scene.ts — 场景相关类型定义
 * 用于描述 Three.js 场景配置、相机、渲染器、光照与场景图结构，
 * 为场景模块提供统一的数据契约。
 */

import type * as THREE from 'three'

/** 坐标系约定：Three.js 默认使用右手系，Y 轴向上 */
export type Axis = 'x' | 'y' | 'z'

/** 三维向量 */
export interface Vec3 {
  x: number
  y: number
  z: number
}

/** 欧拉角（弧度） */
export interface Euler3 {
  x: number
  y: number
  z: number
}

/** 基础变换组件 */
export interface Transform {
  position?: Vec3
  rotation?: Euler3
  scale?: Vec3
}

/** 相机类型 */
export type CameraType = 'perspective' | 'orthographic'

/** 透视相机配置 */
export interface PerspectiveCameraConfig {
  type: 'perspective'
  fov?: number
  near?: number
  far?: number
}

/** 正交相机配置 */
export interface OrthographicCameraConfig {
  type: 'orthographic'
  left?: number
  right?: number
  top?: number
  bottom?: number
  near?: number
  far?: number
}

/** 相机配置联合类型 */
export type CameraConfig = (PerspectiveCameraConfig | OrthographicCameraConfig) &
  Transform

/** 渲染器配置 */
export interface RendererConfig {
  /** 抗锯齿 */
  antialias?: boolean
  /** 像素比，默认取设备像素比 */
  pixelRatio?: number
  /** 是否启用阴影 */
  shadowMap?: boolean
  /** 输出色彩空间 */
  outputColorSpace?: THREE.ColorSpace
  /** 色调映射 */
  toneMapping?: THREE.ToneMapping
  /** 背景色（十六进制） */
  clearColor?: number
  /** 背景透明度 */
  clearAlpha?: number
}

/** 光照类型 */
export type LightType = 'ambient' | 'directional' | 'point' | 'spot' | 'hemisphere'

/** 基础光照配置 */
export interface LightBase extends Transform {
  name?: string
  color?: number
  intensity?: number
  visible?: boolean
}

/** 环境光 */
export interface AmbientLightConfig extends LightBase {
  type: 'ambient'
}

/** 平行光 */
export interface DirectionalLightConfig extends LightBase {
  type: 'directional'
  castShadow?: boolean
  /** 阴影贴图分辨率 */
  shadowMapSize?: number
  /** 阴影相机范围 */
  shadow?: {
    left?: number
    right?: number
    top?: number
    bottom?: number
    near?: number
    far?: number
  }
}

/** 点光源 */
export interface PointLightConfig extends LightBase {
  type: 'point'
  distance?: number
  decay?: number
}

/** 聚光灯 */
export interface SpotLightConfig extends LightBase {
  type: 'spot'
  angle?: number
  penumbra?: number
  distance?: number
  decay?: number
  castShadow?: boolean
}

/** 半球光 */
export interface HemisphereLightConfig extends LightBase {
  type: 'hemisphere'
  groundColor?: number
}

/** 光照配置联合类型 */
export type LightConfig =
  | AmbientLightConfig
  | DirectionalLightConfig
  | PointLightConfig
  | SpotLightConfig
  | HemisphereLightConfig

/** 场景对象基础属性 */
export interface SceneObjectBase extends Transform {
  /** 唯一标识 */
  id: string
  /** 显示名称 */
  name?: string
  /** 是否可见 */
  visible?: boolean
  /** 子节点 */
  children?: SceneObject[]
}

/** 网格对象 */
export interface MeshObject extends SceneObjectBase {
  kind: 'mesh'
  /** 几何体类型标识 */
  geometry: string
  /** 材质类型标识 */
  material: string
  /** 是否投影阴影 */
  castShadow?: boolean
  /** 是否接收阴影 */
  receiveShadow?: boolean
}

/** 分组对象 */
export interface GroupObject extends SceneObjectBase {
  kind: 'group'
}

/** 空对象（锚点/挂点） */
export interface EmptyObject extends SceneObjectBase {
  kind: 'empty'
}

/** 场景对象联合类型 */
export type SceneObject = MeshObject | GroupObject | EmptyObject

/** 场景配置 */
export interface SceneConfig {
  /** 场景名称 */
  name?: string
  /** 背景 */
  background?: number | THREE.Texture | null
  /** 环境贴图 */
  environment?: THREE.Texture | null
  /** 雾效 */
  fog?: {
    type: 'linear' | 'exponential'
    color?: number
    near?: number
    far?: number
    density?: number
  } | null
  /** 相机 */
  camera?: CameraConfig
  /** 渲染器 */
  renderer?: RendererConfig
  /** 光照列表 */
  lights?: LightConfig[]
  /** 场景图根节点 */
  objects?: SceneObject[]
}

/** 场景生命周期状态 */
export type SceneState =
  | 'idle'
  | 'initializing'
  | 'ready'
  | 'running'
  | 'paused'
  | 'disposed'

/** 场景生命周期回调 */
export interface SceneLifecycle {
  /** 初始化完成后 */
  onReady?: (scene: THREE.Scene) => void
  /** 每帧更新 */
  onUpdate?: (delta: number, elapsed: number) => void
  /** 渲染前 */
  onBeforeRender?: (renderer: THREE.WebGLRenderer, scene: THREE.Scene) => void
  /** 销毁前 */
  onDispose?: () => void
}

/** 场景管理器接口 */
export interface ISceneManager {
  /** 当前场景实例 */
  readonly scene: THREE.Scene
  /** 当前相机 */
  readonly camera: THREE.Camera
  /** 渲染器 */
  readonly renderer: THREE.WebGLRenderer
  /** 场景状态 */
  readonly state: SceneState
  /** 初始化场景 */
  init(config?: SceneConfig): void
  /** 启动渲染循环 */
  start(): void
  /** 暂停渲染循环 */
  pause(): void
  /** 恢复渲染循环 */
  resume(): void
  /** 调整尺寸 */
  resize(width: number, height: number): void
  /** 释放资源 */
  dispose(): void
}

/** 动画循环时钟 */
export interface SceneClock {
  /** 上一帧与当前帧时间差（秒） */
  delta: number
  /** 自启动以来累计时间（秒） */
  elapsed: number
}