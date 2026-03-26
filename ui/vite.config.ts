import { fileURLToPath, URL } from 'node:url'

import { mkdir, rename } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import tailwindcss from '@tailwindcss/vite'

const appConfig: AppConfig = {
  basePath: process.env.BASE_PATH || '/',
  teamChatUrl: process.env.TEAMS_CHAT_URL || 'https://example.com/team-chat',
  feedbackUrl: process.env.FEEDBACK_URL || 'https://example.com/feedback',
}

export default defineConfig(() => {
  return {
    base: appConfig.basePath,

    css: {
      lightningcss: {
        errorRecovery: true,
      },
      preprocessorOptions: {
        scss: {
          quietDeps: true,
          additionalData: `$base-path: "${appConfig.basePath}";`,
        },
      },
    },

    plugins: [
      vue(),
      vueDevTools(),
      tailwindcss(),
      viteStaticCopy({
        targets: [
          {
            src: 'node_modules/govuk-frontend/dist/govuk/assets/**/*',
            dest: '',
            rename: { stripBase: 5 },
          },
          {
            src: 'node_modules/swagger-ui-dist/swagger-ui-bundle.js',
            dest: 'swagger',
            rename: { stripBase: true },
          },
          {
            src: 'node_modules/swagger-ui-dist/swagger-ui.css',
            dest: 'swagger',
            rename: { stripBase: true },
          },
        ],
      }),
      {
        name: 'html-transform',
        transformIndexHtml: {
          order: 'post',
          handler(html) {
            // assets are copied from the govuk ui library and vite does not rewrite their paths for us
            if (appConfig.basePath !== '/') {
              return html.replace(/href="\//g, `href="${appConfig.basePath}`)
            }
            return html
          },
        },
      },
      {
        name: 'move-index-html',
        async closeBundle() {
          const src = join(__dirname, '../static/index.html')
          const destDir = join(__dirname, '../templates')
          const dest = join(destDir, 'index.html')
          if (!existsSync(destDir)) await mkdir(destDir)
          if (existsSync(src)) await rename(src, dest)
        },
      },
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    define: {
      __APP_CONFIG__: JSON.stringify(appConfig),
    },
    root: '.',
    build: {
      outDir: '../static',
      assetsDir: '',
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
