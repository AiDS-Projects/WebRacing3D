/**
 * 输入系统类型定义
 * 覆盖键盘（W/S/A/D + 方向键）与触屏虚拟按键两类输入源，
 * 并定义合成后的车辆控制输入（供物理/移动模块消费）。
 */

/** 车辆控制动作 */
export type CarAction =
  | 'throttle' // 油门
  | 'brake' // 刹车
  | 'steerLeft' // 左转
  | 'steerRight' // 右转
  | 'handbrake' // 手刹
  | 'reset'; // 复位

/** 支持的键盘按键 */
export type KeyCode =
  | 'KeyW'
  | 'KeyA'
  | 'KeyS'
  | 'KeyD'
  | 'ArrowUp'
  | 'ArrowDown'
  | 'ArrowLeft'
  | 'ArrowRight'
  | 'Space'
  | 'KeyR';

/** 单个动作的输入状态（含边沿触发信息） */
export interface ActionState {
  /** 是否正在按下 */
  pressed: boolean;
  /** 本帧内是否刚按下（上升沿） */
  justPressed: boolean;
  /** 本帧内是否刚释放（下降沿） */
  justReleased: boolean;
}

/** 归一化后的车辆控制输入 */
export interface CarInput {
  /** 油门 0..1 */
  throttle: number;
  /** 刹车 0..1 */
  brake: number;
  /** 转向 -1（左）..1（右） */
  steer: number;
  /** 手刹是否按下 */
  handbrake: boolean;
  /** 复位是否按下 */
  reset: boolean;
}

/** 键盘输入状态快照 */
export interface KeyboardState {
  /** 当前按下的键集合 */
  keys: ReadonlySet<KeyCode>;
  /** 每个动作的状态 */
  actions: Record<CarAction, ActionState>;
}

/** 触屏虚拟按键 */
export interface VirtualButton {
  /** 唯一标识 */
  id: string;
  /** 关联的动作 */
  action: CarAction;
  /** 是否可长按（油门/转向为 true，手刹/复位为 false） */
  holdable: boolean;
  /** 是否正在被按下 */
  pressed: boolean;
}

/** 触屏输入状态快照 */
export interface TouchState {
  /** 所有虚拟按键 */
  buttons: VirtualButton[];
  /** 每个动作的状态 */
  actions: Record<CarAction, ActionState>;
}

/** 统一输入状态（合并键盘与触屏） */
export interface InputState {
  keyboard: KeyboardState;
  touch: TouchState;
  /** 合成后的车辆控制输入 */
  car: CarInput;
}

/** 归一化屏幕坐标（0..1，原点左上角） */
export interface NormalizedPoint {
  x: number;
  y: number;
}

/** 虚拟按键布局描述（圆心 + 半径，屏幕归一化坐标） */
export interface VirtualButtonLayout {
  /** 转向左 */
  left: { center: NormalizedPoint; radius: number };
  /** 转向右 */
  right: { center: NormalizedPoint; radius: number };
  /** 油门 */
  throttle: { center: NormalizedPoint; radius: number };
  /** 刹车 */
  brake: { center: NormalizedPoint; radius: number };
  /** 手刹 */
  handbrake: { center: NormalizedPoint; radius: number };
}

/** 输入系统配置 */
export interface InputConfig {
  /** 键盘动作到按键的映射（一个动作可绑定多个键） */
  keyBindings: Record<CarAction, KeyCode[]>;
  /** 触屏虚拟按键布局 */
  virtualButtons: VirtualButtonLayout;
}