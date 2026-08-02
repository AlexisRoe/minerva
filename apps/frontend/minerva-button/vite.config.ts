import { resolve } from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import { sharedFonts } from '../../../vite.fonts.js';
import { localHttps } from '../../../vite.https.js';

export default defineConfig({
  plugins: [react(), sharedFonts()],
  // The whole repo shares one `.env` at the root (created by `make copy-env`).
  // Vite would otherwise look for it here in the package directory and silently
  // find nothing. Only `VITE_`-prefixed variables are exposed to the browser, so
  // the backend secrets living in the same file stay out of the bundle.
  envDir: resolve(import.meta.dirname, '../../..'),
  server: { port: 4101, https: localHttps() },
  preview: { port: 4101, https: localHttps() },
  build: { outDir: 'dist', sourcemap: true },
});
