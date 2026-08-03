# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Minerva turns incoming email into structured, reviewable work items. `README.md` holds the long form:
ports, HTTPS setup, the pre-push hook, and ADR. Packages may add their own `CLAUDE.md` for
package-specific commands and conventions — `shared/ui-lib/CLAUDE.md` does.

## Structure

```
apps/backend/api                 @minerva/api                NestJS :3000
apps/backend/queue-coordinator   @minerva/queue-coordinator  NestJS :3001
apps/backend/worker-email-*      Python — outside the pnpm workspace
apps/frontend/minerva-manager    @minerva/manager            React + Vite :4201
apps/frontend/minerva-button     @minerva/button             React + Vite :4101
shared/typescript-lib            @minerva/typescript-lib     contracts, env, Result, use-cases
shared/ui-lib                    @minerva/ui-lib             design system (Mantine + Tabler)
shared/python-lib                Python — outside the pnpm workspace
infra/ scripts/ bruno/ documentation/
```

## Commands

**The Makefile is the interface** — don't call `npx` or the underlying binaries directly.

| Command                                                                | What it does                                                        |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `make verify`                                                          | lint → typecheck → test. The gate before any commit.                |
| `make test` / `make typecheck` / `make lint` / `make format`           | Individually.                                                       |
| `make build`                                                           | All packages, in dependency order.                                  |
| `make build-libs`                                                      | `typescript-lib` + `ui-lib` only.                                   |
| `make dev` / `make dev-manager` / `make dev-button` / `make storybook` | Watch modes.                                                        |
| `make verify-i18n`                                                     | Translation catalogues (JSON validity, missing/stale/unknown keys). |

`make help` lists everything, including one-time setup (`setup`, `copy-env`, `certs`).

Narrow the loop with pnpm filters: `pnpm --filter @minerva/api test <path-filter>`, or
`test -t "<test name>"` for a single test.

**Install only via pnpm** (`pnpm add`, `pnpm pkg set`) — never hand-write a version string. Shared
versions live in the `catalog:` in `pnpm-workspace.yaml` (`catalogMode: strict`, `saveExact: true`);
depend on `catalog:` or `workspace:*`.

**Git:** commit or push only when asked. The husky `pre-push` hook runs the whole gate; if it makes a
`chore: apply biome formatting` commit it exits non-zero by design — push again.

## Rules

- **Build shared libs after changing them.** Consumers resolve `shared/**` through gitignored `dist/`,
  so `make build-libs` (or `make typecheck`, which does it) before anything downstream is trusted.
- **Every method gets tests** in a sibling `*.test.ts` / `*.test.tsx` (backend e2e: `*.e2e-test.ts`).
- **Files are named for what they contain:** `*.hook.ts`, `*.component.tsx`, `*.module.ts`,
  `*.service.ts`, `*.use-case.ts`, `*.util.ts`, `*.store.ts`, `*.provider.tsx`, `*.error.ts`.
  Files and directories are kebab-case; the export inside is PascalCase/camelCase.
- **Every method, interface and type gets JSDoc** saying what it is for or represents. Methods carry
  at least one `@example`. Link `@see <url>` for any external library used, and for anything that is
  not common knowledge (Office.js, Microsoft Graph, Valkey streams).
- **The ui-lib is the only package allowed to import `@mantine/*` and `@tabler/icons-react`.** Apps go
  through `@minerva/ui-lib`, `/primitives`, `/hooks`, `/icons`, `/styles.css`. pnpm's non-flat
  `node_modules` makes a direct import fail to resolve — if a change needs one, it is the wrong change.
- **Cross-service payloads live in `@minerva/typescript-lib`**, so a contract change breaks the build
  on both sides rather than at runtime.
- **Biome rules differ by runtime on purpose** (backend needs parameter decorators and mutable
  imports for Nest DI; frontend enforces `useImportType` and a11y). Change `biome.json`'s `lineWidth`
  and `.editorconfig`'s `max_line_length` together.
