/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    allowedHosts: ['app', 'vite', 'localhost'],
    watch: { usePolling: process.env.CHOKIDAR_USEPOLLING === 'true' },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
