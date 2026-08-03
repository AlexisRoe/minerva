import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'typescript-lib',
    environment: 'node',
    include: ['src/**/*.spec.ts'],
  },
});
