import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Tablee',
        short_name: 'Tablee',
        description:
          'Plan meals, store recipes, and build collaborative shopping lists — your kitchen companion.',
        theme_color: '#1F3A2E',
        background_color: '#F9F7F0',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        lang: 'fr',
        categories: ['food', 'lifestyle', 'productivity'],
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,ico,woff2}'],
        globIgnores: ['**/icons/Android/**', '**/icons/iOS/**'],
        // Precache the app shell (HTML/JS/CSS) and static assets.
        // Navigation requests fall back to the cached app shell so the
        // app renders offline. Supabase API calls are intentionally NOT
        // cached — they require a network connection.
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            // Cache-first for static images and fonts.
            urlPattern: ({ request }) =>
              request.destination === 'image' || request.destination === 'font',
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-assets',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
})
