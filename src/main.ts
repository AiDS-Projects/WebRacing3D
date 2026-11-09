import * as THREE from 'three';

/* ============================================================================
 * 类型定义层
 * ==========================================================================*/

/** 相机配置 */
interface CameraConfig {
  fov: number;
  near: number;
  far: number;
  position: THREE.Vector3;
}

/** 应用配置 */
interface AppConfig {
  /** 挂载容器 */
  container: HTMLElement;
  /** 背景色 */
  clearColor: number;
  /** 相机参数 */
  camera: CameraConfig;
}

/** 视口尺寸 */
interface SceneSize {
  width: number;
  height: number;
  aspect: number;
}

/** 键盘输入状态 */
interface KeyState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
}

/* ============================================================================
 * 共享工具层
 * ==========================================================================*/

const DEFAULT_CONFIG: Omit<AppConfig, 'container'> = {
  clearColor: 0x1a1a2e,
  camera: {
    fov: 60,
    near: 0.1,
    far: 1000,
    position: new THREE.Vector3(4, 3, 6),
  },
};

/** 赛车物理参数 */
const CAR_CONFIG = {
  acceleration: 12,
  maxSpeed: 20,
  reverseMaxSpeed: 8,
  friction: 6,
  turnSpeed: 2.2,
};

/** 第三人称跟随相机参数 */
const FOLLOW_CONFIG = {
  distance: 6.5,
  height: 2.8,
  lerpSpeed: 6,
};

function getSize(container: HTMLElement): SceneSize {
  const width = container.clientWidth || window.innerWidth;
  const height = container.clientHeight || window.innerHeight;
  return { width, height, aspect: width / height };
}

function createRenderer(size: SceneSize, clearColor: number): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(size.width, size.height);
  renderer.setClearColor(clearColor);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  return renderer;
}

function createCamera(size: SceneSize, config: CameraConfig): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(config.fov, size.aspect, config.near, config.far);
  camera.position.copy(config.position);
  return camera;
}

function createLights(): THREE.Group {
  const group = new THREE.Group();

  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
  group.add(ambient);

  const directional = new THREE.DirectionalLight(0xffffff, 1.2);
  directional.position.set(5, 10, 7);
  directional.castShadow = true;
  directional.shadow.mapSize.set(2048, 2048);
  group.add(directional);

  return group;
}

function createDemoContent(): THREE.Group {
  const group = new THREE.Group();

  // 地面
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshStandardMaterial({ color: 0x2e2e4a, roughness: 0.9 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);

  // 网格辅助
  const grid = new THREE.GridHelper(20, 20, 0x555577, 0x33334d);
  grid.position.y = 0.01;
  group.add(grid);

  // 演示立方体
  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 1.5, 1.5),
    new THREE.MeshStandardMaterial({ color: 0x4c8bf5, roughness: 0.3, metalness: 0.1 })
  );
  cube.position.y = 0.75;
  cube.castShadow = true;
  cube.receiveShadow = true;
  group.add(cube);

  // 轴辅助
  const axes = new THREE.AxesHelper(2);
  axes.position.y = 0.02;
  group.add(axes);

  return group;
}

/** 构建玩家赛车（车头朝向 +Z） */
function createPlayerCar(): THREE.Group {
  const car = new THREE.Group();

  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0xd64545,
    roughness: 0.35,
    metalness: 0.4,
  });
  const cabinMaterial = new THREE.MeshStandardMaterial({
    color: 0x2b2b3a,
    roughness: 0.2,
    metalness: 0.5,
  });
  const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x14141c, roughness: 0.85 });

  // 车身
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 3.4), bodyMaterial);
  body.position.y = 0.55;
  body.castShadow = true;
  body.receiveShadow = true;
  car.add(body);

  // 座舱
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.45, 1.7), cabinMaterial);
  cabin.position.set(0, 1.0, -0.2);
  cabin.castShadow = true;
  cabin.receiveShadow = true;
  car.add(cabin);

  // 车轮
  const wheelGeometry = new THREE.CylinderGeometry(0.32, 0.32, 0.28, 16);
  wheelGeometry.rotateZ(Math.PI / 2);
  const wheelPositions: ReadonlyArray<readonly [number, number, number]> = [
    [-0.85, 0.32, 1.15],
    [0.85, 0.32, 1.15],
    [-0.85, 0.32, -1.15],
    [0.85, 0.32, -1.15],
  ];
  for (const [x, y, z] of wheelPositions) {
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.position.set(x, y, z);
    wheel.castShadow = true;
    wheel.receiveShadow = true;
    car.add(wheel);
  }

  return car;
}

/* ============================================================================
 * 应用入口
 * ==========================================================================*/

