/** 计时与圈数系统类型定义 */

/** 比赛阶段 */
export type RacePhase = 'idle' | 'countdown' | 'racing' | 'finished';

/** 起终点检测器配置 */
export interface StartFinishConfig {
  /** 检测线中心在世界坐标中的位置 */
  position: { x: number; y: number; z: number };
  /** 检测线法线方向（归一化向量） */
  normal: { x: number; y: number; z: number };
  /** 检测线半宽（用于判定车辆是否穿越） */
  halfWidth: number;
  /** 两次有效触发之间的最小间隔（毫秒），避免单次穿越重复触发 */
  debounceMs: number;
}

/** 单圈计时数据 */
export interface LapTiming {
  /** 圈序号，从 1 开始 */
  lapNumber: number;
  /** 本圈开始时间戳（毫秒） */
  startTime: number;
  /** 本圈结束时间戳（毫秒），未完成时为 null */
  endTime: number | null;
  /** 本圈用时（毫秒），未完成时为 -1 */
  duration: number;
  /** 与历史最佳圈的差值（毫秒），正数表示慢于最佳，负数表示快于最佳；无最佳圈时为 null */
  deltaToBest: number | null;
}

/** 起终点穿越检测状态（用于判断车辆是否跨过检测线） */
export interface DetectionState {
  /** 上一帧车辆相对检测线的侧向位置 */
  previousSide: 'front' | 'back' | null;
  /** 最近一次有效穿越的时间戳（毫秒） */
  lastCrossTime: number;
  /** 是否处于触发冷却期 */
  inCooldown: boolean;
}

/** 完整比赛状态 */
export interface RaceState {
  /** 当前比赛阶段 */
  phase: RacePhase;
  /** 当前圈数（从 1 开始，未起跑时为 0） */
  currentLap: number;
  /** 总圈数 */
  totalLaps: number;
  /** 比赛开始时间戳（毫秒），未开始为 null */
  raceStartTime: number | null;
  /** 各圈计时记录 */
  lapTimings: LapTiming[];
  /** 最佳圈记录 */
  bestLap: LapTiming | null;
  /** 当前单圈已用时间（实时，毫秒） */
  currentLapElapsed: number;
  /** 起终点检测状态 */
  detection: DetectionState;
  /** 是否已完成全部圈数 */
  isFinished: boolean;
}

/** 单圈结算展示数据（完成一圈后用于 HUD 结算弹窗） */
export interface LapSettlement {
  /** 刚完成的圈序号 */
  lapNumber: number;
  /** 本圈用时（毫秒） */
  lapTime: number;
  /** 与最佳圈差值（毫秒），无最佳圈时为 null */
  deltaToBest: number | null;
  /** 是否为本场最佳圈 */
  isBestLap: boolean;
  /** 当前名次（多人赛时有效，单人赛为 null） */
  position: number | null;
  /** 结算展示时长（毫秒），超时后自动收起 */
  displayDuration: number;
}

/** 比赛总结算（完成全部圈数后） */
export interface RaceResult {
  /** 总用时（毫秒） */
  totalTime: number;
  /** 最佳圈记录 */
  bestLap: LapTiming | null;
  /** 平均每圈用时（毫秒） */
  averageLapTime: number;
  /** 所有圈的计时记录 */
  lapTimings: LapTiming[];
  /** 实际完成圈数 */
  completedLaps: number;
}

/** 计时系统事件回调集合 */
export interface RaceEvents {
  /** 穿越起终点线时触发 */
  onLapCross?: (lapNumber: number, timestamp: number) => void;
  /** 完成一圈并生成结算数据时触发 */
  onLapComplete?: (settlement: LapSettlement) => void;
  /** 全部圈数完成时触发 */
  onRaceFinish?: (result: RaceResult) => void;
  /** 圈内计时实时刷新时触发 */
  onLapTick?: (elapsed: number) => void;
}