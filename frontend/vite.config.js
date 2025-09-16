// frontend/vite.config.js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  // This function allows us to have different configs for 'serve' and 'build'.
  const isProduction = command === 'build';

  return {
    // --- PATH FIX ---
    // Conditionally set the base path.
    // For the production build, we need the full path for FastAPI.
    // For the development server, we use the root path '/' so it works correctly.
    base: isProduction ? '/static/dist/' : '/',
    // --- End of FIX ---

    plugins: [vue()],
    root: '.',
    build: {
      outDir: '../static/dist',
      assetsDir: 'assets',
      manifest: true,
      emptyOutDir: true,
      rollupOptions: {
        input: 'index.html',
      },
    },
    server: {
      // The port was missing, which might cause issues. Let's define it.
      port: 5174,
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
      },
    },
  };
});

