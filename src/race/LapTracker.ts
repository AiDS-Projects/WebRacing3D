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
export interface RaceSummary {
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
export interface LapTrackerConfig {
  /** 赛道运行时数据（提供中心线与采样函数） */
  track: TrackData
  /** 比赛计划总圈数 */
  totalLaps: number
  /** 每完成一圈时的回调 */
  onLapComplete?: (result: LapResult) => void
  /** 完成全部圈数、比赛结束时的回调 */
  onRaceFinish?: (summary: RaceSummary) => void
  /** HUD 挂载容器，默认 document.body */
  container?: HTMLElement
  /** 是否创建 HUD，默认 true */
  showHud?: boolean
}

// ============================================================================
// 共享工具层
// ============================================================================

/** 将秒数格式化为 M:SS.mmm */
function formatTime(seconds: number): string {
  const clamped = Math.max(0, seconds)
  const minutes = Math.floor(clamped / 60)
  const secs = Math.floor(clamped % 60)
  const millis = Math.floor((clamped % 1) * 1000)
  return `${minutes}:${String(secs).padStart(2, '0')}.${String(millis).padStart(3, '0')}`
}

// ============================================================================
// 计时与圈数系统
// ============================================================================

/**
 * 计时与圈数系统（LapTracker）
 *
 * 职责：
 * 1. 起终点检测 —— 通过赛道中心线采样，累计车辆沿赛道前进的弧长，
 *    当累计弧长跨过赛道总长度（即正向穿过起跑线）时判定完成一圈；
 * 2. 单圈计时 —— 记录当前圈用时、上圈用时与最快单圈；
 * 3. 结算展示 —— 维护 HUD 面板（圈数 / 当前圈 / 上圈 / 最佳），
 *    并在每圈完成与整场结束时弹出结算横幅。
 *
 * 通过 update(dt, position) 每帧驱动，position 取车辆世界坐标。
 */
export class LapTracker {
  /** HUD 根节点（可自行挂载或由本类挂载到 container） */
  readonly hud: HTMLDivElement

  private readonly track: TrackData
  private readonly totalLaps: number
  private readonly onLapComplete?: (result: LapResult) => void
  private readonly onRaceFinish?: (summary: RaceSummary) => void

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

  // HUD 文本节点
  private readonly lapEl: HTMLSpanElement
  private readonly currentEl: HTMLSpanElement
  private readonly lastEl: HTMLSpanElement
  private readonly bestEl: HTMLSpanElement
  private readonly bannerEl: HTMLDivElement
  private readonly bannerTitleEl: HTMLDivElement
  private readonly bannerTimeEl: HTMLDivElement
  private bannerTimer = 0

  constructor(config: LapTrackerConfig) {
    this.track = config.track
    this.totalLaps = Math.max(1, Math.floor(config.totalLaps))
    this.onLapComplete = config.onLapComplete
    this.onRaceFinish = config.onRaceFinish

    const refs = this.buildHud(config.showHud !== false)

    this.hud = refs.root
    this.lapEl = refs.lap
    this.currentEl = refs.current
    this.lastEl = refs.last
    this.bestEl = refs.best
    this.bannerEl = refs.banner
    this.bannerTitleEl = refs.bannerTitle
    this.bannerTimeEl = refs.bannerTime

    if (config.showHud !== false) {
      const container = config.container ?? document.body
      container.appendChild(this.hud)
    }

    this.updateHud()
  }

  /** 每帧更新：传入时间增量与车辆世界坐标，返回本帧圈数检测结果 */
  update(dt: number, position: TrackPoint3D): LapResult {
    if (this.finished) return this.idleResult()

    this.elapsed += dt

    const sample = this.track.sample(position)
    const distance = sample.distance

    // 首帧：以当前位置作为基准，开启当前圈计时
    if (this.previousDistance === null) {
      this.previousDistance = distance
      this.accumulatedDistance = distance
      this.lapStartTime = this.elapsed
      this.updateHud()
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
      this.records.push({ lap: this.lap, time: lapTime, total: this.elapsed })

      this.showLapBanner(lapTime)

      const result: LapResult = { completed: true, lap: this.lap, lapTime }
      this.onLapComplete?.(result)

      if (this.lap >= this.totalLaps) this.finishRace()

      this.updateHud()
      return result
    }

    this.updateHud()
    return this.idleResult()
  }

  /** 获取车辆当前圈数进度（供其他模块如小地图使用） */
  getProgress(): TrackProgress {
    const total = this.track.totalLength
    const within = ((this.accumulatedDistance % total) + total) % total
    const progress = within / total

    // 最近已通过的检查点索引
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
    this.hideBanner()
    this.updateHud()
  }

