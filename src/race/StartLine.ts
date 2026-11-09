import * as THREE from 'three';

/**
 * 单圈结算结果
 */
export interface LapResult {
  /** 圈号（从 1 开始） */
  lap: number;
  /** 本圈耗时（秒） */
  lapTime: number;
  /** 累计总耗时（秒） */
  totalTime: number;
  /** 历史最快单圈（秒） */
  bestLap: number;
  /** 本圈是否刷新了最快纪录 */
  isBest: boolean;
}

export interface StartLineOptions {
  /** 起终点线中心位置 */
  position: THREE.Vector3;
  /** 起终点线法线方向（车辆由此方向穿越视为完成一圈），需归一化 */
  normal: THREE.Vector3;
  /** 线宽（仅用于可视化网格） */
  width?: number;
  /** 最小单圈时间（秒），用于过滤误触发 */
  minLapTime?: number;
  /** 单圈完成回调，用于外部结算逻辑 */
  onLapComplete?: (result: LapResult) => void;
  /** 结算面板挂载容器，缺省为 document.body */
  settlementContainer?: HTMLElement;
}

export class StartLine {
  readonly position: THREE.Vector3;
  readonly normal: THREE.Vector3;
  readonly width: number;

  private readonly minLapTime: number;
  private readonly onLapComplete?: (result: LapResult) => void;
  private readonly settlementContainer: HTMLElement;

  /** 上一帧的有符号距离（相对法线） */
  private prevSigned = 0;
  private hasPrevSample = false;

  /** 比赛状态 */
  private raceStarted = false;
  private raceStartTime = 0;
  private lapStartTime = 0;
  private lapCount = 0;
  private bestLap = Infinity;
  private elapsed = 0;

  /** 可视化网格 */
  readonly mesh: THREE.Mesh;

  /** 结算面板 DOM */
  private panel: HTMLElement | null = null;

  constructor(options: StartLineOptions) {
    this.position = options.position.clone();
    this.normal = options.normal.clone().normalize();
    this.width = options.width ?? 12;
    this.minLapTime = options.minLapTime ?? 3;
    this.onLapComplete = options.onLapComplete;
    this.settlementContainer = options.settlementContainer ?? document.body;

    this.mesh = this.createMesh();
  }

