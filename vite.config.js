import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), tailwindcss()],

    // Prevent Vite from pre-bundling maplibre-gl (UMD) incorrectly in production
    optimizeDeps: {
      exclude: ['@maptiler/sdk', '@maptiler/weather'],
    },

    // Ensure the SDK worker assets are preserved
    build: {
      rollupOptions: {
        external: [],
      },
      commonjsOptions: {
        transformMixedEsModules: true,
      },
    },

    server: {
      proxy: {
        // Dev proxy for Air4Thai (production uses api/air4thai.js Vercel function)
        '/api/air4thai': {
          target:       'http://air4thai.pcd.go.th',
          changeOrigin: true,
          rewrite:      () => '/services/getNewAQI_JSON.php',
          secure:       false,
          configure: (proxy) => {
            proxy.on('error', (err) => console.error('[air4thai proxy]', err.message));
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36');
              proxyReq.setHeader('Accept',  'application/json, */*');
              proxyReq.setHeader('Referer', 'http://air4thai.pcd.go.th/');
            });
          },
        },

        // Dev proxy for NASA FIRMS (production uses api/firms.js Vercel function)
        '/api/firms': {
          target:       'https://firms.modaps.eosdis.nasa.gov',
          changeOrigin: true,
          rewrite:      () => {
            const key = env.VITE_NASA_FIRMS_KEY;
            return `/api/area/csv/${key}/VIIRS_SNPP_NRT/97,12,107,22/1`;
          },
        },
      },
    },
  };
});
