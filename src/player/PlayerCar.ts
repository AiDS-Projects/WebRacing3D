import * as THREE from 'three';

/** 车辆输入状态：由键盘与触屏虚拟按键共同写入 */
export interface CarInput {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
}

/** 玩家赛车：程序化车身模型 + 第三人称跟随相机 + 键鼠/触屏输入 */
export class PlayerCar {
  /** 车身根节点（挂到场景） */
  readonly group: THREE.Group;
  /** 当前输入状态，可直接由外部（如 AI）读写 */
  readonly input: CarInput = {
    forward: false,
    backward: false,
    left: false,
    right: false,
  };

  // 运动状态
  private readonly position = new THREE.Vector3();
  private speed = 0;
  private heading = 0;
  private steer = 0;
  /** 是否处于竞速运行状态（开始后为 true，重置后为 false） */
  private running = false;

  // 车轮（前轮负责转向、全部车轮负责滚动）
  private readonly frontPivots: THREE.Object3D[] = [];
  private readonly allWheels: THREE.Object3D[] = [];

  // 相机
  private readonly camera: THREE.PerspectiveCamera;
  private readonly cameraOffset = new THREE.Vector3(0, 5.5, -10);
  private readonly cameraLook = new THREE.Vector3(0, 1.6, 0);
  private readonly currentCamPos = new THREE.Vector3();

  // 调参
  private readonly maxSpeed = 30;
  private readonly maxReverse = -10;
  private readonly acceleration = 24;
  private readonly brake = 34;
  private readonly friction = 14;
  private readonly turnRate = 2.4;
  private readonly steerLerp = 8;
  private readonly camLerp = 6;

  private touchRoot: HTMLDivElement | null = null;
  private readonly disposers: Array<() => void> = [];

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.group = new THREE.Group();
    this.buildCar();
    scene.add(this.group);

    this.currentCamPos.copy(this.cameraOffset);
    this.camera.position.copy(this.currentCamPos);
    this.camera.lookAt(this.cameraLook);

