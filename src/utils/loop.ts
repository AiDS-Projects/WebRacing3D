import type { Clock } from 'three';
import type { FrameState } from '@/types';

/**
 * requestAnimationFrame 游戏循环封装，统一管理启停与帧状态下发。
 */
export class AnimationLoop {
  private running = false;
  private rafId = 0;
  private readonly clock: Clock;
  private readonly onFrame: (frame: FrameState) => void;

  constructor(clock: Clock, onFrame: (frame: FrameState) => void) {
    this.clock = clock;
    this.onFrame = onFrame;
  }

  start(): void {
    if (this.running) return;
    this.running = true;

    const tick = () => {
      if (!this.running) return;
      const delta = this.clock.getDelta();
      const elapsed = this.clock.getElapsedTime();
      this.onFrame({ delta, elapsed });
      this.rafId = requestAnimationFrame(tick);
    };

    this.rafId = requestAnimationFrame(tick);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }
}
