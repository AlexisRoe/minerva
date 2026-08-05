# @minerva/button

React + Vite frontend — the Outlook task pane a user reports a suspicious message from, as
opposed to the full review UI in [`@minerva/manager`](../minerva-manager).

It is an Office web add-in for Outlook versions new enough for the Graph API (Azure O365):
Office.js for the host, MSAL for the Entra token, Graph for the message, and the Minerva API
for the report itself. `CLAUDE.md` in this directory holds the source layout and the
conventions; this file is the operational side.

## Port

**<https://localhost:4101>** — the dev server and `vite preview` both bind to this port.

It comes from `APP_FE_RB_PORT` in the root `.env`, falling back to `4101`
([`vite.config.ts`](./vite.config.ts)). It is deliberately fixed rather than left on Vite's
default `5173`, so this app, `@minerva/manager` (4201) and Storybook (4301) can all run at the
same time without colliding — with each other or with other local projects.

See the [ports overview](../../../README.md#ports) in the root README for the full range.

## Running it

```sh
make dev-button     # from the repo root: builds the ui-lib, then starts this app
pnpm dev            # from this directory: assumes the ui-lib is already built
```

`make dev-button` builds `@minerva/ui-lib` first, because this app imports the library's `dist/`
output rather than its source. Running `pnpm dev` directly skips that step, so a stale or missing
`dist/` shows up as an import error.

The pane only reaches its real screens inside Outlook, where the `Office` global exists. For
everything else there is **demo mode**: `?demo=true`, allowed only where the deployment sets
`APP_FE_RB_ALLOW_DEMO`, swaps all three adapters (Office, Graph, Minerva) for in-memory
doubles at once — see [`src/adapters/create-adapters.util.ts`](./src/adapters/create-adapters.util.ts).

## HTTPS

The dev server runs over TLS using the mkcert certificate in `infra/cert/`, loaded by the shared
[`vite.https.ts`](../../../vite.https.ts). Run `make certs` once to generate it.

Without a certificate the server falls back to plain HTTP on the same port and prints a notice —
it does not refuse to boot. Details in the root README under
[HTTPS in development](../../../README.md#https-in-development). Outlook will not load an
add-in over plain HTTP, so sideloading needs the certificate.

## Sideloading

[`manifest/`](./manifest) holds two add-in manifests: `manifest.local.xml`, pointing at
`https://localhost:4101` and ready to sideload against a running dev server, and
`manifest.example.xml`, the deployment template whose `{{deployed-domain}}` and support-URL
placeholders are filled per environment. The `<Id>` is the add-in's identity and must match the
`entraClientId` registration the token is brokered through — changing one means changing both.

## Pages

The app ships three HTML entry points, the two extra ones registered through
[`vite.pages.ts`](../../../vite.pages.ts):

| Page | Route | What it is |
| --- | --- | --- |
| [`index.html`](./index.html) | `/` | The task pane itself. |
| [`auth-dialog.html`](./auth-dialog.html) | `/auth-dialog` | The fallback sign-in window. |
| [`support.html`](./support.html) | `/support` | Static support page, linked from the add-in UI. |

`/auth-dialog` exists for clients without Nested App Authentication. Where NAA is available the
Office host brokers the token in place; where it is not, Office opens this page as a real
top-level window through `displayDialogAsync`, redirects it to Entra and back, and it relays
exactly one message — success or failure — to the waiting pane via `messageParent`. See
[`src/auth-dialog/`](./src/auth-dialog).

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

Settings are **not** baked into the bundle. [`config.entries.ts`](./config.entries.ts) lists the
variables the browser is allowed to see — the Sentry DSN and traces sample rate, the app domain,
the demo-mode switch and the Entra client id — and the `runtimeConfig()` plugin in
[`vite.runtime-config.ts`](../../../vite.runtime-config.ts) publishes just those as `/config.json`
next to the build, adding the app name, version, build time and mode itself. Anything not listed
there stays out of the browser, which is what makes one shared `.env` safe — and it means the same
artefact can be promoted between environments, since a new DSN is a new `config.json`, not a new
build. Adding a setting means a line in `config.entries.ts` and a line in `.env.template`.
Dropping a `.env` in *this* directory would override the root one for this app only — usually not
what you want.

Nothing here is required to run locally. Every variable has a working default and Sentry stays
inert while its DSN is empty, so the dev server boots on a checkout with no `.env` at all. The dev
server rebuilds `/config.json` per request, so editing the root `.env` needs a reload, not a restart.

Two settings are not environment variables but query parameters, read in the same step by
[`loadConfig()`](./src/platform/config/utils/load-config.util.ts): `?retry=<n>` sets the retry
budget and `?demo=true` requests demo mode (granted only if the deployment allows it).

## Notes

- [`src/platform/config/`](./src/platform/config) owns the runtime configuration: `main.tsx`
  fetches it with `loadConfig()`, hands it to the Sentry adapter and mounts `ConfigProvider`;
  components read it through `useConfig()`. Sentry stays inert while `sentryDsn` is `null`.
- The fetch is a network round trip, so [`index.html`](./index.html) ships a CSS-only splash
  (`public/boot-loader.css`, a port of the ui-lib `SimpleLoader`) that the first render replaces,
  plus a `<noscript>` message. [`src/platform/boot/`](./src/platform/boot) puts it away, or
  replaces it with the document's own failure markup when the bootstrap never gets that far.
- `main.tsx` mounts two error boundaries on purpose. `MinervaErrorBoundary` sits below every
  provider, so its `ErrorScreen` fallback has a theme, a translator and a config to render
  against; `RootErrorBoundary` sits above them and catches what the inner one cannot see —
  a provider throwing — where it can only reveal the document's failure markup.
- [`src/platform/sentry/`](./src/platform/sentry) is the only place `@sentry/react` is imported.
  Use `initSentry()`, the boundaries, `captureError()` and `setTag()` from there — `initSentry()`
  also tags every event with the app name, version, build time and mode from the runtime config.
- [`src/stores/`](./src/stores) holds the Zustand stores: `session`, `report` and `error-log`.
  `error-log` keeps the last 25 errors in `localStorage` (newest first, oldest evicted) — written
  by `captureError()`, read with `useErrorLog()`. It is the copy that survives when Sentry is off
  and no console is reachable, and it is what a debug page will render.
- Errors are `MinervaError` subclasses from [`src/domain/errors/`](./src/domain/errors) — never
  bare `Error`. `errors.registry.ts` maps every `ERR_xxx` code to its class, its translation key
  and the screen it produces; take the next free code there, and generate the class's fixed
  `reference` uuid with `uuidgen` (it identifies the throw site).
- User-facing strings live in the i18next catalogues under
  [`src/platform/i18n/locales/`](./src/platform/i18n/locales) — seven languages, checked by
  `make verify-i18n`.
- Linting and formatting come from the root `biome.json`; there is no package-level config.
