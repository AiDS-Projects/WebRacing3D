/**
 * src/utils/index.ts
 *
 * 共享工具层统一入口。
 * 集中导出数学、随机、DOM、时间、颜色等通用工具，
 * 供后续场景、渲染器、交互等模块统一引用。
 */

import * as THREE from 'three';

// ---------------------------------------------------------------------------
// 通用类型定义
// ---------------------------------------------------------------------------

/** 可空类型（可为 null 或 undefined） */
export type Maybe<T> = T | null | undefined;

/** 可为 null 的类型 */
export type Nullable<T> = T | null;

/** 可为 undefined 的类型 */
export type Optional<T> = T | undefined;

/** 二维尺寸 */
export interface Size {
  width: number;
  height: number;
}

/** 数值区间 */
export interface Range {
  min: number;
  max: number;
}

/** 通用事件回调 */
export type Listener<T = unknown> = (payload: T) => void;

/** 通用键值对象 */
export type Dict<T = unknown> = Record<string, T>;

// ---------------------------------------------------------------------------
// 数学工具
// ---------------------------------------------------------------------------

/** 将 value 限制在 [min, max] 区间内 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** 将 value 归一化到 [0, 1] */
export function normalize(value: number, min: number, max: number): number {
  if (min === max) return 0;
  return (value - min) / (max - min);
}

/** 在 [min, max] 区间内做线性插值 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}

/** 将 value 从 [inMin, inMax] 映射到 [outMin, outMax] */
export function remap(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  return lerp(outMin, outMax, normalize(value, inMin, inMax));
}

/** 角度转弧度 */
export function degToRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/** 弧度转角度 */
export function radToDeg(radians: number): number {
  return radians * (180 / Math.PI);
}

/** 保留指定小数位 */
export function roundTo(value: number, decimals = 0): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/** 判断两个浮点数是否近似相等 */
export function approximately(a: number, b: number, epsilon = 1e-6): boolean {
  return Math.abs(a - b) < epsilon;
}

/** 平滑阻尼插值（帧率无关） */
export function damp(
  current: number,
  target: number,
  lambda: number,
  deltaTime: number,
): number {
  return lerp(current, target, 1 - Math.exp(-lambda * deltaTime));
}

// ---------------------------------------------------------------------------
// 随机工具
// ---------------------------------------------------------------------------

/** 生成 [min, max) 区间内的随机浮点数 */
export function randomFloat(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** 生成 [min, max] 区间内的随机整数（含两端） */
export function randomInt(min: number, max: number): number {
  return Math.floor(randomFloat(min, max + 1));
}

/** 从数组中随机取一个元素 */
export function randomPick<T>(items: readonly T[]): T | undefined {
  if (items.length === 0) return undefined;
  return items[Math.floor(Math.random() * items.length)];
}

/** 随机打乱数组（返回新数组，不修改原数组） */
export function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** 生成 [0, 1) 的随机数（语法糖） */
export function random(): number {
  return Math.random();
}

// ---------------------------------------------------------------------------
// Three.js 辅助工具
// ---------------------------------------------------------------------------

/** 递归释放对象及其子对象的 GPU/内存资源 */
export function disposeObject(root: THREE.Object3D): void {
  root.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.geometry?.dispose();

      const material = object.material;
      if (Array.isArray(material)) {
        material.forEach(disposeMaterial);
      } else {
        disposeMaterial(material as THREE.Material);
      }
    }
  });
}

/** 释放单个材质及其关联纹理 */
export function disposeMaterial(material: THREE.Material): void {
  for (const key of Object.keys(material)) {
    const value = (material as unknown as Dict)[key];
    if (value && (value as THREE.Texture).isTexture) {
      (value as THREE.Texture).dispose();
    }
  }
  material.dispose();
}

/** 释放纹理 */
export function disposeTexture(texture: Maybe<THREE.Texture>): void {
  texture?.dispose();
}

/** 释放几何体 */
export function disposeGeometry(geometry: Maybe<THREE.BufferGeometry>): void {
  geometry?.dispose();
}

/** 从场景中移除对象并释放其资源 */
export function removeAndDispose(scene: THREE.Scene, object: THREE.Object3D): void {
  scene.remove(object);
  disposeObject(object);
}

/** 根据屏幕尺寸与相机创建正交/透视相机的 resize 处理 */
export function resizeRendererToDisplaySize(
  renderer: THREE.WebGLRenderer,
): boolean {
  const canvas = renderer.domElement;
  const pixelRatio = Math.min(window.devicePixelRatio, 2);
  const width = Math.floor(canvas.clientWidth * pixelRatio);
  const height = Math.floor(canvas.clientHeight * pixelRatio);

  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
  }
  return needResize;
}

