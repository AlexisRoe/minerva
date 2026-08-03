# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

`README.md` in this directory is the long-form version of everything below — the
component conventions, the styling escape-hatch order, and the ADRs behind
Mantine/Storybook/Tabler. Read it before a non-trivial change.

## Commands

Run from the repository root (`/Users/alexis/dev/minerva-v2`). Never call `npx`
or the underlying binaries directly — the Makefile is the interface.

| Command          | What it does                                                   |
| ---------------- | -------------------------------------------------------------- |
| `make verify`    | lint → typecheck → test, stopping at the first failure. The gate before any commit. |
| `make test`      | Full Vitest suite across all workspace packages.                |
| `make typecheck` | `tsc --noEmit` per package.                                     |
| `make lint`      | Biome check (format, import order, lint).                       |
| `make format`    | Applies Biome formatting and safe fixes.                        |
| `make storybook` | Storybook for this library on https://localhost:4301.           |
| `make build`     | Builds every package in dependency order.                       |

Narrowing the loop to this package:

```bash
pnpm --filter @minerva/ui-lib test                 # this package's tests only
pnpm --filter @minerva/ui-lib test empty-state     # single file — positional is a path filter
pnpm --filter @minerva/ui-lib test -t "renders the action"   # single test by name
pnpm --filter @minerva/ui-lib typecheck
pnpm --filter @minerva/ui-lib dev                  # vite build --watch, against a running app
```

The root `vitest.config.ts` composes each package as a project, so a package's
suite behaves identically whether run from the root or from inside it.

## Architecture

This is `@minerva/ui-lib`, one package in a pnpm workspace (`apps/backend/*`,
`apps/frontend/minerva-button`, `apps/frontend/minerva-manager`, `shared/*`).

**The dependency boundary is the point of this package.** It is the *only*
package that may depend on `@mantine/core`, `@mantine/hooks`, and
`@tabler/icons-react`. Apps depend on `@minerva/ui-lib` alone and pull those back
out through subpath exports: `@minerva/ui-lib/primitives` → `@mantine/core`,
`/hooks` → `@mantine/hooks`, `/icons` → `@tabler/icons-react` (the pass-throughs
in `src/export/`). This guarantees one React and one Mantine instance at runtime.
If a change would make an app import Mantine directly, it is the wrong change.

**Four public entry points, and nothing else:** `.` (Minerva components + theme
provider, from `src/index.ts`), `./primitives`, `./hooks`, `./icons`, plus
`./styles.css`. Deep imports into `dist/` are out of contract. `vite.config.ts`
declares one library entry per subpath; `tsconfig.build.json` emits the `.d.ts`
files alongside them.

**`primitives/` versus `apps/` is the layout decision that matters.** A component
lives in `src/primitives/` when it knows nothing about what Minerva does and
either app could use it; in `src/apps/<app>/` when it embodies part of one app's
flow. `apps/minerva-button/` and `apps/minerva-manager/` never import from each
other — when both want something, generalise it down into `primitives/`.

**Three narrowing layers of visibility:** the component file exports the
component and its props type → the barrel (`apps/<app>/index.ts`, or a line in
`src/index.ts` for a primitive) decides what escapes → `package.json` `exports`
publishes the barrels.

**The theme is a contract, not a pile of overrides.** `theme/custom-shadcn.theme.ts`
holds tokens and per-component defaults; `src/style.css` holds the global Mantine
overrides the theme object cannot express. A tweak two components both need
belongs in one of those, not in either component.

## Conventions

- **One component, one directory**, holding `<name>.component.tsx`,
  `.stories.tsx`, `.test.tsx`, and any `.util.ts`. Directories and files are
  kebab-case; the component inside is PascalCase. `*.example.tsx` is
  visualisation-only (mocks, composed scenes for Storybook) and is never exported.
- **Relative imports are extensionless** (`./empty-state.component`) —
  `moduleResolution` is `bundler`, and `vite build` bundles each public subpath,
  so nothing is resolved as unbundled ESM at runtime. CSS module imports keep
  their `.css` extension.
- **`verbatimModuleSyntax` + `erasableSyntaxOnly`:** type-only imports must use
  `import type`; no enums, no parameter properties. Biome enforces `useImportType`
  as an error for this package.
- **Components own their inner workings and nothing else.** Strings, handlers,
  data, and routing arrive as props. A component that reaches outside itself
  cannot be reused by the other app or rendered in Storybook.
- **Extend Mantine props rather than replacing them** (`extends StackProps,
  ElementProps<'div'>`), export the props interface, and set `displayName`.
- **Styling escape hatches, in order:** style prop → `vars` prop → `style` prop →
  CSS module (only where Mantine genuinely cannot express it, e.g. keyframes in
  `simple-loader`). Never hand-roll a value a theme token already names.
- **Every exported component gets a JSDoc block with an `@example`; every prop on
  an exported interface gets a comment** including its default. Storybook autodocs
  renders both.
- **Everything is tested**, rendered through `MinervaThemeProvider` so assertions
  see the themed component. Query as a user would (`getByRole`, `getByText`).
  `*.util.ts` gets its own `*.util.test.ts`.
- **Story titles mirror the source layout:** `Primitives/<Component>`,
  `<App>/<Component>`, `<App>/Views/<Page>`.
