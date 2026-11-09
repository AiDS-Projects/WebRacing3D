import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// ============================================================================
// 类型定义层
// ============================================================================

/** 应用初始化配置 */
export interface AppOptions {
  /** 挂载容器 */
  container: HTMLElement;
  /** 是否开启抗锯齿，默认 true */
  antialias?: boolean;
  /** 是否启用轨道控制器，默认 true */
  controls?: boolean;
  /** 相机远裁剪面 */
  far?: number;
  /** 相机近裁剪面 */
  near?: number;
}

/** 渲染帧信息 */
export interface FrameInfo {
  /** 距离上次帧的时间（秒） */
  delta: number;
  /** 应用启动以来的总时间（秒） */
  elapsed: number;
}

/** 可插拔的更新模块接口，为后续业务模块提供统一契约 */
export interface Updatable {
  update(frame: FrameInfo): void;
}

// ============================================================================
// 共享工具层
// ============================================================================

/** 创建 WebGL 渲染器 */
function createRenderer(container: HTMLElement, antialias = true): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({ antialias });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);
  return renderer;
}

/** 创建透视相机 */
function createCamera(container: HTMLElement, near = 0.1, far = 1000): THREE.PerspectiveCamera {
  const aspect = container.clientWidth / container.clientHeight;
  const camera = new THREE.PerspectiveCamera(60, aspect, near, far);
  camera.position.set(0, 2, 5);
  camera.lookAt(0, 0, 0);
  return camera;
}

/** 创建默认场景灯光 */
function createLights(): THREE.Group {
  const group = new THREE.Group();

  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  group.add(ambient);

  const directional = new THREE.DirectionalLight(0xffffff, 1.2);
  directional.position.set(5, 10, 5);
  directional.castShadow = true;
  group.add(directional);

  return group;
}

// ============================================================================
// 应用主类
// ============================================================================

export class App {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;

  private readonly container: HTMLElement;
  private readonly clock = new THREE.Clock();
  private controls?: OrbitControls;
  private readonly updatables: Updatable[] = [];
  private animationId = 0;
  private disposed = false;

  constructor(options: AppOptions) {
    this.container = options.container;
    this.renderer = createRenderer(this.container, options.antialias);
    this.scene = new THREE.Scene();
    this.camera = createCamera(this.container, options.near, options.far);

    this.scene.add(createLights());

    if (options.controls !== false) {
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
    }

    window.addEventListener('resize', this.onResize);
  }

  /** 注册可更新模块 */
  addUpdatable(updatable: Updatable): void {
    this.updatables.push(updatable);
  }

  /** 启动渲染循环 */
  start(): void {
    if (this.disposed) return;
    this.clock.start();
    this.animate();
  }

  /** 销毁并释放资源 */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.onResize);
    this.controls?.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private readonly onResize = (): void => {
    const { clientWidth, clientHeight } = this.container;
    this.camera.aspect = clientWidth / clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(clientWidth, clientHeight);
  };

  private readonly animate = (): void => {
    if (this.disposed) return;
    this.animationId = requestAnimationFrame(this.animate);

    const frame: FrameInfo = {
      delta: this.clock.getDelta(),
      elapsed: this.clock.getElapsedTime(),
    };

    for (const updatable of this.updatables) {
      updatable.update(frame);
    }

    this.controls?.update();
    this.renderer.render(this.scene, this.camera);
  };
}

// ============================================================================
// 入口
// ============================================================================

const container = document.querySelector<HTMLElement>('#app');

if (container) {
  const app = new App({ container });
  app.start();
} else {
  console.error('[init] 未找到挂载容器 #app，请检查 index.html');
}