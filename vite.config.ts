import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // SCHRITT 1: Konfiguriert den lokalen Vite-Entwicklungsserver.
  server: {
    // SCHRITT 2: Leitet alle Anfragen mit "/api" an den Worker weiter.
    proxy: {
      '/api': {
        // Unser Cloudflare Worker läuft lokal auf Port 8787.
        target: 'http://127.0.0.1:8787',

        // Verwendet beim Weiterleiten den Host des Zielservers.
        changeOrigin: true,
      },
    },
  },
})
