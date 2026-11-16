import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  // 路径别名：@/ -> src/
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  // 开发服务器配置
  server: {
    host: true, // 监听局域网，便于真机/远程调试
    port: 5173,
    open: true, // 启动后自动打开浏览器
    hmr: {
      overlay: true, // 编译错误直接覆盖提示
    },
  },

  // 构建输出配置
  build: {
    outDir: 'dist',
    sourcemap: true,
    emptyOutDir: true,
    chunkSizeWarningLimit: 1500, // 提高阈值以适配 three.js 等大型依赖
  },

  // 优化依赖预构建
  optimizeDeps: {
    include: ['three'],
  },
})