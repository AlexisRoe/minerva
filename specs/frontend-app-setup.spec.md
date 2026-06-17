# Frontend Application — Technical Specification

> **Status:** Draft v2 · **Last updated:** 2026-06-17
> A Progressive Web App (installable), built as a single-page React application, containerized for local development with hot-reload, configured at runtime, and structured according to **Feature-Sliced Design**.

---

## 0. Prerequisites (hard requirements)

These are non-negotiable acceptance gates. The build is not "done" unless all hold.

- **PWA is mandatory.** The application **must** be installable as a Progressive Web App: a valid Web App Manifest, a registered service worker (auto-update), installability on desktop and mobile, and a working offline app shell. A build that does not pass an installability audit is rejected.
- **Static assets live under `/assets`.** All bundled and served static assets (icons, images, fonts, locale JSON) are served from the `/assets` path. The only root-served file is the runtime `config.json`.
- **Node:** the project runs on the **latest Active LTS**, pinned exactly (see §2).
- **All dependency versions are pinned** (exact, no ranges) and reproduced from the lockfile via a hardened install command (see §13).
- **No `index.ts` barrels.** Modules are imported directly from their source file.

---

## 1. Goals & Constraints

| Requirement | Decision |
|---|---|
| Installable PWA (**prerequisite**) | `vite-plugin-pwa` (manifest + service worker, auto-update) |
| Build tool | Vite |
| Test runner | Vitest (with coverage, exclusions configured) |
| Lint + format | BiomeJS (single tool, replaces ESLint + Prettier); auto-formats `.ts`/`.tsx` |
| Language | TypeScript 6 (`strict`, new 6.0 defaults) |
| Node version management | `nvm` via committed `.nvmrc`, pinned to latest LTS |
| Static analysis / SAST | Semgrep (CI + pre-commit) |
| Supply-chain hardening | LavaMoat `@lavamoat/allow-scripts` + hardened `.npmrc` + `install:secure` |
| Git hooks | Husky — lint + tests before push, auto-commit of linted files |
| UI library | Mantine UI |
| Mantine extras | `@mantine/notifications`, tables, `@tabler/icons-react` |
| Server state | TanStack Query (React Query) |
| Routing | React Router (data router) |
| Error / perf monitoring | Sentry |
| i18n | Multi-language, English default |
| Theming | Light + dark (system-aware) |
| Runtime config | Loaded from a JSON file at boot |
| Build-time metadata | App name, build version, build timestamp injected by Vite |
| Local dev | Docker + hot-reload (HMR) |
| Architecture | **Feature-Sliced Design (FSD)** |
| Editor config | VS Code workspace config committed |
| Static assets path | `/assets` |
| File naming | `kebab-case` |
| File role suffixes | `.component`, `.hook`, `.page`, `.test`, etc. |
| Module imports | Direct file imports — **no `index.ts` barrels** |
| Logic placement | All business logic in hooks; components controlled where possible |

### Non-goals
- No SSR / server framework. This is a static SPA artifact (build once, configure per environment via runtime JSON). React Router is used purely as a client-side data router.

---

## 2. Toolchain & Pinned Versions

**All versions are pinned exactly** (the lockfile + `save-exact` in `.npmrc` enforce this). The versions below are current as of 2026-06-17.

### Node

- **Latest Active LTS: Node.js `24.15.0`** (Node 26 is still "Current" until Oct 2026, so 24 is the LTS line).

```
# .nvmrc
24.15.0
```

> `engine-strict=true` in `.npmrc` + an `engines.node` field in `package.json` reject mismatched Node versions at install time.

### Dependencies (exact pins)

