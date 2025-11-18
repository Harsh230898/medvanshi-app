import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'MedVanshi NEET PG',
        short_name: 'MedVanshi',
        description: 'NEET PG Study Platform with AI & Gamification',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        runtimeCaching: [{
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*$/,
            handler: 'NetworkFirst',
            options: {
                cacheName: 'firestore-data',
                expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 60 * 60 * 24 // 1 day
                }
            }
        }]
      }
    })
  ],
})