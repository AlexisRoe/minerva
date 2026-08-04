import { resolve } from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

import { sharedFonts } from '../../../vite.fonts.js';
import { localHttps } from '../../../vite.https.js';
import { runtimeConfig } from '../../../vite.runtime-config.js';
import { configEntries } from './config.entries.js';

const repoRoot = resolve(import.meta.dirname, '../../..');
const DEFAULT_PORT = 4201;

/**
 * React Fast Refresh injects its preamble as an *inline* `<script type="module">`,
 * which the `script-src 'self'` policy in index.html blocks — HMR silently dies in
 * the browser console. This widens that one directive for `vite dev` only, so the
 * policy that actually ships to users stays strict.
 */
function relaxCspForDev(): Plugin {
  return {
    name: 'minerva:relax-csp-for-dev',
    apply: 'serve',
    transformIndexHtml: (html) => html.replace("script-src 'self'", "script-src 'self' 'unsafe-inline'"),
  };
}

export default defineConfig(({ mode }) => {
  const port = Number(loadEnv(mode, repoRoot, '').APP_FE_MANANGER_PORT);
  const serverPort = Number.isFinite(port) && port > 0 ? port : DEFAULT_PORT;

  return {
    plugins: [
      react(),
      relaxCspForDev(),
      sharedFonts(),
      runtimeConfig({
        envDir: repoRoot,
        packageJson: resolve(import.meta.dirname, 'package.json'),
        entries: configEntries,
      }),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          id: '/',
          name: 'Minerva Manager',
          short_name: 'Minerva',
          description: 'Review the work items Minerva extracts from email.',
          lang: 'en',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          background_color: '#ffffff',
          theme_color: '#4c6ef5',
          icons: [
            { src: 'assets/icons/icon-48.png', sizes: '48x48', type: 'image/png' },
            { src: 'assets/icons/icon-64.png', sizes: '64x64', type: 'image/png' },
            { src: 'assets/icons/icon-128.png', sizes: '128x128', type: 'image/png' },
            { src: 'assets/icons/icon-144.png', sizes: '144x144', type: 'image/png' },
            { src: 'assets/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: 'assets/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            {
              src: 'assets/icons/icon-192-maskable.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: 'assets/icons/icon-512-maskable.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          // `.json` is left out on purpose: precaching `config.json` would pin
          // an installed manager to the settings of the build it installed
          // from, which is the whole point of fetching them at runtime.
          globPatterns: ['**/*.{js,css,html,ico,png,ttf,woff2}'],
          globIgnores: ['**/icon-original-991.png'],
        },
      }),
    ],
    envDir: repoRoot,
    resolve: { alias: { '@': resolve(import.meta.dirname, 'src') } },
    server: { port: serverPort, https: localHttps() },
    preview: { port: serverPort, https: localHttps() },
    build: { outDir: 'dist', sourcemap: true },
  };
});