| Package | Pinned version |
|---|---|
| `typescript` | `6.0.3` |
| `vite` | `8.0.16` |
| `@vitejs/plugin-react` | `6.0.2` |
| `vite-plugin-pwa` | `1.3.0` |
| `vitest` | `4.1.9` |
| `@vitest/coverage-v8` | `4.1.9` |
| `@biomejs/biome` | `2.5.0` |
| `react` | `19.2.7` |
| `react-dom` | `19.2.7` |
| `react-router` | `7.18.0` |
| `@tanstack/react-query` | `5.101.0` |
| `@tanstack/react-query-devtools` | `5.101.0` |
| `@mantine/core` | `9.3.2` |
| `@mantine/hooks` | `9.3.2` |
| `@mantine/notifications` | `9.3.2` |
| `@mantine/dates` *(optional)* | `9.3.2` |
| `mantine-datatable` | `9.3.0` |
| `@tabler/icons-react` | `3.44.0` |
| `@sentry/react` | `10.58.0` |
| `i18next` | `26.3.1` |
| `react-i18next` | `17.0.8` |
| `i18next-http-backend` | `4.0.0` |
| `i18next-browser-languagedetector` | `8.2.1` |
| `axios` *(or `ofetch`)* | `1.18.0` |
| `@lavamoat/allow-scripts` | `5.0.2` |
| `@lavamoat/preinstall-always-fail` | `3.0.0` |
| `husky` | `9.1.7` |
| `lint-staged` | `17.0.7` |

> Mantine 9 requires React 19.2+. TypeScript 6.0 removed the ES5 target and changed several compiler defaults — reconcile `tsconfig` against the 6.0 migration notes.

---

## 3. Architecture — Feature-Sliced Design

FSD is the chosen industry-standard structure. It defines a fixed set of **layers** (top→bottom), each composed of **slices** (business domains), each composed of **segments** (technical purpose: `ui`, `model`, `api`, `lib`, `config`).

**The Golden Rule:** a module may only import from layers *strictly below* it. Same-layer cross-slice imports are forbidden; share via a lower layer (`shared` or `entities`).

```
app → pages → widgets → features → entities → shared
```

| Layer | Purpose | Typical contents |
|---|---|---|
| `app` | App-wide setup, providers, router, global styles | Providers, root router, theme, i18n init, Sentry init |
| `pages` | Route-level compositions | `*.page.tsx` components |
| `widgets` | Self-contained composite UI blocks | Headers, sidebars, data panels |
| `features` | User interactions that carry business value | "edit profile", "filter table" — logic in hooks |
| `entities` | Business domain models | `user`, `order` — domain hooks, types, API |
| `shared` | Reusable, domain-agnostic foundation | UI kit, config, lib, api client, i18n |

### Deviation from textbook FSD: no barrels

Canonical FSD exposes each slice through an `index.ts` "public API." **This project forbids `index.ts` barrels** (per requirement) and uses **direct file imports** instead. Slice boundaries are therefore enforced by lint/architecture rules and the layer import direction, not by a barrel. Import the exact file you need (e.g. `@features/user-table/model/use-user-table.hook`), never a folder.

### Where logic lives
- **Hooks own all business logic.** A component never fetches, mutates, derives, or branches on business rules inline — it calls a hook (`use-*.hook.ts`) and renders the result.
- **Components are controlled where possible.** Inputs/selects/etc. receive `value` + `onChange` from their parent (or from a feature hook). Uncontrolled patterns are reserved for genuinely local, throwaway UI state.
- **TanStack Query lives in `entities/*/api` and `features/*/model`** behind domain hooks (e.g. `use-user.hook.ts`), never called directly from a `.page`/`.component`.

---

## 4. Directory Layout

Static assets live under `public/assets/` so they are served at `/assets/...`. The runtime `config.json` is the only root-served file. **There are no `index.ts` files.**