  /** 生成起终点线可视化网格（供场景挂载） */
  private createMesh(): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(this.width, 0.4);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffd166,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(this.position);
    // 平面默认法线为 +Z，旋转使其与给定法线对齐
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), this.normal);
    return mesh;
  }

  /**
   * 每帧调用：根据车辆位置检测是否穿越起终点线。
   * @param carPosition 车辆世界坐标
   * @param deltaTime   上一帧到本帧的时间间隔（秒）
   */
  update(carPosition: THREE.Vector3, deltaTime: number): void {
    this.elapsed += deltaTime;

    const toCar = new THREE.Vector3().subVectors(carPosition, this.position);
    const signed = toCar.dot(this.normal);

    if (!this.hasPrevSample) {
      this.prevSigned = signed;
      this.hasPrevSample = true;
      return;
    }

    // 穿越检测：由法线负侧（起跑前）进入正侧
    if (this.prevSigned < 0 && signed >= 0) {
      const frac = this.prevSigned / (this.prevSigned - signed);
      const crossingTime = this.elapsed - deltaTime * (1 - frac);
      this.handleCrossing(crossingTime);
    }

    this.prevSigned = signed;
  }

  /** 处理一次有效穿越 */
  private handleCrossing(crossingTime: number): void {
    if (!this.raceStarted) {
      // 第一次穿越：发车，开始计时
      this.raceStarted = true;
      this.raceStartTime = crossingTime;
      this.lapStartTime = crossingTime;
      return;
    }

    const lapTime = crossingTime - this.lapStartTime;
    if (lapTime < this.minLapTime) {
      // 视为误触发（如倒车/抖动），不结算
      return;
    }

    this.lapCount += 1;
    this.lapStartTime = crossingTime;

    const totalTime = crossingTime - this.raceStartTime;
    const isBest = lapTime < this.bestLap;
    if (isBest) {
      this.bestLap = lapTime;
    }

    const result: LapResult = {
      lap: this.lapCount,
      lapTime,
      totalTime,
      bestLap: this.bestLap,
      isBest,
    };

    this.onLapComplete?.(result);
    this.showSettlement(result);
  }

  /** 结算展示：在容器中渲染/更新结算面板 */
  private showSettlement(result: LapResult): void {
    if (!this.panel) {
      this.panel = document.createElement('div');
      this.stylePanel(this.panel);
      this.settlementContainer.appendChild(this.panel);
    }

    const bestTag = result.isBest ? '<span class="best">NEW BEST</span>' : '';
    const lapTime = result.lapTime.toFixed(2);
    const totalTime = result.totalTime.toFixed(2);
    const bestLap = result.bestLap.toFixed(2);

    this.panel.innerHTML = `
      <div class="settlement-title">第 ${result.lap} 圈完成</div>
      <div class="settlement-row">本圈 <b>${lapTime}s</b></div>
      <div class="settlement-row">总耗时 <b>${totalTime}s</b></div>
      <div class="settlement-row">最快单圈 <b>${bestLap}s</b></div>
      ${bestTag}
    `;
    this.panel.classList.add('visible');

    // 短暂展示后淡出
    window.clearTimeout((this as unknown as { hideTimer?: number }).hideTimer);
    (this as unknown as { hideTimer?: number }).hideTimer = window.setTimeout(() => {
      this.panel?.classList.remove('visible');
    }, 2200);
  }

  private stylePanel(el: HTMLElement): void {
    el.style.cssText = `
      position: fixed;
      top: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(-12px);
      background: rgba(26, 26, 46, 0.92);
      color: #fff;
      border-radius: 12px;
      padding: 18px 28px;
      font-family: sans-serif;
      text-align: center;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.25s ease, transform 0.25s ease;
      z-index: 1000;
    `;
    el.classList.add('visible');
    // 初始隐藏，避免闪烁
    el.style.opacity = '0';

    const styleTag = document.createElement('style');
    styleTag.textContent = `
      .visible { opacity: 1 !important; transform: translateX(-50%) translateY(0) !important; }
      .settlement-title { font-size: 18px; font-weight: 700; margin-bottom: 10px; }
      .settlement-row { font-size: 14px; line-height: 1.7; color: #e0e0e0; }
      .settlement-row b { color: #ffd166; }
      .best { display: inline-block; margin-top: 8px; font-size: 12px; font-weight: 700;
              color: #1a1a2e; background: #ffd166; border-radius: 4px; padding: 2px 8px; }
    `;
    if (!document.head.querySelector('[data-startline-style]')) {
      styleTag.setAttribute('data-startline-style', '');
      document.head.appendChild(styleTag);
    }
  }

  /** 重置全部计时与圈数状态 */
  reset(): void {
    this.raceStarted = false;
    this.raceStartTime = 0;
    this.lapStartTime = 0;
    this.lapCount = 0;
    this.bestLap = Infinity;
    this.elapsed = 0;
    this.hasPrevSample = false;
    this.prevSigned = 0;
    this.panel?.classList.remove('visible');
  }

  /** 销毁结算面板与可视化资源 */
  dispose(): void {
    this.panel?.remove();
    this.panel = null;
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }

  // ---- 只读访问器 ----

  get isRaceStarted(): boolean {
    return this.raceStarted;
  }

  get currentLap(): number {
    return this.lapCount;
  }

  get totalElapsed(): number {
    return this.elapsed;
  }

  get currentLapTime(): number {
    return this.raceStarted ? this.elapsed - this.lapStartTime : 0;
  }

  get bestLapTime(): number {
    return Number.isFinite(this.bestLap) ? this.bestLap : 0;
  }
}