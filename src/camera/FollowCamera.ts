import * as THREE from 'three';

// ============================================================================
// 类型定义层
// ============================================================================

/** 第三人称跟随相机配置 */
export interface FollowCameraConfig {
  /** 相机相对目标的偏移（目标局部空间，会随目标旋转） */
  offset?: THREE.Vector3;
  /** 观察点相对目标的偏移（目标局部空间） */
  lookAtOffset?: THREE.Vector3;
  /** 位置平滑系数（指数衰减，越大越跟手，默认 6） */
  positionLerp?: number;
  /** 是否启用平滑跟随，false 则每帧硬性贴合，默认 true */
  smooth?: boolean;
}

// ============================================================================
// 共享工具层
// ============================================================================

const DEFAULT_CONFIG: Required<FollowCameraConfig> = {
  offset: new THREE.Vector3(0, 5.5, -10),
  lookAtOffset: new THREE.Vector3(0, 1.6, 0),
  positionLerp: 6,
  smooth: true,
};

// ============================================================================
// 第三人称跟随相机
// ============================================================================

/**
 * 第三人称跟随相机：围绕指定目标对象，在其后方（局部空间偏移）平滑跟随。
 * 可复用至赛车、角色等任意需要后视跟随的场景，通过 update(dt) 驱动。
 */
export class FollowCamera {
  /** 被控制的相机实例 */
  readonly camera: THREE.PerspectiveCamera;

  private target: THREE.Object3D | null = null;
  private readonly config: Required<FollowCameraConfig>;
  private readonly currentPosition = new THREE.Vector3();

  constructor(camera: THREE.PerspectiveCamera, config: FollowCameraConfig = {}) {
    this.camera = camera;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /** 设置跟随目标 */
  setTarget(target: THREE.Object3D | null): void {
    this.target = target;
    if (target) this.snap();
  }

  /** 设置相机相对目标的偏移（目标局部空间） */
  setOffset(offset: THREE.Vector3): void {
    this.config.offset.copy(offset);
  }

  /** 立即贴合目标，无平滑过渡 */
  snap(): void {
    if (!this.target) return;
    this.updatePosition(this.target, 1);
    this.updateLookAt(this.target);
  }

  /** 每帧更新相机位置与朝向 */
  update(dt: number): void {
    if (!this.target) return;

    const t = this.config.smooth ? 1 - Math.exp(-this.config.positionLerp * dt) : 1;
    this.updatePosition(this.target, t);
    this.updateLookAt(this.target);
  }

  private updatePosition(target: THREE.Object3D, t: number): void {
    const desired = this.config.offset.clone().applyQuaternion(target.quaternion);
    desired.add(target.position);

    if (t >= 1) {
      this.currentPosition.copy(desired);
    } else {
      this.currentPosition.lerp(desired, t);
    }

    this.camera.position.copy(this.currentPosition);
  }

  private updateLookAt(target: THREE.Object3D): void {
    const lookAt = this.config.lookAtOffset.clone().applyQuaternion(target.quaternion);
    lookAt.add(target.position);
    this.camera.lookAt(lookAt);
  }
}