import { existsSync, readdirSync, readFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { basename, extname, join, resolve } from 'node:path';

import type { Plugin } from 'vite';

/**
 * Shared font files for the Vite dev/preview servers and for the builds.
 *
 * The files live once in `shared/assets/fonts/` and belong to no package --
 * `@minerva/ui-lib` names the families in its theme but never ships the bytes.
 * Every project that renders the design system copies them into its own output
 * under `/assets/fonts` instead: the apps through this plugin, Storybook
 * through `staticDirs` in `.storybook/main.ts`.
 *
 * The public path is deliberately stable and unhashed, so the `url()`s in
 * `shared/assets/fonts.css` and the `<link rel="preload">` tags in the apps'
 * index.html keep resolving in dev, preview and production alike.
 */
const FONT_DIR = resolve(import.meta.dirname, 'shared/assets/fonts');
const PUBLIC_PATH = '/assets/fonts';

const CONTENT_TYPES: Record<string, string> = {
  '.otf': 'font/otf',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

/** The font files in `shared/assets/fonts/`, ignoring anything else that lands there. */
function fontFiles(): string[] {
  return readdirSync(FONT_DIR).filter((name) => extname(name) in CONTENT_TYPES);
}

/** Serves the shared fonts under `/assets/fonts` while a dev or preview server is running. */
function serveFonts(req: IncomingMessage, res: ServerResponse, next: () => void): void {
  const [path = ''] = (req.url ?? '').split('?');
  if (!path.startsWith(`${PUBLIC_PATH}/`)) {
    next();
    return;
  }

  // Matching against the directory listing rather than the request keeps a
  // crafted URL from reaching a file outside FONT_DIR.
  const name = basename(path);
  const contentType = CONTENT_TYPES[extname(name)];
  const file = join(FONT_DIR, name);
  if (!contentType || !fontFiles().includes(name) || !existsSync(file)) {
    next();
    return;
  }

  res.setHeader('Content-Type', contentType);
  res.end(readFileSync(file));
}

/**
 * Makes the shared fonts available to a Vite project at `/assets/fonts`, both
 * from the dev/preview servers and in the production build.
 */
export function sharedFonts(): Plugin[] {
  return [
    {
      name: 'minerva:shared-fonts-serve',
      apply: 'serve',
      configureServer(server) {
        server.middlewares.use(serveFonts);
      },
      configurePreviewServer(server) {
        server.middlewares.use(serveFonts);
      },
    },
    {
      name: 'minerva:shared-fonts-build',
      apply: 'build',
      buildStart() {
        for (const name of fontFiles()) {
          // `fileName` rather than `name`: an explicit path opts out of Rollup's
          // content hashing, which is what keeps the preload links valid.
          this.emitFile({
            type: 'asset',
            fileName: `assets/fonts/${name}`,
            source: readFileSync(join(FONT_DIR, name)),
          });
        }
      },
    },
  ];
}
