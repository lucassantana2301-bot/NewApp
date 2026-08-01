import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Aceita conexões em localhost, 127.0.0.1 e IP da rede
    port: 3000,
    strictPort: false
  }
})
