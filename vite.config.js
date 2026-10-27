import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // config touched to trigger a Vite dev-server restart after PostCSS changes
})
