import type {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  Clock,
} from 'three';

/**
 * 应用上下文：在装配阶段（main.ts）注入，供各领域模块 init 时接收。
 */
export interface AppContext {
  renderer: WebGLRenderer;
  scene: Scene;
  camera: PerspectiveCamera;
  clock: Clock;
}

/**
 * 帧状态：游戏循环每帧下发。
 */
export interface FrameState {
  /** 距上一帧的秒数 */
  delta: number;
  /** 自启动以来的累计秒数 */
  elapsed: number;
}

/**
 * 生命周期契约：领域模块统一实现，保证可装配、可更新、可释放。
 */
export interface Lifecycle {
  init(context: AppContext): void;
  update(frame: FrameState): void;
  dispose(): void;
}

/** 二维尺寸 */
export interface Size {
  width: number;
  height: number;
}
