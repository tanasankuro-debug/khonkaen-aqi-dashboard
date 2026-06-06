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
        configure: (proxy) => {
          proxy.on('error', (err) => console.error('[air4thai proxy error]', err.message));
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36');
            proxyReq.setHeader('Accept', 'application/json, */*');
            proxyReq.setHeader('Referer', 'http://air4thai.pcd.go.th/');
          });
        },
      },
      '/api/firms': {
        target: 'https://firms.modaps.eosdis.nasa.gov',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/firms/, ''),
      },
    },
  },
})
