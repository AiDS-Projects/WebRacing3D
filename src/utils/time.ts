import type {
  LapResult,
  TrackData,
  TrackPoint3D,
  TrackProgress,
} from '../types/track'

// ============================================================================
// 类型定义层
// ============================================================================

/** 单圈成绩记录 */
export interface LapRecord {
  /** 圈序号（1 起） */
  lap: number
  /** 本圈耗时（秒） */
  time: number
  /** 完成本圈时的累计用时（秒） */
  total: number
}

/** 整场比赛结算汇总 */
export interface LapSummary {
  /** 计划总圈数 */
  totalLaps: number
  /** 全程总耗时（秒） */
  totalTime: number
  /** 最快单圈耗时（秒） */
  bestLap: number
  /** 各圈成绩明细 */
  laps: LapRecord[]
}

/** 计时与圈数系统配置 */
export interface LapTimerConfig {
  /** 赛道运行时数据（提供中心线采样与总长度） */
  track: TrackData
  /** 比赛计划总圈数 */
  totalLaps: number
  /** 每完成一圈时的回调 */
  onLapComplete?: (record: LapRecord) => void
  /** 完成全部圈数、比赛结束时的回调 */
  onRaceFinish?: (summary: LapSummary) => void
}

// ============================================================================
// 共享工具层
// ============================================================================

/** 将秒数格式化为 M:SS.mmm */
export function formatTime(seconds: number): string {
  const clamped = Math.max(0, seconds)
  const minutes = Math.floor(clamped / 60)
  const secs = Math.floor(clamped % 60)
  const millis = Math.floor((clamped % 1) * 1000)
  return `${minutes}:${String(secs).padStart(2, '0')}.${String(millis).padStart(3, '0')}`
}

/** 将结算汇总格式化为单行文本，供 HUD 结算展示使用 */
export function formatSummary(summary: LapSummary): string {
  const laps = `${summary.totalLaps} 圈`
  const total = formatTime(summary.totalTime)
  const best = summary.bestLap > 0 ? formatTime(summary.bestLap) : '--'
  return `总用时 ${total} · 最快单圈 ${best} · 共 ${laps}`
}

/** 将单圈成绩格式化为一行文本，供结算明细展示使用 */
export function formatLapRecord(record: LapRecord): string {
  return `第 ${record.lap} 圈  ${formatTime(record.time)}`
}

// ============================================================================
// 计时与圈数系统
// ============================================================================

/**
 * 计时与圈数系统（LapTimer）
 *
 * 职责：
 * 1. 起终点检测 —— 通过赛道中心线采样，累计车辆沿赛道前进的弧长，
 *    当累计弧长正向跨过赛道总长度（即穿过起跑线）时判定完成一圈；
 * 2. 单圈计时 —— 记录当前圈用时、上圈用时与最快单圈；
 * 3. 结算展示 —— 维护各圈成绩明细，并在每圈完成与整场结束时
 *    通过回调分发成绩与结算数据，供上层 HUD 渲染展示。
 *
 * 通过 update(dt, position) 每帧驱动，position 取车辆世界坐标。
 * 本类为纯逻辑层，不直接操作 DOM，展示由 onLapComplete / onRaceFinish 回调承载。
 */
export class LapTimer {
  private readonly track: TrackData
  private readonly totalLaps: number
  private readonly onLapComplete?: (record: LapRecord) => void
  private readonly onRaceFinish?: (summary: LapSummary) => void

  // 计时状态
  private elapsed = 0
  private lap = 0 // 已完成圈数
  private lapStartTime = 0 // 当前圈起始时刻（累计秒）
  private lastLapTime = 0
  private bestLap = Infinity
  private finished = false

  // 里程检测状态
  private previousDistance: number | null = null
  private accumulatedDistance = 0 // 跨圈累计弧长
  private lastDelta = 0 // 最近一帧弧长增量（用于判定方向）

  private readonly records: LapRecord[] = []

  constructor(config: LapTimerConfig) {
    this.track = config.track
    this.totalLaps = Math.max(1, Math.floor(config.totalLaps))
    this.onLapComplete = config.onLapComplete
    this.onRaceFinish = config.onRaceFinish
  }

  /** 每帧更新：传入时间增量与车辆世界坐标，返回本帧圈数检测结果 */
  update(dt: number, position: TrackPoint3D): LapResult {
    if (this.finished) return this.idleResult()

    this.elapsed += dt

    const distance = this.track.sample(position).distance

    // 首帧：以当前位置作为基准，开启当前圈计时
    if (this.previousDistance === null) {
      this.previousDistance = distance
      this.accumulatedDistance = distance
      this.lapStartTime = this.elapsed
      return this.idleResult()
    }

    // 处理中心线弧长在起跑线处的环绕跳变
    const total = this.track.totalLength
    const half = total / 2
    let delta = distance - this.previousDistance
    if (delta > half) delta -= total
    else if (delta < -half) delta += total

    this.lastDelta = delta
    this.accumulatedDistance += delta
    this.previousDistance = distance

    const completedLaps = Math.floor(this.accumulatedDistance / total)
    if (completedLaps > this.lap) {
      // 正向跨过起终点：完成一圈
      this.lap = completedLaps
      const lapTime = this.elapsed - this.lapStartTime
      this.lapStartTime = this.elapsed
      this.lastLapTime = lapTime
      if (lapTime < this.bestLap) this.bestLap = lapTime

      const record: LapRecord = { lap: this.lap, time: lapTime, total: this.elapsed }
      this.records.push(record)
      this.onLapComplete?.(record)

      if (this.lap >= this.totalLaps) this.finishRace()

      return { completed: true, lap: this.lap, lapTime }
    }

    return this.idleResult()
  }

  /** 获取车辆当前圈数进度（供小地图等其他模块使用） */
  getProgress(): TrackProgress {
    const total = this.track.totalLength
    const within = ((this.accumulatedDistance % total) + total) % total
    const progress = within / total

    let checkpointIndex = 0
    for (let i = 0; i < this.track.checkpoints.length; i++) {
      if (this.track.checkpoints[i].distance <= within) checkpointIndex = i
      else break
    }

    return {
      distance: this.accumulatedDistance,
      lap: this.lap,
      progress,
      checkpointIndex,
      direction: this.lastDelta > 0 ? 1 : this.lastDelta < 0 ? -1 : 0,
    }
  }

  /** 获取当前结算汇总（无论是否完赛） */
  getSummary(): LapSummary {
    return {
      totalLaps: this.lap,
      totalTime: this.elapsed,
      bestLap: this.bestLap === Infinity ? 0 : this.bestLap,
      laps: [...this.records],
    }
  }

  /** 重置计时与圈数状态，重新开始 */
  reset(): void {
    this.elapsed = 0
    this.lap = 0
    this.lapStartTime = 0
    this.lastLapTime = 0
    this.bestLap = Infinity
    this.finished = false
    this.previousDistance = null
    this.accumulatedDistance = 0
    this.lastDelta = 0
    this.records.length = 0
  }

  // ------------------------------------------------------------------
  // 结算
  // ------------------------------------------------------------------
  private finishRace(): void {
    this.finished = true
    this.onRaceFinish?.(this.getSummary())
  }

  private idleResult(): LapResult {
    return { completed: false, lap: this.lap, lapTime: this.elapsed - this.lapStartTime }
  }
}