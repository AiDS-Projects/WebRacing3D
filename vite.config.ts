import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: true,
  },
  build: {
    target: 'es2020',
    sourcemap: true,
  },
})