/** 更新透视相机宽高比并更新投影矩阵 */
export function updateCameraAspect(camera: THREE.PerspectiveCamera): void {
  const canvas = camera.projectionMatrix;
  void canvas;
  const aspect = getAspectRatio();
  if (camera.aspect !== aspect) {
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
  }
}

/** 获取当前视口宽高比（兜底 16/9） */
export function getAspectRatio(): number {
  if (typeof window === 'undefined') return 16 / 9;
  const width = window.innerWidth;
  const height = window.innerHeight;
  return height === 0 ? 16 / 9 : width / height;
}

/** 生成十六进制颜色字符串（如 "#a1b2c3"） */
export function randomHexColor(): string {
  return `#${Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .padStart(6, '0')}`;
}

/** 将 THREE.Color 转为 CSS 十六进制字符串 */
export function colorToHex(color: THREE.Color): string {
  return `#${color.getHexString()}`;
}

/** 从十六进制字符串创建 THREE.Color */
export function hexToColor(hex: string): THREE.Color {
  return new THREE.Color(hex);
}

// ---------------------------------------------------------------------------
// DOM 工具
// ---------------------------------------------------------------------------

/** 通过 id 获取元素，找不到时抛出明确错误 */
export function getElementById<T extends HTMLElement = HTMLElement>(
  id: string,
): T {
  const el = document.getElementById(id) as T | null;
  if (!el) {
    throw new Error(`[utils] 找不到 id 为 "${id}" 的 DOM 元素`);
  }
  return el;
}

/** 创建带可选类名与属性的 DOM 元素 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  options?: { className?: string; id?: string; text?: string },
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (options?.className) el.className = options.className;
  if (options?.id) el.id = options.id;
  if (options?.text !== undefined) el.textContent = options.text;
  return el;
}

/** 是否为移动端（基于 UA 的粗略判断） */
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

/** 是否为高 DPI 屏幕 */
export function isHighDpi(): boolean {
  if (typeof window === 'undefined') return false;
  return window.devicePixelRatio > 1;
}

// ---------------------------------------------------------------------------
// 时间工具
// ---------------------------------------------------------------------------

/** 简单计时器：基于 performance.now 测量间隔 */
export class Timer {
  private startTime = 0;
  private pausedTime = 0;
  private lastDelta = 0;

  constructor() {
    this.start();
  }

  /** 开始 / 重置计时 */
  start(): void {
    this.startTime = Timer.now();
    this.pausedTime = 0;
    this.lastDelta = 0;
  }

  /** 获取自 start 以来的累计毫秒数 */
  get elapsed(): number {
    return Timer.now() - this.startTime - this.pausedTime;
  }

  /** 获取自上次调用以来的增量毫秒数 */
  get delta(): number {
    const now = this.elapsed;
    const delta = now - this.lastDelta;
    this.lastDelta = now;
    return delta;
  }

  private static now(): number {
    return typeof performance !== 'undefined'
      ? performance.now()
      : Date.now();
  }
}

// ---------------------------------------------------------------------------
// 日志工具
// ---------------------------------------------------------------------------

/** 统一的调试日志，仅当启用时输出 */
export const logger = {
  enabled: import.meta.env?.DEV ?? true,

  debug(...args: unknown[]): void {
    if (this.enabled) console.debug('[debug]', ...args);
  },

  info(...args: unknown[]): void {
    if (this.enabled) console.info('[info]', ...args);
  },

  warn(...args: unknown[]): void {
    console.warn('[warn]', ...args);
  },

  error(...args: unknown[]): void {
    console.error('[error]', ...args);
  },
};

// ---------------------------------------------------------------------------
// 事件订阅工具（轻量 EventEmitter）
// ---------------------------------------------------------------------------

/** 轻量事件发射器，避免依赖第三方库 */
export class EventEmitter<T extends Dict = Dict> {
  private listeners: {
    [K in keyof T]?: Set<Listener<T[K]>>;
  } = {};

  on<K extends keyof T>(event: K, listener: Listener<T[K]>): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = new Set();
    }
    (this.listeners[event] as Set<Listener<T[K]>>).add(listener);
    return () => this.off(event, listener);
  }

  off<K extends keyof T>(event: K, listener: Listener<T[K]>): void {
    this.listeners[event]?.delete(listener);
  }

  emit<K extends keyof T>(event: K, payload: T[K]): void {
    this.listeners[event]?.forEach((listener) => listener(payload));
  }

  clear<K extends keyof T>(event?: K): void {
    if (event !== undefined) {
      delete this.listeners[event];
    } else {
      this.listeners = {};
    }
  }
}