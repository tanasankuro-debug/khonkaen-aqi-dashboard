import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api/air4thai': {
        target: 'http://air4thai.pcd.go.th',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/air4thai/, ''),
        secure: false,
      },
      '/api/firms': {
        target: 'https://firms.modaps.eosdis.nasa.gov',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/firms/, ''),
      },
    },
  },
})