  /** 释放 HUD 与定时器 */
  dispose(): void {
    window.clearTimeout(this.bannerTimer)
    this.hud.remove()
  }

  // ------------------------------------------------------------------
  // 结算
  // ------------------------------------------------------------------
  private finishRace(): void {
    this.finished = true
    const summary: RaceSummary = {
      totalLaps: this.lap,
      totalTime: this.elapsed,
      bestLap: this.bestLap === Infinity ? 0 : this.bestLap,
      laps: [...this.records],
    }
    this.showFinishBanner(summary)
    this.onRaceFinish?.(summary)
  }

  private idleResult(): LapResult {
    return { completed: false, lap: this.lap, lapTime: this.elapsed - this.lapStartTime }
  }

  // ------------------------------------------------------------------
  // HUD 构建与刷新
  // ------------------------------------------------------------------
  private buildHud(enabled: boolean) {
    const root = document.createElement('div')
    Object.assign(root.style, {
      position: 'fixed',
      top: '16px',
      left: '16px',
      zIndex: '1000',
      padding: '14px 18px',
      borderRadius: '10px',
      background: 'rgba(0,0,0,0.45)',
      color: '#ffffff',
      fontFamily: 'monospace',
      fontSize: '15px',
      lineHeight: '1.7',
      pointerEvents: 'none',
      userSelect: 'none',
      display: enabled ? 'block' : 'none',
    } as CSSStyleDeclaration)

    const lap = this.addRow(root, '圈数', '1/1')
    const current = this.addRow(root, '当前', '0:00.000')
    const last = this.addRow(root, '上圈', '--')
    const best = this.addRow(root, '最佳', '--')

    // 结算横幅
    const banner = document.createElement('div')
    Object.assign(banner.style, {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: '1100',
      padding: '18px 34px',
      borderRadius: '12px',
      background: 'rgba(0,0,0,0.72)',
      color: '#ffffff',
      fontFamily: 'sans-serif',
      textAlign: 'center',
      pointerEvents: 'none',
      userSelect: 'none',
      opacity: '0',
      transition: 'opacity 0.25s ease',
    } as CSSStyleDeclaration)

    const bannerTitle = document.createElement('div')
    bannerTitle.style.fontSize = '18px'
    bannerTitle.style.marginBottom = '6px'
    const bannerTime = document.createElement('div')
    bannerTime.style.fontSize = '30px'
    bannerTime.style.fontWeight = 'bold'
    bannerTime.style.fontFamily = 'monospace'
    banner.appendChild(bannerTitle)
    banner.appendChild(bannerTime)
    document.body.appendChild(banner)

    return { root, lap, current, last, best, banner, bannerTitle, bannerTime }
  }

  private addRow(parent: HTMLElement, label: string, value: string): HTMLSpanElement {
    const row = document.createElement('div')
    const key = document.createElement('span')
    key.textContent = `${label} `
    key.style.opacity = '0.65'
    const val = document.createElement('span')
    val.textContent = value
    row.appendChild(key)
    row.appendChild(val)
    parent.appendChild(row)
    return val
  }

  private updateHud(): void {
    this.lapEl.textContent = `${Math.min(this.lap + 1, this.totalLaps)}/${this.totalLaps}`
    this.currentEl.textContent = formatTime(this.elapsed - this.lapStartTime)
    this.lastEl.textContent = this.lastLapTime > 0 ? formatTime(this.lastLapTime) : '--'
    this.bestEl.textContent = this.bestLap !== Infinity ? formatTime(this.bestLap) : '--'
  }

  private showLapBanner(lapTime: number): void {
    this.bannerTitleEl.textContent = `第 ${this.lap} 圈完成`
    this.bannerTimeEl.textContent = formatTime(lapTime)
    this.flashBanner()
  }

  private showFinishBanner(summary: RaceSummary): void {
    this.bannerTitleEl.textContent = '比赛结束'
    this.bannerTimeEl.textContent = `${formatTime(summary.totalTime)}（最佳 ${formatTime(summary.bestLap)}）`
    this.bannerTimeEl.style.fontSize = '22px'
    this.flashBanner()
  }

  private flashBanner(): void {
    this.bannerEl.style.opacity = '1'
    window.clearTimeout(this.bannerTimer)
    this.bannerTimer = window.setTimeout(() => this.hideBanner(), 2600)
  }

  private hideBanner(): void {
    this.bannerEl.style.opacity = '0'
  }
}