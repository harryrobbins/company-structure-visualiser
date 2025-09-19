import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import tailwindcss from '@tailwindcss/vite'

const BASE_PATH = process.env.BASE_PATH || '/static/dist/'

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  // This function allows us to have different configs for 'serve' and 'build'.
  const isProduction = command === 'build';

  return {
    base: isProduction ? BASE_PATH : '/',
    plugins: [
      vue(),
      vueDevTools(),
      tailwindcss(),
      viteStaticCopy({
        targets: [
          {
            src: 'node_modules/govuk-frontend/dist/govuk/assets/*',
            dest: 'assets'
          }
        ]
      }),
      {
        name: 'html-transform',
        transformIndexHtml: {
          order: 'post',
          handler(html) {
            // assets are copied from the govuk ui library and vite does not rewrite their paths for us
            if (isProduction) {
              return html.replace(/href="\/assets\//g, `href="${BASE_PATH}`)
            }
            return html
          }
        }
      }
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
    root: '.',
    build: {
      outDir: '../backend/static/dist',
      assetsDir: 'assets',
      manifest: true,
      emptyOutDir: true,
    },
    server: {
      port: 5174,
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8050',
          changeOrigin: true,
        },
      },
    },
  }
})
