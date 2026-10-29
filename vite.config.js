import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Backend API (Express on port 5000)
      '/api': 'http://localhost:5000',
      // Uploaded images (project screenshots, profile photo)
      '/uploads': 'http://localhost:5000',
    },
  },
})