    this.bindKeyboard();
    this.bindTouch();
  }

  /** 每帧更新：物理、车轮动画与相机跟随 */
  update(dt: number): void {
    if (this.running) {
      this.applyPhysics(dt);
      this.animateWheels(dt);
    }

    this.group.position.copy(this.position);
    this.group.rotation.y = this.heading;

    this.followCamera(dt);
  }

  /** 开始竞速：进入运行状态，速度与转向归零（保持当前位置与朝向） */
  start(): void {
    this.speed = 0;
    this.steer = 0;
    this.running = true;
  }

  /** 停止竞速：冻结物理（供暂停或结束使用） */
  stop(): void {
    this.running = false;
  }

  /** 是否处于竞速运行状态 */
  isRunning(): boolean {
    return this.running;
  }

  /** 重置车辆到指定位置与朝向（弧度），并回到待开始状态 */
  reset(pos = new THREE.Vector3(), heading = 0): void {
    this.position.copy(pos);
    this.heading = heading;
    this.speed = 0;
    this.steer = 0;
    this.running = false;
    this.group.position.copy(pos);
    this.group.rotation.y = heading;
  }

  getPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  /** 当前车速（世界单位/秒，正向为前、负向为倒车） */
  getSpeed(): number {
    return this.speed;
  }

  /** 当前车速相对最大速度的归一化值 [0, 1]，供速度表指针使用 */
  getSpeedRatio(): number {
    return THREE.MathUtils.clamp(Math.abs(this.speed) / this.maxSpeed, 0, 1);
  }

  /** 释放事件监听与触屏 UI */
  dispose(): void {
    for (const fn of this.disposers) fn();
    this.disposers.length = 0;
    this.touchRoot?.remove();
    this.touchRoot = null;
  }

  // ------------------------------------------------------------------
  // 车身模型
  // ------------------------------------------------------------------
  private buildCar(): void {
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xd94f4f, roughness: 0.35, metalness: 0.6 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x1c2733, roughness: 0.15, metalness: 0.9 });
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x161616, roughness: 0.85, metalness: 0.1 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xcfd6e0, roughness: 0.35, metalness: 0.8 });
    const headlightMat = new THREE.MeshStandardMaterial({ color: 0xffe08a, emissive: 0x442200, roughness: 0.3 });
    const tailMat = new THREE.MeshStandardMaterial({ color: 0xff3333, emissive: 0x330000, roughness: 0.3 });

    // 底盘
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.55, 4.4), bodyMat);
    chassis.position.y = 0.65;
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    this.group.add(chassis);

    // 上层车身
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.5, 3.2), bodyMat);
    body.position.set(0, 1.15, 0.1);
    body.castShadow = true;
    body.receiveShadow = true;
    this.group.add(body);

    // 座舱（玻璃）
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.65, 1.9), glassMat);
    cabin.position.set(0, 1.55, -0.15);
    cabin.castShadow = true;
    this.group.add(cabin);

    // 前大灯
    const headlightGeo = new THREE.BoxGeometry(0.45, 0.18, 0.1);
    const hlL = new THREE.Mesh(headlightGeo, headlightMat);
    hlL.position.set(-0.65, 0.8, 2.21);
    const hlR = new THREE.Mesh(headlightGeo, headlightMat);
    hlR.position.set(0.65, 0.8, 2.21);
    this.group.add(hlL, hlR);

    // 尾灯
    const tailGeo = new THREE.BoxGeometry(0.45, 0.18, 0.1);
    const tlL = new THREE.Mesh(tailGeo, tailMat);
    tlL.position.set(-0.65, 0.85, -2.21);
    const tlR = new THREE.Mesh(tailGeo, tailMat);
    tlR.position.set(0.65, 0.85, -2.21);
    this.group.add(tlL, tlR);

    // 尾翼
    const spoilerWing = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.4), bodyMat);
    spoilerWing.position.set(0, 1.6, -2.0);
    spoilerWing.castShadow = true;
    this.group.add(spoilerWing);
    for (const x of [-0.7, 0.7]) {
      const strut = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.35, 0.15), bodyMat);
      strut.position.set(x, 1.4, -2.0);
      this.group.add(strut);
    }

    // 车轮（轴向 X）
    const wheelGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.32, 20);
    wheelGeo.rotateZ(Math.PI / 2);
    const hubGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.34, 12);
    hubGeo.rotateZ(Math.PI / 2);

    const wheelPositions: Array<[number, number, number]> = [
      [-0.95, 0.45, 1.4], [0.95, 0.45, 1.4],   // 前
      [-0.95, 0.45, -1.4], [0.95, 0.45, -1.4], // 后
    ];

    wheelPositions.forEach(([x, y, z], i) => {
      const pivot = new THREE.Group();
      pivot.position.set(x, y, z);

      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.castShadow = true;
      wheel.receiveShadow = true;

      const hub = new THREE.Mesh(hubGeo, rimMat);
      pivot.add(wheel, hub);
      this.group.add(pivot);

      this.allWheels.push(wheel);
      if (i < 2) this.frontPivots.push(pivot);
    });
  }

  // ------------------------------------------------------------------
  // 物理
  // ------------------------------------------------------------------
  private applyPhysics(dt: number): void {
    const { forward, backward, left, right } = this.input;

    // 油门 / 刹车 / 摩擦
    if (forward) {
      this.speed += this.acceleration * dt;
    } else if (backward) {
      this.speed -= this.brake * dt;
    } else if (this.speed > 0) {
      this.speed = Math.max(0, this.speed - this.friction * dt);
    } else {
      this.speed = Math.min(0, this.speed + this.friction * dt);
    }
    this.speed = THREE.MathUtils.clamp(this.speed, this.maxReverse, this.maxSpeed);

    // 转向（平滑过渡到目标转向量：左=+1，右=-1）
    const targetSteer = (left ? 1 : 0) - (right ? 1 : 0);
    this.steer = THREE.MathUtils.lerp(this.steer, targetSteer, 1 - Math.exp(-this.steerLerp * dt));

    // 航向（转向强度随速度缩放，倒车时自然反向）
    const speedFactor = this.speed / this.maxSpeed;
    this.heading += this.steer * speedFactor * this.turnRate * dt;

    // 位移（车头朝向 +Z）
    const forwardVec = new THREE.Vector3(Math.sin(this.heading), 0, Math.cos(this.heading));
    this.position.addScaledVector(forwardVec, this.speed * dt);
  }

  // ------------------------------------------------------------------
  // 车轮动画
  // ------------------------------------------------------------------
  private animateWheels(dt: number): void {
    const roll = this.speed / 0.45; // 线速度 / 半径
    for (const w of this.allWheels) {
      w.rotation.x += roll * dt;
    }
    for (const p of this.frontPivots) {
      p.rotation.y = this.steer * 0.5;
    }
  }

  // ------------------------------------------------------------------
  // 第三人称跟随相机
  // ------------------------------------------------------------------
  private followCamera(dt: number): void {
    const offset = this.cameraOffset.clone().applyQuaternion(this.group.quaternion);
    const desired = this.position.clone().add(offset);

    const t = 1 - Math.exp(-this.camLerp * dt);
    this.currentCamPos.lerp(desired, t);

    this.camera.position.copy(this.currentCamPos);
    this.camera.lookAt(this.position.clone().add(this.cameraLook));
  }

  // ------------------------------------------------------------------
  // 键盘输入
  // ------------------------------------------------------------------
  private bindKeyboard(): void {
    const map: Record<string, keyof CarInput> = {
      KeyW: 'forward',
      ArrowUp: 'forward',
      KeyS: 'backward',
      ArrowDown: 'backward',
      KeyA: 'left',
      ArrowLeft: 'left',
      KeyD: 'right',
      ArrowRight: 'right',
    };

    const onDown = (e: KeyboardEvent) => {
      const key = map[e.code];
      if (key) {
        this.input[key] = true;
        e.preventDefault();
      }
    };
    const onUp = (e: KeyboardEvent) => {
      const key = map[e.code];
      if (key) this.input[key] = false;
    };

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    this.disposers.push(() => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    });
  }

  // ------------------------------------------------------------------
  // 触屏虚拟按键
  // ------------------------------------------------------------------
  private bindTouch(): void {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!isTouch) return;

    this.touchRoot = document.createElement('div');
    Object.assign(this.touchRoot.style, {
      position: 'fixed',
      inset: '0',
      pointerEvents: 'none',
      zIndex: '1000',
      userSelect: 'none',
      touchAction: 'none',
    } as CSSStyleDeclaration);

    this.touchRoot.appendChild(this.createTouchButton('▲', 'forward', { right: '24px', bottom: '112px' }));
    this.touchRoot.appendChild(this.createTouchButton('▼', 'backward', { right: '24px', bottom: '24px' }));
    this.touchRoot.appendChild(this.createTouchButton('◀', 'left', { left: '24px', bottom: '24px' }));
    this.touchRoot.appendChild(this.createTouchButton('▶', 'right', { left: '112px', bottom: '24px' }));

    document.body.appendChild(this.touchRoot);
  }

  private createTouchButton(
    label: string,
    key: keyof CarInput,
    style: Partial<CSSStyleDeclaration>,
  ): HTMLDivElement {
    const el = document.createElement('div');
    el.textContent = label;
    Object.assign(el.style, {
      position: 'absolute',
      width: '64px',
      height: '64px',
      borderRadius: '50%',
      background: 'rgba(255,255,255,0.18)',
      border: '1px solid rgba(255,255,255,0.35)',
      color: '#ffffff',
      fontSize: '26px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'auto',
      userSelect: 'none',
      touchAction: 'none',
      ...style,
    } as CSSStyleDeclaration);

    const onDown = (e: Event) => {
      e.preventDefault();
      this.input[key] = true;
    };
    const onUp = (e: Event) => {
      e.preventDefault();
      this.input[key] = false;
    };

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    el.addEventListener('pointerleave', onUp);

    this.disposers.push(() => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      el.removeEventListener('pointerleave', onUp);
    });

    return el;
  }
}