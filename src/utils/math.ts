/**
 * 共享数学工具层
 * 提供 Three.js 项目通用的数学辅助函数与常量。
 */

/** 角度转弧度 */
export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** 弧度转角度 */
export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

/** 将数值限制在 [min, max] 区间内 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** 在 [min, max] 区间内进行线性插值 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}

/** 将 value 从 [inMin, inMax] 映射到 [outMin, outMax] */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  if (inMin === inMax) return outMin;
  const t = (value - inMin) / (inMax - inMin);
  return lerp(outMin, outMax, t);
}

/** 生成 [min, max) 区间的随机数 */
export function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** 生成 [min, max] 区间的随机整数（含两端） */
export function randomInt(min: number, max: number): number {
  return Math.floor(randomRange(min, max + 1));
}

/** 平滑插值（smoothstep，三次 Hermite） */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/** 近似判断两个浮点数是否相等 */
export function nearlyEqual(a: number, b: number, epsilon = 1e-6): boolean {
  return Math.abs(a - b) < epsilon;
}

/** 对角度进行归一化，使其落在 [0, 2π) 区间 */
export function normalizeAngle(rad: number): number {
  const twoPi = Math.PI * 2;
  let result = rad % twoPi;
  if (result < 0) result += twoPi;
  return result;
}

/** 计算两点之间的欧几里得距离 */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/** 计算三点距离（3D 空间） */
export function distance3(
  x1: number,
  y1: number,
  z1: number,
  x2: number,
  y2: number,
  z2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dz = z2 - z1;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}