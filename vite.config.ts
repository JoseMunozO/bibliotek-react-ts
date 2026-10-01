import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
// defineConfig de vitest/config es el de Vite con la opción `test` tipada
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // El informe de `npm run coverage` no debe recargar la app en desarrollo
    watch: { ignored: ['**/coverage/**'] },
    // Redirige /api al backend (bibliotek-api) para evitar problemas de CORS
    proxy: {
      '/api': {
        target: 'http://localhost:8090',
        // Sin Origin el backend no aplica CORS, así funciona en cualquier puerto de Vite
        // (si no, Spring responde 403 "Invalid CORS request" fuera de localhost:5173)
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => proxyReq.removeHeader('origin'))
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Cada test empieza sin mocks ni globals sustituidos (fetch, localStorage...)
    restoreMocks: true,
    unstubGlobals: true,
    coverage: {
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**', 'src/main.tsx'],
    },
  },
})