```
.
├─ .nvmrc                          # 24.15.0
├─ .npmrc                          # hardened, secure defaults (see §13)
├─ biome.json
├─ tsconfig.json
├─ tsconfig.node.json
├─ vite.config.ts
├─ vitest.config.ts
├─ package.json
├─ .lintstagedrc.json
├─ .semgrep.yml
├─ Dockerfile
├─ Dockerfile.dev
├─ docker-compose.yml
├─ .dockerignore
├─ .env.example
├─ index.html
│
├─ .husky/
│  ├─ pre-commit                   # lint-staged: auto-format & restage ts/tsx
│  └─ pre-push                     # full lint + tests; auto-commit linted files
│
├─ .vscode/
│  ├─ settings.json
│  ├─ extensions.json
│  └─ launch.json
│
├─ public/
│  ├─ config.json                  # RUNTIME config — root-served, swapped per environment
│  └─ assets/                      # ALL static assets, served at /assets
│     ├─ icons/                    # PWA icons (192, 512, maskable)
│     ├─ images/
│     ├─ fonts/
│     ├─ favicon.svg
│     └─ locales/                  # i18n resources (http-backend)
│        ├─ en/translation.json
│        └─ de/translation.json
│
└─ src/
   ├─ app/
   │  ├─ providers/
   │  │  ├─ app-providers.component.tsx
   │  │  ├─ query-client.config.ts
   │  │  ├─ theme.config.ts                 # Mantine theme (light/dark tokens)
   │  │  ├─ i18n.config.ts
   │  │  └─ sentry.config.ts
   │  ├─ router/
   │  │  └─ app-router.config.tsx           # createBrowserRouter
   │  ├─ runtime-config/
   │  │  ├─ runtime-config.type.ts
   │  │  ├─ load-runtime-config.ts          # fetch /config.json at boot
   │  │  └─ use-runtime-config.hook.ts
   │  ├─ build-info/
   │  │  └─ build-info.const.ts             # reads Vite-injected defines
   │  ├─ styles/
   │  │  └─ global.css
   │  └─ main.tsx                           # entrypoint (boot → config → render)
   │
   ├─ pages/
   │  ├─ home/
   │  │  ├─ home.page.tsx
   │  │  └─ home.page.test.tsx
   │  └─ not-found/
   │     └─ not-found.page.tsx
   │
   ├─ widgets/
   │  └─ app-shell/
   │     ├─ app-shell.component.tsx
   │     ├─ language-switcher.component.tsx
   │     └─ theme-toggle.component.tsx
   │
   ├─ features/
   │  └─ user-table/
   │     ├─ ui/
   │     │  └─ user-table.component.tsx     # controlled, presentational
   │     └─ model/
   │        ├─ use-user-table.hook.ts       # all logic here
   │        └─ user-table.type.ts
   │
   ├─ entities/
   │  └─ user/
   │     ├─ api/
   │     │  ├─ user.api.ts                  # raw fetch fns
   │     │  └─ use-users.hook.ts            # useQuery wrapper
   │     └─ model/
   │        └─ user.type.ts
   │
   └─ shared/
      ├─ api/
      │  ├─ http-client.ts                  # axios instance, base URL from runtime config
      │  └─ query-keys.ts
      ├─ ui/
      │  ├─ data-table/
      │  │  └─ data-table.component.tsx
      │  └─ notification/
      │     └─ notify.ts                    # thin wrapper over @mantine/notifications
      ├─ config/
      │  └─ constants.const.ts
      ├─ lib/
      │  ├─ i18n/
      │  │  └─ use-translation.hook.ts
      │  └─ test/
      │     └─ render-with-providers.tsx    # test utility
      └─ types/
         └─ global.d.ts
```

> Note: no `index.ts` anywhere. Every import is a direct path to a concrete file.

---

## 5. File Naming & Conventions

- **All file and folder names:** `kebab-case`. No `PascalCase` or `camelCase` filenames.
- **No barrel files.** `index.ts` is prohibited. Import the concrete file directly (e.g. `import { useUsers } from "@entities/user/api/use-users.hook"`).
- **Role suffix is mandatory** and encodes the file's purpose:

| Suffix | Meaning | Example |
|---|---|---|
| `.component.tsx` | React component (presentational / controlled) | `user-table.component.tsx` |
| `.page.tsx` | Route-level component | `home.page.tsx` |
| `.hook.ts` | Hook holding business logic | `use-user-table.hook.ts` |
| `.api.ts` | Network access functions | `user.api.ts` |
| `.type.ts` | Type / interface declarations | `user.type.ts` |
| `.config.ts(x)` | Setup / configuration module | `theme.config.ts` |
| `.const.ts` | Constants | `build-info.const.ts` |
| `.test.ts(x)` | Vitest unit/component test (co-located) | `home.page.test.tsx` |
| `.store.ts` | Client-state store (only if introduced) | `ui.store.ts` |

