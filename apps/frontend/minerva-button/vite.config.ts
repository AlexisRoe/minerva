import { resolve } from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

import { sharedFonts } from '../../../vite.fonts.js';
import { localHttps } from '../../../vite.https.js';
import { extraPages } from '../../../vite.pages.js';
import { runtimeConfig } from '../../../vite.runtime-config.js';
import { configEntries } from './config.entries.js';

const repoRoot = resolve(import.meta.dirname, '../../..');

const DEFAULT_PORT = 4101;

export default defineConfig(({ mode }) => {
  const port = Number(loadEnv(mode, repoRoot, '').APP_FE_RB_PORT);
  const serverPort = Number.isFinite(port) && port > 0 ? port : DEFAULT_PORT;

  return {
    plugins: [
      react(),
      sharedFonts(),
      extraPages([
        { route: 'support', file: 'support.html' },
        { route: 'auth-dialog', file: 'auth-dialog.html' },
      ]),
      runtimeConfig({
        envDir: repoRoot,
        packageJson: resolve(import.meta.dirname, 'package.json'),
        entries: configEntries,
      }),
    ],
    envDir: repoRoot,
    server: { port: serverPort, https: localHttps() },
    preview: { port: serverPort, https: localHttps() },
    build: { outDir: 'dist', sourcemap: true },
  };
});
