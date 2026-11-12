import * as THREE from 'three';

/* ============================================================================
 * 骨架占位：场景初始化
 * ==========================================================================*/

/**
 * 创建并返回空的 THREE 场景。
 *
 * 本文件为脚手架骨架，仅完成场景初始化占位：
 * 不引入 camera / physics / player / race 等业务模块，
 * 业务逻辑由后续工单在对应模块中实现后接入。
 */
function createScene(): THREE.Scene {
  return new THREE.Scene();
}

export { createScene };