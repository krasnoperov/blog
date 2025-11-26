import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import mkcert from 'vite-plugin-mkcert';
import path from 'node:path';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  root: path.resolve(__dirname, 'src/frontend'),
  plugins: [
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
      json: true,
    })
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
  build: {
    outDir: path.resolve(__dirname, 'dist/frontend'),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React core libraries
          if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/scheduler/')) {
            return 'react-vendor';
          }

          // React ecosystem (router, markdown, etc.)
          if (id.includes('node_modules/react-router') ||
              id.includes('node_modules/react-markdown') ||
              id.includes('node_modules/@tanstack/react-query') ||
              id.includes('node_modules/@react-oauth')) {
            return 'react-ecosystem';
          }

          // OpenAI and related libraries
          if (id.includes('node_modules/@openai/') ||
              id.includes('node_modules/openai/') ||
              id.includes('node_modules/zod/')) {
            return 'openai';
          }

          // Markdown processing libraries (used by react-markdown)
          if (id.includes('node_modules/unified') ||
              id.includes('node_modules/remark-') ||
              id.includes('node_modules/rehype-') ||
              id.includes('node_modules/mdast-') ||
              id.includes('node_modules/hast-') ||
              id.includes('node_modules/micromark') ||
              id.includes('node_modules/vfile') ||
              id.includes('node_modules/unist-')) {
            return 'markdown-processor';
          }

          // Other vendor libraries
          if (id.includes('node_modules/')) {
            return 'vendor';
          }
        },
      },
    },
  },
});
