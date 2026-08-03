import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The output directories of the dual build, mapped to the module system Node
 * (and Vite) should read the `.js` files in them as.
 */
const MARKERS = {
  cjs: 'commonjs',
  esm: 'module',
};

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Drops a one-line `package.json` into each `dist/*` directory so the plain
 * `.js` extension is unambiguous. Without the `{"type":"module"}` marker in
 * `dist/esm`, Node and Vite fall back to the package root — which has no
 * `type` field and therefore means CommonJS — and every named export in the
 * ESM build disappears at runtime.
 *
 * @example
 * // node ./scripts/write-dist-markers.mjs
 * // -> dist/cjs/package.json {"type":"commonjs"}
 * // -> dist/esm/package.json {"type":"module"}
 */
async function writeDistMarkers() {
  await Promise.all(
    Object.entries(MARKERS).map(async ([directory, type]) => {
      const target = resolve(packageRoot, 'dist', directory);
      await mkdir(target, { recursive: true });
      await writeFile(resolve(target, 'package.json'), `${JSON.stringify({ type }, null, 2)}\n`, 'utf8');
    }),
  );
}

await writeDistMarkers();