- **Hook files** export exactly one primary hook named `useXxx`. Component files export one component named `Xxx` matching the kebab base.
- **Imports** are ordered & grouped automatically by Biome's import organizer; cross-slice imports reference the specific target file directly and must respect the FSD layer direction.

---

## 6. TypeScript 6 Config

`tsconfig.json` (illustrative — reconcile with TS 6.0 default changes; ES5 target no longer exists):

```jsonc
{
  "compilerOptions": {
    "target": "ES2023",
    "lib": ["ES2024", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "noEmit": true,
    "baseUrl": "./src",
    "paths": {
      "@app/*":      ["app/*"],
      "@pages/*":    ["pages/*"],
      "@widgets/*":  ["widgets/*"],
      "@features/*": ["features/*"],
      "@entities/*": ["entities/*"],
      "@shared/*":   ["shared/*"]
    }
  },
  "include": ["src", "vite.config.ts", "vitest.config.ts"]
}
```

> Path aliases point at files (not folders, since there are no barrels) and must be mirrored in `vite.config.ts` (`resolve.alias`) and recognized by Biome/Vitest.

---

## 7. Vite Configuration

Responsibilities: dev server + HMR, PWA (**mandatory**), `/assets` output path, path aliases, and **build-time metadata injection**.

```ts
// vite.config.ts (illustrative)
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { execSync } from "node:child_process";
import pkg from "./package.json";

const buildVersion =
  process.env.BUILD_VERSION ??
  (() => { try { return execSync("git describe --tags --always").toString().trim(); }
           catch { return pkg.version; } })();

export default defineConfig({
  publicDir: "public",        // public/assets -> served at /assets
  resolve: { alias: { /* mirror tsconfig paths */ } },
  define: {
    __APP_NAME__: JSON.stringify(pkg.name),
    __APP_VERSION__: JSON.stringify(buildVersion),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  build: {
    assetsDir: "assets",      // hashed build output also emitted under /assets
  },
  server: {
    host: true,               // bind 0.0.0.0 so Docker can expose it
    port: 5173,
    watch: { usePolling: true }, // reliable HMR inside containers
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["assets/favicon.svg", "assets/icons/*"],
      manifest: {
        name: pkg.name,
        short_name: pkg.name,
        theme_color: "#ffffff",
        display: "standalone",
        icons: [
          { src: "/assets/icons/192.png", sizes: "192x192", type: "image/png" },
          { src: "/assets/icons/512.png", sizes: "512x512", type: "image/png" },
          { src: "/assets/icons/maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // Do NOT precache config.json — it must be fetched fresh per environment.
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        navigateFallbackDenylist: [/^\/config\.json$/],
      },
    }),
  ],
});
```

Build-time globals are declared in `shared/types/global.d.ts`:

```ts
declare const __APP_NAME__: string;
declare const __APP_VERSION__: string;
declare const __BUILD_TIME__: string;
```

And surfaced via `app/build-info/build-info.const.ts`:

```ts
export const BUILD_INFO = {
  appName: __APP_NAME__,
  version: __APP_VERSION__,
  builtAt: __BUILD_TIME__,
} as const;
```

---

## 8. Runtime Configuration (JSON loaded at boot)

The container ships a static bundle; per-environment values live in `public/config.json` (root-served at `/config.json`), fetched **before** the app renders. This keeps "build once, deploy anywhere" — ops can swap or mount `config.json` without rebuilding. Note it is intentionally **not** under `/assets` and **not** precached by the service worker.

```jsonc
// public/config.json
{
  "apiBaseUrl": "https://api.example.com",
  "sentryDsn": "https://xxx@sentry.io/123",
  "environment": "production",
  "featureFlags": { "newDashboard": false }
}
```

```ts
// app/runtime-config/load-runtime-config.ts
import type { RuntimeConfig } from "./runtime-config.type";

export async function loadRuntimeConfig(): Promise<RuntimeConfig> {
  const res = await fetch("/config.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load runtime config");
  return res.json();
}
```

```ts
// app/main.tsx (boot sequence)
const config = await loadRuntimeConfig();
initSentry(config);                 // uses runtime DSN + env
const router = createAppRouter();
root.render(<AppProviders config={config} router={router} />);
```

