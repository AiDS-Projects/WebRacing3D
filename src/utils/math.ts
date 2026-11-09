/**
 * 共享数学工具层
 * 为 Three.js 场景提供统一的数学常量与常用计算函数
 */
import * as THREE from "three";

/** 常用数学常量 */
export const DEG2RAD = Math.PI / 180;
export const RAD2DEG = 180 / Math.PI;
export const TWO_PI = Math.PI * 2;
export const HALF_PI = Math.PI / 2;
export const EPSILON = 1e-6;

/** 将数值钳制到 [min, max] 区间 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** 线性插值（不钳制 t） */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** 将 value 从 [inMin, inMax] 映射到 [outMin, outMax] */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  if (Math.abs(inMax - inMin) < EPSILON) return outMin;
  const t = (value - inMin) / (inMax - inMin);
  return lerp(outMin, outMax, t);
}

/** 归一化到 [0, 1] */
export function normalize(value: number, min: number, max: number): number {
  if (Math.abs(max - min) < EPSILON) return 0;
  return (value - min) / (max - min);
}

/** 平滑步进（smoothstep） */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp(normalize(x, edge0, edge1), 0, 1);
  return t * t * (3 - 2 * t);
}

/** 更平滑的步进（smootherstep） */
export function smootherstep(edge0: number, edge1: number, x: number): number {
  const t = clamp(normalize(x, edge0, edge1), 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/** 角度转弧度 */
export function degToRad(degrees: number): number {
  return degrees * DEG2RAD;
}

/** 弧度转角度 */
export function radToDeg(radians: number): number {
  return radians * RAD2DEG;
}

/** 将角度规范化到 [0, 360) */
export function normalizeDegrees(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

/** 将弧度规范化到 [0, 2π) */
export function normalizeRadians(radians: number): number {
  return ((radians % TWO_PI) + TWO_PI) % TWO_PI;
}

/** 生成 [min, max) 区间内的随机数 */
export function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** 生成 [min, max] 区间内的随机整数（含两端） */
export function randomInt(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min + 1));
}

/** 判断两个浮点数是否近似相等 */
export function nearlyEqual(a: number, b: number, epsilon = EPSILON): boolean {
  return Math.abs(a - b) < epsilon;
}

/** 将角度转为对应的 Three.js 欧拉角（默认绕 Y 轴旋转） */
export function degreesToEuler(
  degrees: number,
  axis: "x" | "y" | "z" = "y"
): THREE.Euler {
  const rad = degToRad(degrees);
  return new THREE.Euler(
    axis === "x" ? rad : 0,
    axis === "y" ? rad : 0,
    axis === "z" ? rad : 0
  );
}

/** 计算两点之间的距离 */
export function distance(
  a: THREE.Vector3,
  b: THREE.Vector3
): number {
  return a.distanceTo(b);
}

/** 计算两点之间距离的平方（避免开方，适合频繁比较） */
export function distanceSquared(
  a: THREE.Vector3,
  b: THREE.Vector3
): number {
  return a.distanceToSquared(b);
}

/** 计算向量在指定轴上的分量 */
export function axisComponent(
  v: THREE.Vector3,
  axis: "x" | "y" | "z"
): number {
  return v[axis];
}

/** 将笛卡尔坐标转换为球坐标（返回 radius, theta, phi） */
export function cartesianToSpherical(
  v: THREE.Vector3
): { radius: number; theta: number; phi: number } {
  const spherical = new THREE.Spherical().setFromVector3(v);
  return {
    radius: spherical.radius,
    theta: spherical.theta,
    phi: spherical.phi,
  };
}

/** 将球坐标转换为笛卡尔坐标 */
export function sphericalToCartesian(
  radius: number,
  theta: number,
  phi: number
): THREE.Vector3 {
  return new THREE.Vector3().setFromSpherical(
    new THREE.Spherical(radius, phi, theta)
  );
}

/** 判断点是否位于以 center 为中心、radius 为半径的球体内 */
export function isInsideSphere(
  point: THREE.Vector3,
  center: THREE.Vector3,
  radius: number
): boolean {
  return distanceSquared(point, center) <= radius * radius;
}

/** 计算两个向量之间的夹角（弧度） */
export function angleBetween(a: THREE.Vector3, b: THREE.Vector3): number {
  return a.angleTo(b);
}

/** 计算两个向量之间的夹角（角度） */
export function angleBetweenDegrees(
  a: THREE.Vector3,
  b: THREE.Vector3
): number {
  return radToDeg(a.angleTo(b));
}