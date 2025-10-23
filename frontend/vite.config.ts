import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import tailwindcss from '@tailwindcss/vite'

const BASE_PATH = process.env.BASE_PATH || '/'

export default defineConfig(() => {
  return {
    base: BASE_PATH,
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
            if (BASE_PATH !== '/') {
              return html.replace(/href="\/assets\//g, `href="${BASE_PATH}assets/`)
            }
            return html
          }
        },
        generateBundle(options, bundle) {
          if (BASE_PATH !== '/') {
            // Rewrite CSS URLs for GOV.UK fonts
            Object.keys(bundle).forEach(fileName => {
              const file = bundle[fileName];
              if (file.type === 'asset' && fileName.endsWith('.css')) {
                file.source = file.source.toString().replace(
                  /url\(\/assets\//g,
                  `url(${BASE_PATH}assets/`
                );
              }
            });
          }
        }
      },
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
    define: {
      __BASE_PATH__: JSON.stringify(BASE_PATH),
    },
    root: '.',
    build: {
      outDir: '../backend/static',
      assetsDir: 'assets',
      manifest: false,
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
