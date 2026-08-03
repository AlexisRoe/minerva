# @minerva/button

React + Vite frontend — the lightweight surface, as opposed to the full review UI in
[`@minerva/manager`](../minerva-manager).

Currently thin scaffolding: it renders the shared design system and reports errors to Sentry.

## Port

**<https://localhost:4101>** — the dev server and `vite preview` both bind to this port.

It is set in [`vite.config.ts`](./vite.config.ts) and is deliberately fixed rather than left on
Vite's default `5173`, so this app, `@minerva/manager` (4201), and Storybook (4301) can all run at
the same time without colliding — with each other or with other local projects.

See the [ports overview](../../../README.md#ports) in the root README for the full range.

## Running it

```sh
make dev-button     # from the repo root: builds the ui-lib, then starts this app
pnpm dev            # from this directory: assumes the ui-lib is already built
```

`make dev-button` builds `@minerva/ui-lib` first, because this app imports the library's `dist/`
output rather than its source. Running `pnpm dev` directly skips that step, so a stale or missing
`dist/` shows up as an import error.

## HTTPS

The dev server runs over TLS using the mkcert certificate in `infra/cert/`, loaded by the shared
[`vite.https.ts`](../../../vite.https.ts). Run `make certs` once to generate it.

Without a certificate the server falls back to plain HTTP on the same port and prints a notice —
it does not refuse to boot. Details in the root README under
[HTTPS in development](../../../README.md#https-in-development).

## Scripts

| Script | What it does |
| --- | --- |
| `pnpm dev` | Vite dev server on 4101 |
| `pnpm build` | `tsc --noEmit && vite build` → `dist/` |
| `pnpm preview` | Serve the production build on 4101 |
| `pnpm test` | Vitest (jsdom) |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | Biome |

## Environment variables

There is no `.env` in this directory. [`vite.config.ts`](./vite.config.ts) sets
`envDir` to the repository root, so this app reads the **single repo-root `.env`**
(`make copy-env`) that the backends also use.

Only `VITE_`-prefixed variables are exposed to the browser, which is what makes one shared file
safe: `SENTRY_DSN` sits in the same `.env` and never reaches the bundle, while `VITE_SENTRY_DSN`
does. Dropping a `.env` in *this* directory would override the root one for this app only — usually
not what you want.

Nothing here is required to run locally. Every variable has a working default and Sentry stays
inert while its DSN is empty, so the dev server boots on a checkout with no `.env` at all.

## Notes

- Sentry is initialised in [`src/instrument.ts`](./src/instrument.ts) and stays inert while
  `VITE_SENTRY_DSN` is empty. Only `VITE_`-prefixed variables reach the browser.
- Linting and formatting come from the root `biome.json`; there is no package-level config.
