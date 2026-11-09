export interface Vec2 {
  x: number;
  y: number;
}

/** 车辆物理配置 */
export interface VehiclePhysicsConfig {
  /** 前进最大速度（单位/秒） */
  maxSpeed: number;
  /** 倒车最大速度（单位/秒，正值表示倒车速度上限） */
  maxReverse: number;
  /** 加速率（单位/秒²） */
  acceleration: number;
  /** 制动力（单位/秒²），同时用于倒车加速 */
  brake: number;
  /** 无输入时的滚动摩擦减速率（单位/秒²） */
  friction: number;
  /** 最大转向角速度（弧度/秒） */
  turnRate: number;
  /** 转向输入平滑响应速度（1/秒） */
  steerSpeed: number;
  /** 基础抓地力（0~1），越高越不易打滑 */
  grip: number;
  /** 高速抓地力衰减比例（0~1），速度越大抓地力下降越多 */
  slipFactor: number;
  /** 赛道边界碰撞减速比例（0~1），1 表示撞墙立即停止 */
  collisionDeceleration: number;
}

/** 车辆运行时状态 */
export interface VehicleState {
  position: Vec2;
  /** 车头朝向（弧度） */
  heading: number;
  /** 实际速度方向（弧度），打滑时滞后于车头朝向 */
  velocityAngle: number;
  /** 有符号速度，正为前进、负为倒车 */
  speed: number;
  /** 当前转向量（-1~1，负为左、正为右） */
  steer: number;
}

/** 每帧输入 */
export interface VehicleInput {
  /** 油门 0~1 */
  throttle: number;
  /** 刹车/倒车 0~1 */
  brake: number;
  /** 转向 -1~1（负左正右） */
  steer: number;
}

/** 赛道碰撞采样结果 */
export interface TrackSample {
  /** 该位置是否位于赛道内 */
  onTrack: boolean;
  /** 边界法线（指向赛道内部），用于将车辆推回赛道，可选 */
  normal?: Vec2;
}

/** 注入赛道碰撞采样数据 */
export interface TrackCollisionSource {
  sample(x: number, y: number): TrackSample;
}

export const DEFAULT_VEHICLE_CONFIG: VehiclePhysicsConfig = {
  maxSpeed: 30,
  maxReverse: 10,
  acceleration: 18,
  brake: 30,
  friction: 12,
  turnRate: 2.6,
  steerSpeed: 6,
  grip: 0.85,
  slipFactor: 0.6,
  collisionDeceleration: 0.5,
};

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

function wrapAngle(a: number): number {
  const twoPi = Math.PI * 2;
  a = a % twoPi;
  if (a > Math.PI) a -= twoPi;
  if (a < -Math.PI) a += twoPi;
  return a;
}

/** 速度方向追赶车头方向的基准速率（1/秒），乘以抓地力后使用 */
const BASE_GRIP_RATE = 8;

/**
 * 自研轻量弧线车辆物理。
 * 主循环：加减速 → 转向 → 速度相关抓地力打滑 → 位置积分 → 赛道边界碰撞减速。
 */
export class VehiclePhysics {
  readonly config: VehiclePhysicsConfig;

  private state: VehicleState;
  private collision: TrackCollisionSource | null = null;

  constructor(
    config: Partial<VehiclePhysicsConfig> = {},
    collision?: TrackCollisionSource,
  ) {
    this.config = { ...DEFAULT_VEHICLE_CONFIG, ...config };
    this.collision = collision ?? null;
    this.state = {
      position: { x: 0, y: 0 },
      heading: 0,
      velocityAngle: 0,
      speed: 0,
      steer: 0,
    };
  }

  get state(): VehicleState {
    return this.state;
  }

  setCollisionSource(source: TrackCollisionSource | null): void {
    this.collision = source;
  }

  reset(position?: Partial<Vec2>, heading = 0): void {
    this.state = {
      position: { x: position?.x ?? 0, y: position?.y ?? 0 },
      heading,
      velocityAngle: heading,
      speed: 0,
      steer: 0,
    };
  }

  update(dt: number, input: VehicleInput): VehicleState {
    const cfg = this.config;
    const s = this.state;
    dt = clamp(dt, 0, 0.1);

    // 1. 转向平滑
    const steerTarget = clamp(input.steer, -1, 1);
    const steerStep = cfg.steerSpeed * dt;
    s.steer += clamp(steerTarget - s.steer, -steerStep, steerStep);

    // 2. 加减速
    if (input.throttle > 0) {
      s.speed += cfg.acceleration * clamp(input.throttle, 0, 1) * dt;
    }
    if (input.brake > 0) {
      s.speed -= cfg.brake * clamp(input.brake, 0, 1) * dt;
    }

    // 无输入时滚动摩擦减速
    if (input.throttle <= 0 && input.brake <= 0) {
      const f = cfg.friction * dt;
      if (s.speed > 0) s.speed = Math.max(0, s.speed - f);
      else if (s.speed < 0) s.speed = Math.min(0, s.speed + f);
    }

    s.speed = clamp(s.speed, -cfg.maxReverse, cfg.maxSpeed);

    // 3. 转向：倒车时转向方向反转
    const direction = s.speed >= 0 ? 1 : -1;
    s.heading = wrapAngle(s.heading + cfg.turnRate * s.steer * direction * dt);

    // 4. 速度相关抓地力：高速时抓地力衰减，速度方向滞后于车头方向 → 打滑
    const speedRatio = Math.abs(s.speed) / cfg.maxSpeed;
    const gripRate =
      BASE_GRIP_RATE * cfg.grip * clamp(1 - cfg.slipFactor * speedRatio, 0, 1);
    const diff = wrapAngle(s.velocityAngle - s.heading);
    s.velocityAngle = wrapAngle(
      s.velocityAngle - clamp(diff, -gripRate * dt, gripRate * dt),
    );

    // 5. 位置积分
    s.position.x += Math.cos(s.velocityAngle) * s.speed * dt;
    s.position.y += Math.sin(s.velocityAngle) * s.speed * dt;

    // 6. 赛道边界碰撞减速
    if (this.collision) {
      const sample = this.collision.sample(s.position.x, s.position.y);
      if (!sample.onTrack) {
        s.speed *= 1 - clamp(cfg.collisionDeceleration, 0, 1);
        if (sample.normal) {
          const push = 0.05 + Math.abs(s.speed) * dt;
          s.position.x += sample.normal.x * push;
          s.position.y += sample.normal.y * push;
        }
      }
    }

    return s;
  }
}