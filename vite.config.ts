import { defineConfig, type Plugin } from 'vite'
import { spawn } from 'node:child_process'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const RACES_DIR = resolve(__dirname, 'resource/races')

// Dev only: re-run `npm run parse` when race result files change, so the regenerated
// src/data/*.json is picked up by Vite and the page reloads with the new results
function watchRaceResults(): Plugin {
  return {
    name: 'watch-race-results',
    apply: 'serve',
    configureServer(server) {
      let timer: NodeJS.Timeout | undefined
      let running = false
      let pending = false

      const parse = () => {
        if (running) {
          pending = true
          return
        }
        running = true
        server.config.logger.info('[watch-race-results] race files changed, running npm run parse…', { timestamp: true })
        const child = spawn('npm', ['run', 'parse'], { cwd: __dirname, stdio: 'inherit' })
        child.on('exit', (code) => {
          running = false
          if (code !== 0) server.config.logger.error(`[watch-race-results] npm run parse failed (exit ${code})`)
          if (pending) {
            pending = false
            parse()
          }
        })
      }

      server.watcher.add(RACES_DIR)
      server.watcher.on('all', (_event, file) => {
        if (!file.startsWith(RACES_DIR) || !file.endsWith('.json')) return
        // Debounce bursts, e.g. several result files saved at once
        clearTimeout(timer)
        timer = setTimeout(parse, 300)
      })
    },
  }
}

export default defineConfig({
  base: './',
  server: {
    host: '0.0.0.0',
  },
  define: {
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [
    watchRaceResults(),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Gladiator Gokart Challenge',
        short_name: 'Gokart Results',
        theme_color: '#1a1a2e',
        background_color: '#0f0f0f',
        display: 'standalone',
        start_url: './',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,json,pdf}'],
      },
    }),
  ],
})
