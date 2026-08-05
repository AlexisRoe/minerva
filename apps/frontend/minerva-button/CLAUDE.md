# CLAUDE.md

`@minerva/button` — the Outlook task pane. The root `CLAUDE.md` covers commands, package
management and the repo-wide rules; only what is specific to this app is below.
`README.md` in this directory is the long form: port, HTTPS, runtime config and `.env`.

An Office add-in for Outlook versions new enough for the Graph API (Azure O365), letting a
user report a suspicious message to their security department. React + react-router,
Office.js, MSAL/NAA plus a session cookie, Zustand, i18next, Sentry.

```bash
make dev-button                                    # builds ui-lib, then serves https://localhost:4101
pnpm --filter @minerva/button test report.store    # single file
```

## Layout

Imports are absolute from `@/*` (→ `src/*`); relative only inside a feature directory.

- `adapters/` — everything that talks to the outside: `office/`, `graph/`, `minerva/`.
  `create-adapters.util.ts` assembles the set; its identity is stable for the pane's
  lifetime, which is what makes loaders memoisable on it.
- `domain/` — logic that is Minerva's, not a platform's: `errors/`, `reporting/`.
- `platform/` — cross-cutting wiring: `boot/`, `config/`, `i18n/`, `sentry/`.
- `stores/` — one directory per Zustand store (`session`, `report`, `error-log`), each with
  its `.types.ts` and its `hooks/`. Components read stores through those hooks, never directly.
- `loaders/`, `views/`, `components/`, `hooks/`, `constants/`, `fixtures/`.

`App.tsx` is a `MemoryRouter` with declarative routes and nothing else — the pane has no
address bar and Outlook strips `window.history` from the frame. Paths live in
`constants/routes.constants.ts`; the long waits belong to `AsyncLoading`, not to router
loaders, so every failure lands in the `MinervaErrorBoundary` that `main.tsx` mounts.

## Conventions

- **No TypeScript enums.** `tsconfig.web.json` sets `erasableSyntaxOnly` and
  `verbatimModuleSyntax`: use a frozen object plus a same-named type (see `ErrorScreenKind`),
  and `import type` for types. There is no `*.enum.ts`.
- **Errors are `MinervaError` subclasses** from `domain/errors/`, grouped by area
  (`auth`, `config`, `office`, `request`, `session`, `reporting`). Every class is listed in
  `errors.registry.ts` with its `ERR_xxx` code, its translation key and its screen kind —
  take the next free code there, and generate the class's fixed `reference` uuid with
  `uuidgen`. The registry is what lets one error screen decide between "this failed" and
  "you are in the wrong place", so a new error means a registry entry, not a new view.
- **Sentry is imported in `platform/sentry/` only.** Use `initSentry()`, `captureError()`,
  `setTag()` and the boundaries from there. `captureError()` also writes the `error-log`
  store (last 25, `localStorage`) — the copy that survives when the DSN is empty and no
  console is reachable.
- **No user-facing string in a component.** Translate through `platform/i18n/`; the
  catalogues in `platform/i18n/locales/` are checked by `make verify-i18n`.
- **Configuration is fetched, not bundled.** Read it with `useConfig()`; anything the browser
  may see must be listed in `config.entries.ts` (see the README).
- **No magic values** — constants in `constants/*.constants.ts`, near-code types in
  `*.types.ts`.
- **Components stay declarative and controlled**: props in, callbacks out, side effects in a
  `*.hook.ts` or an adapter.
- **Fixtures over ad-hoc mocks** — `fixtures/` has the Office, session, config and adapter
  doubles the tests share.
