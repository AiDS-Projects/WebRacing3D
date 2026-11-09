/**
 * 共享输入类型层
 * 将车辆输入从「离散按键状态」抽象为「归一化连续输入」，
 * 供输入绑定层、物理模块与后续 AI 控制器统一复用。
 */

/**
 * 车辆原始输入状态：由键盘与触屏虚拟按键共同写入。
 * 表示各方向按键是否被按下（离散布尔量）。
 */
export interface CarInput {
  /** 前进（W / ↑） */
  forward: boolean
  /** 后退（S / ↓） */
  backward: boolean
  /** 左转（A / ←） */
  left: boolean
  /** 右转（D / →） */
  right: boolean
}

/**
 * 归一化车辆输入：由原始输入经绑定层换算得到的连续取值。
 * 所有字段取值均落在 [-1, 1] 区间内，便于物理与 AI 直接消费。
 */
export interface NormalizedInput {
  /** 油门 [0, 1]：0 无油门，1 满油门 */
  throttle: number
  /** 刹车 [0, 1]：0 无刹车，1 满刹车 */
  brake: number
  /** 转向 [-1, 1]：-1 左满舵，+1 右满舵，0 直行 */
  steer: number
}

/**
 * 将离散按键输入换算为归一化连续输入。
 * 供输入绑定层统一调用，使物理与 AI 只依赖 NormalizedInput。
 */
export function toNormalizedInput(input: CarInput): NormalizedInput {
  return {
    throttle: input.forward ? 1 : 0,
    brake: input.backward ? 1 : 0,
    steer: (input.right ? 1 : 0) - (input.left ? 1 : 0),
  }
}