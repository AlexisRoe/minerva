/// <reference types='vitest' />

import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { buildInfoDefine, localHttps, workspaceRoot } from '../../tools/vite/vite-shared';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/report-button',
  envDir: workspaceRoot,
  define: buildInfoDefine(),
  server: {
    port: 5174,
    strictPort: true,
    host: 'localhost',
    https: localHttps(),
  },
  preview: {
    port: 5174,
    strictPort: true,
    host: 'localhost',
    https: localHttps(),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Minerva Report Button',
        short_name: 'Report',
        description: 'Minerva Report Button frontend',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#e8710a',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
    }),
  ],
  build: {
    outDir: './dist',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        authDialog: resolve(__dirname, 'auth-dialog.html'),
      },
    },
  },
  test: {
    name: 'report-button',
    watch: false,
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    restoreMocks: true,
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8' as const,
    },
  },
}));
