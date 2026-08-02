import { resolve } from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: true,
    lib: {
      // One entry per public subpath. The keys mirror the source layout, so the
      // bundles land next to the declaration files `tsc` emits from src/export;
      // the `exports` map in package.json publishes them under flat subpaths
      // (`@minerva/ui-lib/icons`, not `.../export/icons`).
      entry: {
        index: resolve(import.meta.dirname, 'src/index.ts'),
        'export/primitives': resolve(import.meta.dirname, 'src/export/primitives.ts'),
        'export/hooks': resolve(import.meta.dirname, 'src/export/hooks.ts'),
        'export/icons': resolve(import.meta.dirname, 'src/export/icons.ts'),
      },
      formats: ['es'],
      cssFileName: 'styles',
    },
    rollupOptions: {
      // Everything the consuming app already owns stays out of the bundle, so
      // there is exactly one React and one Mantine instance at runtime.
      // Stylesheets are the exception: the apps do not depend on Mantine, so
      // its CSS has to be bundled into `dist/styles.css`.
      external: (id) => {
        if (id.endsWith('.css')) {
          return false;
        }
        return (
          ['react', 'react-dom', 'react/jsx-runtime'].includes(id) ||
          id.startsWith('@mantine/') ||
          id.startsWith('@tabler/')
        );
      },
    },
  },
});