Distinction:
- **Runtime config** (`config.json`): environment-specific, changes per deploy → fetched.
- **Build-time metadata** (`__APP_*__`): baked at build → Vite `define`.

`.env`/`import.meta.env` is used **only** for local dev conveniences, not for production environment values.

---

## 9. Providers, Theming, i18n

`app/providers/app-providers.component.tsx` composes (outer→inner):

```
RuntimeConfigProvider
 └─ Sentry ErrorBoundary
     └─ MantineProvider (theme + colorScheme)
         └─ Notifications
             └─ QueryClientProvider (+ Devtools in dev)
                 └─ I18nextProvider
                     └─ RouterProvider
```

- **Theme:** `MantineProvider` with a custom theme in `theme.config.ts`. Color scheme is system-aware by default and toggleable; persist the user's choice via Mantine's color-scheme manager. `theme-toggle.component.tsx` is a controlled switch.
- **Notifications:** mount `<Notifications />` once; all call sites use `shared/ui/notification/notify.ts`.
- **i18n:** `react-i18next` + `i18next-http-backend` loads locales from `/assets/locales/{{lng}}/translation.json`; `i18next-browser-languagedetector` picks the language (querystring → localStorage → navigator), **falling back to English**. `language-switcher.component.tsx` is controlled.
- **Icons:** import individually from `@tabler/icons-react` (tree-shakeable).

---

## 10. Data Layer (TanStack Query + React Router)

- One `QueryClient` created in `query-client.config.ts` with sensible defaults (retry, `staleTime`, `gcTime`).
- Each entity owns its query hooks: `entities/user/api/use-users.hook.ts` wraps `useQuery`; mutations live in feature `model` hooks.
- `query-keys.ts` centralizes key factories to keep cache invalidation type-safe.
- Router uses `createBrowserRouter` with route objects pointing at `*.page.tsx`. Optionally use route `loader`s to prime the query cache. Wrap with the current Sentry React Router v7 integration for route-aware tracing.

---

## 11. Sentry

- Initialized in `sentry.config.ts`, called from `main.tsx` **after** runtime config loads (DSN + environment come from `config.json`).
- Tag releases with `BUILD_INFO.version`; set `environment` from runtime config.
- Enable: React error boundary, browser tracing (React Router integration), and session replay (sample rates from config/flags).
- Upload source maps in CI as part of the production build step, then strip them from the served bundle.

---

## 12. Quality Gates

### BiomeJS (`biome.json`)
Single source of truth for format + lint + import sorting (replaces ESLint + Prettier). `.ts` and `.tsx` are formatted by Biome automatically (on save in the editor, via `lint-staged` on commit, and verified on push).

```jsonc
{
  "$schema": "https://biomejs.dev/schemas/2.5.0/schema.json",
  "files": { "ignoreUnknown": true },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "linter": { "enabled": true, "rules": { "recommended": true } },
  "assist": { "actions": { "source": { "organizeImports": "on" } } },
  "javascript": { "formatter": { "quoteStyle": "double", "semicolons": "always" } },
  "overrides": [
    {
      "includes": ["**/*.ts", "**/*.tsx"],
      "formatter": { "enabled": true }
    }
  ]
}
```

### Vitest (`vitest.config.ts`) — with coverage exclusions
- `environment: "jsdom"` for unit; **Browser Mode (Chromium)** for component tests.
- Co-located `*.test.tsx`. Shared render helper in `shared/lib/test/render-with-providers.tsx`.
- Coverage via `@vitest/coverage-v8`, with tests, fixtures, mocks, types, config, and barrels/entrypoints excluded so the metric reflects real source code only.

```ts
// vitest.config.ts (illustrative)
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/shared/lib/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
        "**/__tests__/**",
        "**/__fixtures__/**",
        "**/__mocks__/**",
        "**/fixtures/**",
        "**/mocks/**",
        "**/*.type.ts",
        "**/*.d.ts",
        "**/*.config.{ts,tsx}",
        "**/*.const.ts",
        "src/app/main.tsx",
        "src/**/*.stories.{ts,tsx}",
      ],
      thresholds: { lines: 80, functions: 80, branches: 70, statements: 80 },
    },
  },
});
```

