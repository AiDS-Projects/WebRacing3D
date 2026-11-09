import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

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

/* ============================================================================
 * 应用入口
 * ==========================================================================*/

class App {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene: THREE.Scene;
  private readonly camera: THREE.PerspectiveCamera;
  private readonly controls: OrbitControls;
  private readonly clock: THREE.Clock;
  private readonly container: HTMLElement;

  private rafId = 0;
  private readonly onResize: () => void;

  constructor(config: AppConfig) {
    this.container = config.container;
    const size = getSize(this.container);

    this.renderer = createRenderer(size, config.clearColor);
    this.scene = new THREE.Scene();
    this.camera = createCamera(size, config.camera);
    this.clock = new THREE.Clock();

    this.scene.add(createLights());
    this.scene.add(createDemoContent());

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.target.set(0, 0.5, 0);

    this.container.appendChild(this.renderer.domElement);

    this.onResize = () => {
      const next = getSize(this.container);
      this.camera.aspect = next.aspect;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(next.width, next.height);
    };
    window.addEventListener('resize', this.onResize);
  }

  start(): void {
    const animate = (): void => {
      this.rafId = requestAnimationFrame(animate);
      const delta = this.clock.getDelta();
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }

  dispose(): void {
    cancelAnimationFrame(this.rafId);
    window.removeEventListener('resize', this.onResize);
    this.controls.dispose();
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