import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Vite 8 transforms TypeScript with Oxc by default; it has to be turned off
  // explicitly so SWC below is the only transform in play.
  oxc: false,
  plugins: [
    // Nest resolves dependencies from decorator metadata at runtime. Vite's
    // default TypeScript transform does not emit that metadata, so SWC does the
    // transform for the backend tests instead.
    swc.vite({
      module: { type: 'es6' },
      jsc: {
        target: 'es2023',
        parser: { syntax: 'typescript', decorators: true },
        transform: { legacyDecorator: true, decoratorMetadata: true },
      },
    }),
  ],
  test: {
    name: 'api',
    environment: 'node',
    include: ['src/**/*.spec.ts', 'test/**/*.e2e-spec.ts'],
  },
});
