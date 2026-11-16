/** 数值钳制到 [min, max] 区间 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** 线性插值 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** 角度转弧度 */
export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
