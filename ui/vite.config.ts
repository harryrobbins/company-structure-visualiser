import { fileURLToPath, URL } from 'node:url'

import { mkdir, rename } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import tailwindcss from '@tailwindcss/vite'

/**
 * HACK: Fixes issue with the CJS reference to @dagrejs/graphlib in @dagrejs/dagre@^2.
 * https://github.com/dagrejs/dagre/issues/492
 */
function dagreGraphlibPlugin(): Plugin {
  return {
    name: 'dagre-graphlib-plugin',
    enforce: 'pre',
    transform(code, id) {
      if (!id.includes('dagrejs') || id.includes('graphlib')) return
      const modifiedCode = `
        import * as __graphlib__ from '@dagrejs/graphlib';
        ${code.replace(/g\(\s*["']@dagrejs\/graphlib["']\s*\)/g, '__graphlib__')}`
      return { code: modifiedCode, map: null }
    },
  }
}

const appConfig: AppConfig = {
  basePath: process.env.BASE_PATH || '/',
  teamChatUrl: process.env.TEAMS_CHAT_URL || 'https://example.com/team-chat',
  feedbackUrl: process.env.FEEDBACK_URL || 'https://example.com/feedback',
}

export default defineConfig(() => {
  return {
    base: appConfig.basePath,

    css: {
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
      dagreGraphlibPlugin(),
      viteStaticCopy({
        targets: [
          {
            src: 'node_modules/govuk-frontend/dist/govuk/assets/*',
            dest: '',
          },
          {
            src: 'node_modules/swagger-ui-dist/swagger-ui-bundle.js',
            dest: 'swagger',
          },
          {
            src: 'node_modules/swagger-ui-dist/swagger-ui.css',
            dest: 'swagger',
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
    optimizeDeps: {
      include: ['@dagrejs/dagre > @dagrejs/graphlib'],
    },
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
