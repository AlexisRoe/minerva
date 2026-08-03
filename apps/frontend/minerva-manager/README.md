# @minerva/manager

React + Vite frontend — the main review UI for the work items Minerva extracts from email. The
lighter trigger surface lives in [`@minerva/button`](../minerva-button).

Currently thin scaffolding: it renders the shared design system and reports errors to Sentry.

## Port

**<https://localhost:4201>** — the dev server and `vite preview` both bind to this port.

It is set in [`vite.config.ts`](./vite.config.ts) and is deliberately fixed rather than left on
Vite's default `5173`, so this app, `@minerva/button` (4101), and Storybook (4301) can all run at
the same time without colliding — with each other or with other local projects.

See the [ports overview](../../../README.md#ports) in the root README for the full range.

## Running it

```sh
make dev-manager    # from the repo root: builds the ui-lib, then starts this app
pnpm dev            # from this directory: assumes the ui-lib is already built
```

`make dev-manager` builds `@minerva/ui-lib` first, because this app imports the library's `dist/`
output rather than its source. Running `pnpm dev` directly skips that step, so a stale or missing
`dist/` shows up as an import error.

## HTTPS

The dev server runs over TLS using the mkcert certificate in `infra/cert/`, loaded by the shared
[`vite.https.ts`](../../../vite.https.ts). Run `make certs` once to generate it.

Without a certificate the server falls back to plain HTTP on the same port and prints a notice —
it does not refuse to boot. Details in the root README under
[HTTPS in development](../../../README.md#https-in-development).

## PWA

This app is built as an installable progressive web app —
[`@minerva/button`](../minerva-button) is not. `vite build` emits `manifest.webmanifest`,
`sw.js`, and `registerSW.js` alongside the bundle, via
[`vite-plugin-pwa`](https://vite-pwa-org.netlify.app/) configured in
[`vite.config.ts`](./vite.config.ts).

The service worker uses `registerType: 'autoUpdate'`: it fetches a new version in the background
and takes over on the next navigation, so there is no update prompt to build or dismiss.

**It is inactive during `pnpm dev`.** `vite-plugin-pwa` only generates the worker at build time, so
install and offline behaviour have to be checked against `pnpm preview`, not the dev server. Both
run on 4201 over TLS, which is a hard requirement — browsers refuse to register a service worker on
plain HTTP, so `make certs` is a prerequisite for exercising any of this locally.

Icons live in [`public/assets/icons/`](./public/assets/icons) and are referenced twice, for two
different consumers: the `<link rel="icon">` / `<link rel="apple-touch-icon">` tags in
[`index.html`](./index.html) feed the browser tab and iOS home screen, while the `icons` array in
the manifest feeds the install prompt and Android launcher. The manifest carries both `any` and
`maskable` variants at 192 and 512 — without a `maskable` entry Android draws its own white circle
behind the icon instead of cropping it to the launcher's shape. `icon-original-991.png` is the
master the other sizes were cut from; it is referenced by nothing and is excluded from the
precache.

`theme_color` is `#4c6ef5`, which is Mantine's `indigo[6]` — the primary shade of `minervaTheme` in
[`@minerva/ui-lib`](../../../shared/ui-lib). Change it there and here together.

## Content Security Policy

[`index.html`](./index.html) carries a CSP as a `<meta http-equiv>` tag, modelled on the one in
Minerva v1's inspector app. `connect-src` is the part worth knowing about: it allows the API on
`localhost:3000`, the Vite HMR socket on `localhost:4201`, and Sentry's ingest hosts. A call to
anything else is blocked by the browser, not by a config error somewhere — check this list first
when a request fails for no visible reason.

The policy is strict about scripts (`script-src 'self'`, no inline). React Fast Refresh injects its
preamble as an inline module script, so a small `apply: 'serve'` plugin in
[`vite.config.ts`](./vite.config.ts) adds `'unsafe-inline'` **for the dev server only** — the built
`dist/index.html` keeps `script-src 'self'`.

`connect-src` lists `localhost:3000` under both `http:` and `https:`. The API currently serves plain
HTTP while this app serves HTTPS, and browsers block that mix regardless of CSP; putting TLS on the
Nest bootstrap is the actual fix and has not been done yet.

## Scripts

| Script | What it does |
| --- | --- |
| `pnpm dev` | Vite dev server on 4201 |
| `pnpm build` | `tsc --noEmit && vite build` → `dist/` |
| `pnpm preview` | Serve the production build on 4201 |
| `pnpm test` | Vitest (jsdom) |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | Biome |

## Environment variables

There is no `.env` in this directory. [`vite.config.ts`](./vite.config.ts) sets
`envDir` to the repository root, so this app reads the **single repo-root `.env`**
(`make copy-env`) that the backends also use.

Settings are **not** baked into the bundle. [`config.entries.ts`](./config.entries.ts) lists the
variables the browser is allowed to see (`APP_FE_MANANGER_SENTRY_DSN`,
`APP_FE_MANANGER_SENTRY_TRACES_SAMPLE_RATE`), and the `runtimeConfig()` plugin in
[`vite.runtime-config.ts`](../../../vite.runtime-config.ts) publishes just those as `/config.json`
next to the build. Anything not listed there stays out of the browser, which is what makes one
shared `.env` safe — and it means the same artefact can be promoted between environments, since a
new DSN is a new `config.json`, not a new build. Dropping a `.env` in *this* directory would
override the root one for this app only — usually not what you want.

Nothing here is required to run locally. Every variable has a working default and Sentry stays
inert while its DSN is empty, so the dev server boots on a checkout with no `.env` at all. The dev
server rebuilds `/config.json` per request, so editing the root `.env` needs a reload, not a restart.

## Notes

- [`src/config/`](./src/config) owns the runtime configuration: `main.tsx` fetches it with
  `loadConfig()`, hands it to the Sentry adapter and mounts `ConfigProvider`; components read it
  through `useConfig()`. Sentry stays inert while `sentryDsn` is `null`. The document is
  deliberately kept out of the workbox precache, so an installed PWA still reads live settings.
- The fetch is a network round trip, so [`index.html`](./index.html) ships a CSS-only splash
  (`public/boot-loader.css`, a port of the ui-lib `SimpleLoader`) that the first render replaces,
  plus a `<noscript>` message.
- [`src/sentry/`](./src/sentry) is the only place `@sentry/react` is imported. Use `initSentry()`,
  `SentryErrorBoundary`, `captureError()` and `setTag()` from there — `initSentry()` also tags every
  event with the app name, version, build time and mode from the runtime config.
- [`src/store/`](./src/store) holds the Zustand stores. `error-log` keeps the last 25 errors in
  `localStorage` (newest first, oldest evicted) — written by `captureError()`, read with
  `useErrorLog()`. It is the copy that survives when Sentry is off and no console is reachable,
  and it is what a debug page will render.
- Errors are `MinervaError` subclasses from [`src/errors/`](./src/errors) — never bare `Error`.
  `errors.registry.ts` lists every `ERR_xxx` code in use; take the next free one there, and
  generate the class's fixed `reference` uuid with `uuidgen` (it identifies the throw site).
- Linting and formatting come from the root `biome.json`; there is no package-level config.
