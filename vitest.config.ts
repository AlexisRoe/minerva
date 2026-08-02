import { defineConfig } from 'vitest/config';

/**
 * Runs every package's suite in one pass. Each project keeps its own config so
 * `pnpm test` at the root and `pnpm test` inside a package behave identically —
 * the backends transform with SWC in a node environment, the React packages run
 * in jsdom.
 */
export default defineConfig({
  test: {
    projects: [
      'apps/backend/api',
      'apps/backend/queue-coordinator',
      'apps/frontend/minerva-manager',
      'apps/frontend/minerva-button',
      'shared/ui-lib',
      'shared/typescript-lib',
    ],
  },
});
