import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/01/', // GitHub Pages 프로젝트 페이지 경로
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})
