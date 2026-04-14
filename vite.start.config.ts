import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
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
  ],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'src/shared'),
    },
  },
  server: {
    host: 'localhost',
    port: 3001,
    open: 'http://localhost:3001',
    proxy: {
      '/api': {
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
