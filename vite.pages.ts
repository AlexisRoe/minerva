import type { IncomingMessage, ServerResponse } from 'node:http';

import type { Plugin } from 'vite';

/**
 * Extra HTML pages, served under an extension-less URL.
 *
 * Vite's multi-page build emits an entry named `support.html` as exactly that,
 * so the page would only answer on `/support.html`. Each page is re-emitted as
 * `<route>/index.html` instead, which every static host resolves for a request
 * to `/<route>` without needing a rewrite rule. The dev and preview servers get
 * the same mapping through a middleware, so a link works identically in all
 * three.
 */
export interface ExtraPage {
  /** URL path the page answers on, without the leading slash, e.g. `support`. */
  route: string;
  /** The source HTML, relative to the Vite root, e.g. `support.html`. */
  file: string;
}

/** Strips the query and any trailing slash, so `/support/?x=1` matches `support`. */
function routeOf(url: string): string {
  const [path = ''] = url.split('?');
  return path.replace(/^\/+/, '').replace(/\/+$/, '');
}

export function extraPages(pages: readonly ExtraPage[]): Plugin {
  // In dev nothing is built yet, so the request is rewritten to the source HTML
  // and Vite's own transform pipeline serves it. In preview the built
  // `<route>/index.html` is on disk already.
  const rewrite =
    (target: (page: ExtraPage) => string) =>
    (req: IncomingMessage, _res: ServerResponse, next: () => void): void => {
      const page = pages.find((candidate) => candidate.route === routeOf(req.url ?? ''));
      if (page) {
        req.url = target(page);
      }
      next();
    };

  return {
    name: 'minerva:extra-pages',
    // After Vite's own `vite:build-html`, which is what puts the HTML assets
    // into the bundle this hook renames.
    enforce: 'post',
    config: () => ({
      build: {
        rollupOptions: {
          input: Object.fromEntries([['index', 'index.html'], ...pages.map((page) => [page.route, page.file])]),
        },
      },
    }),
    configureServer(server) {
      server.middlewares.use(rewrite((page) => `/${page.file}`));
    },
    configurePreviewServer(server) {
      server.middlewares.use(rewrite((page) => `/${page.route}/index.html`));
    },
    generateBundle(_options, bundle) {
      for (const page of pages) {
        const asset = bundle[page.file];
        if (asset?.type !== 'asset') {
          continue;
        }
        // Re-emitting rather than reassigning `bundle[...]`: Rolldown ignores
        // writes to the bundle object, but honours `delete` and `emitFile`.
        delete bundle[page.file];
        this.emitFile({
          type: 'asset',
          fileName: `${page.route}/index.html`,
          source: asset.source,
        });
      }
    },
  };
}
