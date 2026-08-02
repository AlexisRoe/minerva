import { resolve } from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

import { sharedFonts } from '../../../vite.fonts.js';
import { localHttps } from '../../../vite.https.js';

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

export default defineConfig({
  plugins: [
    react(),
    relaxCspForDev(),
    sharedFonts(),
    VitePWA({
      // The service worker updates itself in the background and takes over on the
      // next navigation. No "a new version is available" prompt to build, which is
      // the right trade for an internal review UI.
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
        // Mantine's indigo[6] — the primary shade of `minervaTheme` in @minerva/ui-lib.
        theme_color: '#4c6ef5',
        icons: [
          { src: 'assets/icons/icon-48.png', sizes: '48x48', type: 'image/png' },
          { src: 'assets/icons/icon-64.png', sizes: '64x64', type: 'image/png' },
          { src: 'assets/icons/icon-128.png', sizes: '128x128', type: 'image/png' },
          { src: 'assets/icons/icon-144.png', sizes: '144x144', type: 'image/png' },
          { src: 'assets/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'assets/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          // Maskable variants carry the safe-zone padding Android needs to crop the
          // icon to the launcher's shape. Without a `maskable` entry Android applies
          // its own white circle behind the `any` icon instead.
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
        // `ttf` covers the shared fonts that `sharedFonts()` copies into
        // dist/assets/fonts; without it the installed app falls back to a
        // system font offline.
        globPatterns: ['**/*.{js,css,html,ico,png,ttf,woff2}'],
        // The 991px master is kept in the repo as the source the other sizes were
        // cut from; it is referenced by nothing, so it stays out of the precache.
        globIgnores: ['**/icon-original-991.png'],
      },
    }),
  ],
  // The whole repo shares one `.env` at the root (created by `make copy-env`).
  // Vite would otherwise look for it here in the package directory and silently
  // find nothing. Only `VITE_`-prefixed variables are exposed to the browser, so
  // the backend secrets living in the same file stay out of the bundle.
  envDir: resolve(import.meta.dirname, '../../..'),
  server: { port: 4201, https: localHttps() },
  preview: { port: 4201, https: localHttps() },
  build: { outDir: 'dist', sourcemap: true },
});
