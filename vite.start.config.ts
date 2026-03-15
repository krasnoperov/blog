import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import mkcert from 'vite-plugin-mkcert';
import { visualizer } from 'rollup-plugin-visualizer';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';

const KNOWN_SSR_EXTERNAL_UNUSED_IMPORT_WARNINGS = [
  '@tanstack/router-core/ssr/server',
  '@tanstack/router-core/ssr/client',
  '@tanstack/router-core',
];

export default defineConfig({
  plugins: [
    tanstackStart({
      srcDirectory: 'src/frontend-start',
      router: {
        generatedRouteTree: 'routeTree.gen.ts',
      },
    }),
    react(),
    mkcert(),
    visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
    visualizer({
      filename: './dist/stats.json',
      template: 'raw-data',
    }),
  ],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'src/shared'),
    },
  },
  server: {
    host: 'local.krasnoperov.me',
    port: 3001,
    open: 'https://local.krasnoperov.me:3001',
    proxy: {
      '/api': {
        target: 'http://localhost:8788',
        changeOrigin: true,
        secure: false,
      },
      '/.well-known': {
        target: 'http://localhost:8788',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
  publicDir: path.resolve(__dirname, 'src/frontend/public'),
  build: {
    outDir: path.resolve(__dirname, 'dist/frontend-start'),
    emptyOutDir: true,
    rollupOptions: {
      onwarn(warning, warn) {
        if (
          warning.code === 'UNUSED_EXTERNAL_IMPORT' &&
          typeof warning.message === 'string' &&
          KNOWN_SSR_EXTERNAL_UNUSED_IMPORT_WARNINGS.some((needle) => warning.message.includes(needle))
        ) {
          return;
        }

        warn(warning);
      },
    },
  },
});
