import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

// Vite + TypeScript + Three.js 项目脚手架配置
// 统一入口：src/ 下模块通过 '@' 别名引用，静态资源从 public/ 提供
export default defineConfig({
  // 基础公共路径，适配子路径部署时按需修改
  base: './',

  // 解析别名
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@types': fileURLToPath(new URL('./src/types', import.meta.url)),
      '@utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
      '@core': fileURLToPath(new URL('./src/core', import.meta.url)),
      '@scenes': fileURLToPath(new URL('./src/scenes', import.meta.url)),
    },
  },

  // 本地开发服务器
  server: {
    host: '0.0.0.0',
    port: 5173,
    open: false,
    cors: true,
  },

  // 生产构建
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    // Three.js 体积较大，单独拆分便于缓存
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
        },
      },
    },
    chunkSizeWarningLimit: 1024,
  },

  // 预览构建产物
  preview: {
    host: '0.0.0.0',
    port: 4173,
  },

  // 处理 GLTF / 纹理等静态资源（vite 默认已支持，此处显式声明常用扩展）
  assetsInclude: ['**/*.gltf', '**/*.glb', '**/*.hdr', '**/*.ktx2'],

  // GLSL 着色器：以 ?raw 导入 .glsl 文件
  // 示例: import vertShader from './shader.vert.glsl?raw'
});