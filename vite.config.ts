import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/upload': 'http://localhost:3001',
      '/render': 'http://localhost:3001',
      '/status': 'http://localhost:3001',
      '/job': 'http://localhost:3001',
      '/outputs': 'http://localhost:3001'
    }
  }
})