class App {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene: THREE.Scene;
  private readonly camera: THREE.PerspectiveCamera;
  private readonly clock: THREE.Clock;
  private readonly container: HTMLElement;
  private readonly car: THREE.Group;

  private readonly input: KeyState = { forward: false, backward: false, left: false, right: false };
  private carHeading = 0;
  private carVelocity = 0;

  private readonly desiredPosition = new THREE.Vector3();
  private readonly lookTarget = new THREE.Vector3();

  private rafId = 0;
  private readonly onResize: () => void;
  private readonly onKeyDown: (event: KeyboardEvent) => void;
  private readonly onKeyUp: (event: KeyboardEvent) => void;

  constructor(config: AppConfig) {
    this.container = config.container;
    const size = getSize(this.container);

    this.renderer = createRenderer(size, config.clearColor);
    this.scene = new THREE.Scene();
    this.camera = createCamera(size, config.camera);
    this.clock = new THREE.Clock();

    this.scene.add(createLights());
    this.scene.add(createDemoContent());

    this.car = createPlayerCar();
    this.car.position.set(0, 0, -3);
    this.scene.add(this.car);

    this.container.appendChild(this.renderer.domElement);

    this.onResize = () => {
      const next = getSize(this.container);
      this.camera.aspect = next.aspect;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(next.width, next.height);
    };
    window.addEventListener('resize', this.onResize);

    this.onKeyDown = (event) => this.handleKey(event, true);
    this.onKeyUp = (event) => this.handleKey(event, false);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  private handleKey(event: KeyboardEvent, pressed: boolean): void {
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.input.forward = pressed;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.input.backward = pressed;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.input.left = pressed;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.input.right = pressed;
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  private updateCar(delta: number): void {
    const throttle = (this.input.forward ? 1 : 0) - (this.input.backward ? 1 : 0);
    const steer = (this.input.left ? 1 : 0) - (this.input.right ? 1 : 0);

    // 加速 / 减速
    if (throttle !== 0) {
      this.carVelocity += CAR_CONFIG.acceleration * throttle * delta;
      this.carVelocity = THREE.MathUtils.clamp(
        this.carVelocity,
        -CAR_CONFIG.reverseMaxSpeed,
        CAR_CONFIG.maxSpeed
      );
    } else {
      // 摩擦减速
      const decay = CAR_CONFIG.friction * delta;
      if (Math.abs(this.carVelocity) <= decay) {
        this.carVelocity = 0;
      } else {
        this.carVelocity -= Math.sign(this.carVelocity) * decay;
      }
    }

    // 转向（仅在有速度时生效）
    if (steer !== 0 && Math.abs(this.carVelocity) > 0.05) {
      this.carHeading += steer * CAR_CONFIG.turnSpeed * delta * Math.sign(this.carVelocity);
    }

    const forward = new THREE.Vector3(Math.sin(this.carHeading), 0, Math.cos(this.carHeading));
    this.car.position.addScaledVector(forward, this.carVelocity * delta);
    this.car.rotation.y = this.carHeading;
  }

  private updateCamera(delta: number): void {
    const forward = new THREE.Vector3(Math.sin(this.carHeading), 0, Math.cos(this.carHeading));

    // 期望相机位置：车后方 + 上方
    this.desiredPosition
      .copy(this.car.position)
      .addScaledVector(forward, -FOLLOW_CONFIG.distance)
      .add(new THREE.Vector3(0, FOLLOW_CONFIG.height, 0));

    // 帧率无关的平滑跟随
    const alpha = 1 - Math.exp(-FOLLOW_CONFIG.lerpSpeed * delta);
    this.camera.position.lerp(this.desiredPosition, alpha);

    // 看向车辆前方
    this.lookTarget
      .copy(this.car.position)
      .add(new THREE.Vector3(0, 1, 0))
      .addScaledVector(forward, 4);
    this.camera.lookAt(this.lookTarget);
  }

  start(): void {
    const animate = (): void => {
      this.rafId = requestAnimationFrame(animate);
      const delta = this.clock.getDelta();
      this.updateCar(delta);
      this.updateCamera(delta);
      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }

  dispose(): void {
    cancelAnimationFrame(this.rafId);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.scene.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.geometry.dispose();
        const material = mesh.material as THREE.Material | THREE.Material[];
        if (Array.isArray(material)) {
          material.forEach((m) => m.dispose());
        } else {
          material.dispose();
        }
      }
    });
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}

/* ============================================================================
 * 启动
 * ==========================================================================*/

function bootstrap(): App {
  const container = document.querySelector<HTMLElement>('#app') ?? document.body;
  const app = new App({ container, ...DEFAULT_CONFIG });
  app.start();

  // HMR 支持：热更新时释放旧实例
  if (import.meta.hot) {
    import.meta.hot.dispose(() => app.dispose());
  }

  return app;
}

bootstrap();