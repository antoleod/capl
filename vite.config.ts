import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/upload': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/render': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/status': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/job': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/outputs': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  }
})