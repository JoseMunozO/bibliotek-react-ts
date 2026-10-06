import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
// defineConfig från vitest/config är Vites, med typat alternativ `test`
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Rapporten från `npm run coverage` ska inte ladda om appen under utveckling
    watch: { ignored: ['**/coverage/**'] },
    // Skickar /api vidare till backend (bibliotek-api) för att undvika CORS-problem
    proxy: {
      '/api': {
        target: 'http://localhost:8090',
        // Utan Origin tillämpar backend inte CORS, så det fungerar på vilken Vite-port som helst
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