### Semgrep (`.semgrep.yml`)
Run locally (pre-commit) and in CI. Managed rulesets:
```yaml
rules:
  - p/typescript
  - p/react
  - p/owasp-top-ten
  - p/secrets
```
Command: `semgrep ci` (CI) / `semgrep scan --config .semgrep.yml` (local).

### LavaMoat — supply-chain hardening
Frontend bundles can't use LavaMoat's runtime SES sandbox, but install-time protection applies:
- `@lavamoat/allow-scripts` disables **all** dependency lifecycle scripts by default (`.npmrc` → `ignore-scripts=true`) and runs only an explicit allowlist in `package.json`.
- Setup once: `npx --no-install @lavamoat/allow-scripts setup` then `... auto`; thereafter `allow-scripts run` after each install (wired into `install:secure`, §13).
- `@lavamoat/preinstall-always-fail` makes an accidental bypass fail loudly.

```jsonc
// package.json (excerpt)
{
  "lavamoat": {
    "allowScripts": {
      "@lavamoat/preinstall-always-fail": true
      // add audited packages explicitly, e.g. "esbuild": true
    }
  }
}
```

---

## 13. Secure Install, `.npmrc` & Scripts

### `.npmrc` — secure defaults
```ini
# Reproducible, hardened npm defaults
save-exact=true          # always pin exact versions (no ^ / ~)
fund=false               # no funding/sponsoring output
audit=true               # surface known vulnerabilities
ignore-scripts=true      # lifecycle scripts blocked; LavaMoat allow-scripts runs the allowlist
engine-strict=true       # enforce engines.node (latest LTS) at install time
package-lock=true        # always maintain the lockfile
loglevel=warn
```

### `install:secure`
A single hardened install command is used **instead of** a bare `npm ci`. It performs a clean, lockfile-faithful install with scripts blocked, then runs only the LavaMoat allowlist:

```jsonc
{
  "scripts": {
    "install:secure": "npm ci --ignore-scripts --no-fund && allow-scripts run",
    "prepare": "husky",

    "dev": "vite",
    "build": "tsc -p tsconfig.json && vite build",
    "preview": "vite preview",

    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",

    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "format": "biome format --write .",
    "typecheck": "tsc --noEmit",

    "sast": "semgrep scan --config .semgrep.yml",
    "allow-scripts": "allow-scripts"
  },
  "engines": { "node": "24.15.0" }
}
```

> CI and developers run `npm run install:secure`. Because `.npmrc` sets `save-exact` and the lockfile is committed, every install is reproducible and version-pinned.

---

## 14. Git Hooks — Husky

Husky enforces quality on commit and push. Initialized via the `prepare` script (`husky`), which runs automatically after install.

### `.lintstagedrc.json` — auto-format staged TS/TSX
```json
{
  "*.{ts,tsx}": ["biome check --write --no-errors-on-unmatched"]
}
```

### `.husky/pre-commit` — format & restage
```sh
npx lint-staged
```
`lint-staged` runs Biome's auto-fix on the staged `.ts`/`.tsx` files and **re-stages** them, so the formatted/linted result is included in the commit automatically.

### `.husky/pre-push` — lint + tests, auto-commit linted files
Before any push: auto-fix the whole tree, commit any resulting changes, then run typecheck and the test suite (with coverage).

```sh
# 1) Auto-format / lint-fix the whole tree
npx biome check --write .

# 2) If anything changed, auto-commit the linted files and stop the push
if ! git diff --quiet; then
  git add -A
  git commit -m "style: auto-format via biome (pre-push)"
  echo "Linted files were committed. Re-run 'git push' to include them."
  exit 1
fi

# 3) Verify and test
npm run typecheck
npm run test:coverage
```

> **Why the push aborts after an auto-commit:** Git computes the set of commits to push *before* the `pre-push` hook runs, so a commit created inside the hook would not be part of the current push. The hook therefore commits the fixes and exits non-zero with a clear instruction to push again — guaranteeing linted files are never silently left out. The `pre-commit` + `lint-staged` step usually means there is nothing left to fix by push time, so this branch is the safety net rather than the common path.

