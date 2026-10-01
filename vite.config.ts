import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
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
})
