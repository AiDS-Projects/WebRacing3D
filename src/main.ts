import * as THREE from 'three';
import { AnimationLoop } from '@/utils';
import type { AppContext } from '@/types';

function bootstrap(): void {
  const app = document.querySelector<HTMLDivElement>('#app');
  if (!app) {
    throw new Error('Mount point #app not found');
  }

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  app.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
  );
  camera.position.set(0, 4, 8);
  camera.lookAt(0, 0, 0);

  const clock = new THREE.Clock();

  // 占位场景：网格地面 + 参考立方体，用于验证渲染链路，后续由领域模块替换
  scene.add(new THREE.GridHelper(20, 20, 0x444444, 0x222222));
  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0xff5500 }),
  );
  cube.position.y = 0.5;
  scene.add(cube);

  const sun = new THREE.DirectionalLight(0xffffff, 2);
  sun.position.set(5, 10, 5);
  scene.add(sun);
  scene.add(new THREE.AmbientLight(0xffffff, 0.4));

  const context: AppContext = { renderer, scene, camera, clock };

  const loop = new AnimationLoop(clock, (frame) => {
    cube.rotation.y += frame.delta * 0.5;
    context.renderer.render(context.scene, context.camera);
  });
  loop.start();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

void bootstrap();