Add `husky` and `lint-staged` as dev dependencies (pinned, §2).

---

## 15. Docker — Local Dev with Hot-Reload

`Dockerfile.dev` runs the Vite dev server; source is bind-mounted so edits trigger HMR. `node_modules` is kept in an anonymous volume. Node is pinned to the LTS tag.

```dockerfile
# Dockerfile.dev
FROM node:24.15.0-alpine
WORKDIR /app
COPY package.json package-lock.json .nvmrc .npmrc ./
RUN npm run install:secure
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]
```

```yaml
# docker-compose.yml
services:
  web:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "5173:5173"
    volumes:
      - ./:/app
      - /app/node_modules        # preserve container's node_modules
    environment:
      - CHOKIDAR_USEPOLLING=true  # reliable file-watching across the bind mount
    command: npm run dev -- --host
```

> HMR requires `server.host: true` and `watch.usePolling: true` (set in `vite.config.ts`) so file events cross the Docker mount boundary. Start with `docker compose up`.

A separate multi-stage **production** `Dockerfile` builds the static bundle (`npm run install:secure && npm run build`) and serves it via nginx; `config.json` is mounted/replaced at deploy time and excluded from service-worker precache. Static assets are served from `/assets`.

---

## 16. VS Code Workspace Config

`.vscode/extensions.json`:
```jsonc
{
  "recommendations": [
    "biomejs.biome",
    "ms-azuretools.vscode-docker",
    "vitest.explorer",
    "semgrep.semgrep"
  ]
}
```

`.vscode/settings.json` — Biome formats `.ts`/`.tsx` on save, organizes imports:
```jsonc
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports.biome": "explicit",
    "quickfix.biome": "explicit"
  },
  "[typescript]": { "editor.defaultFormatter": "biomejs.biome", "editor.formatOnSave": true },
  "[typescriptreact]": { "editor.defaultFormatter": "biomejs.biome", "editor.formatOnSave": true },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "files.eol": "\n"
}
```

`.vscode/launch.json`:
```jsonc
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Debug app (Vite)",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/src"
    }
  ]
}
```

---

## 17. Definition of Done (checklist)

- [ ] **App installs as a PWA** (manifest valid, SW registered, offline shell works, passes installability audit); `config.json` is **not** precached.
- [ ] All **static assets are served from `/assets`** (icons, images, fonts, locales).
- [ ] **Node pinned to latest LTS (24.15.0)** in `.nvmrc`, `engines`, and Docker; `engine-strict` enforced.
- [ ] **All dependency versions pinned** exactly; lockfile committed; `save-exact` set.
- [ ] **No `index.ts` files**; all imports are direct file paths.
- [ ] `docker compose up` serves the app with working HMR.
- [ ] Runtime `config.json` loads before render and drives API base URL + Sentry DSN.
- [ ] `__APP_NAME__`, `__APP_VERSION__`, `__BUILD_TIME__` surface in the UI/About.
- [ ] Light/dark theme toggles, system-aware, persisted; language switches at runtime with English fallback.
- [ ] Every file is `kebab-case` with a correct role suffix; no business logic in `.component`/`.page` files.
- [ ] Controlled components verified (inputs receive `value`/`onChange`); FSD import direction enforced.
- [ ] **`.ts`/`.tsx` auto-formatted by Biome** (editor on-save, lint-staged on commit, verified on push).
- [ ] **Husky** pre-commit (lint-staged auto-format) and pre-push (auto-commit linted files + typecheck + tests) installed.
- [ ] **Vitest coverage** runs with tests/fixtures/mocks/types/config excluded; thresholds met.
- [ ] **`install:secure`** used in place of bare `npm ci`; hardened `.npmrc` (no funding, pinned, scripts blocked) committed.
- [ ] `allow-scripts` allowlist committed; install scripts blocked by default.
- [ ] `biome check`, `tsc --noEmit`, `vitest run --coverage`, and `semgrep` all pass in CI.
- [ ] Sentry receives errors with correct release + environment tags.
