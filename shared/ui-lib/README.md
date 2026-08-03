# @minerva/ui-lib

## Description

The shared UI layer of Minerva. It holds every component the apps draw with, the
Mantine theme they are drawn in, and the entry points through which the apps
reach Mantine and the icon set.

The library is deliberately the only package that depends on `@mantine/core`,
`@mantine/hooks`, and `@tabler/icons-react`. The apps depend on `@minerva/ui-lib`
alone and pull the primitives, hooks, and icons back out of it. That keeps one
React and one Mantine instance at runtime, and it keeps the decision of *which*
design system Minerva uses in a single place — swapping it would mean rewriting
this package, not every app.

Components here carry no product logic. They render, they take props, and they
call the handlers they are given. Everything else — data fetching, routing,
translation, state — belongs to the app that mounts them.

## Technology

| Piece                                          | What it is used for                                                   |
| ---------------------------------------------- | --------------------------------------------------------------------- |
| React 19 + TypeScript                          | The component model, in strict TS.                                    |
| Mantine v9 (`@mantine/core`, `@mantine/hooks`) | Primitives, style props, theme tokens.                                |
| Tabler icons (`@tabler/icons-react`)           | The icon set, re-exported to the apps.                                |
| Vite (library mode)                            | Builds `dist/` — one ES bundle per public subpath, plus `styles.css`. |
| `tsc`                                          | Emits the declaration files; also the typecheck gate.                 |
| Vitest + Testing Library + jsdom               | The test suite.                                                       |
| Storybook (`@storybook/react-vite`)            | Visual workbench, with the a11y and docs addons.                      |
| Biome                                          | Formatting, import sorting, and lint.                                 |

## How to use

Consuming apps take the workspace package and mount the provider once, at the
root:

```tsx
import { MinervaThemeProvider, ReportButtonPage } from '@minerva/ui-lib';
import '@minerva/ui-lib/styles.css';

export function App() {
  return (
    <MinervaThemeProvider>
      <ReportButtonPage />
    </MinervaThemeProvider>
  );
}
```

Mantine itself is not an app dependency. Reach it through the subpath exports:

```tsx
import { Group, Stack, Text } from '@minerva/ui-lib/primitives';
import { useDisclosure } from '@minerva/ui-lib/hooks';
import { IconSatellite } from '@minerva/ui-lib/icons';
```

The four public entry points are `.` (Minerva's own components and the theme
provider), `./primitives`, `./hooks`, and `./icons`, plus the `./styles.css`
stylesheet. Nothing outside them is importable — deep imports into `dist/` are
not part of the contract.

### Useful commands

Run these from the repository root:

| Command            | What it does                                                                                          |
| ------------------ | ----------------------------------------------------------------------------------------------------- |
| `make verify`      | Lint, then typecheck, then the full test suite. Stops at the first failure. The gate before a commit. |
| `make test`        | The whole Vitest suite across all packages.                                                           |
| `make typecheck`   | `tsc --noEmit` for every workspace package.                                                           |
| `make lint`        | Biome check — formatting, imports, lint rules.                                                        |
| `make format`      | Applies Biome formatting and its safe fixes.                                                          |
| `make build`       | Builds every workspace package in dependency order.                                                   |
| `make storybook`   | Storybook for this library on https://localhost:4301.                                                 |
| `make dev`         | Every app in watch mode; builds the ui-lib first.                                                     |
| `make dev-button`  | Only minerva-button, on https://localhost:4101.                                                       |
| `make dev-manager` | Only minerva-manager, on https://localhost:4201.                                                      |
| `make help`        | Lists every target.                                                                                   |

Scoped to this package only:

| Command                                   | What it does                                             |
| ----------------------------------------- | -------------------------------------------------------- |
| `pnpm --filter @minerva/ui-lib build`     | `vite build` plus the declaration emit.                  |
| `pnpm --filter @minerva/ui-lib dev`       | `vite build --watch`, for working against a running app. |
| `pnpm --filter @minerva/ui-lib test`      | Just this package's tests.                               |
| `pnpm --filter @minerva/ui-lib typecheck` | Just this package's types.                               |

`make verify` is the one that matters. The rest are for narrowing the loop while
you work.

## Architecture

### The tree

```
src/
├── index.ts              Public entry: Minerva components, theme provider, re-exports
├── style.css             Global Mantine overrides the theme object cannot express
├── test-setup.ts         Vitest setup (jest-dom matchers)
│
├── apps/                 Components belonging to one app
│   ├── minerva-button/   The Outlook add-in: report flow, drawer, views
│   │   ├── <component>/  .component.tsx + .stories.tsx + .test.tsx (+ .util.ts)
│   │   ├── views/        Whole-page .example.tsx scenes, for Storybook
│   │   └── index.ts      The barrel — what the app may import
│   └── minerva-manager/  The management UI (barrel in place, components to come)
│
├── primitives/           App-agnostic building blocks, usable by either app
│   ├── brand-logo/  checkbox-with-label/  empty-state/
│   └── outlook-window/  simple-loader/  text-area/  …
│
├── export/               Pass-through entry points
│   ├── primitives.ts     → @mantine/core
│   ├── hooks.ts          → @mantine/hooks
│   └── icons.ts          → @tabler/icons-react
│
├── theme/                The Mantine theme
│   ├── custom-shadcn.theme.ts        Tokens and per-component defaults
│   ├── css-variable-resolver.override.ts
│   └── minerva-provider.component.tsx
│
└── assets/               Logo and static files
```

### `primitives/` versus `apps/`

This is the split that matters. A component goes in `primitives/` when it knows
nothing about what Minerva does — it is a shape, a control, a layout, and either
app could use it. It goes in `apps/<app>/` when it embodies a piece of one app's
flow.

When something in `apps/` turns out to be wanted by both apps, that is the signal
to generalise it and move it down into `primitives/`, not to import across app
folders. `apps/minerva-button/` and `apps/minerva-manager/` never reach into each
other.

### One component, one directory

Everything about a component sits together: the implementation, its stories, its
tests, and any helper it needs.

```
empty-state/
├── empty-state.component.tsx
├── empty-state.stories.tsx
└── empty-state.test.tsx
```

### What is public

Three layers, narrowing outwards:

1. **The component file** exports the component and its props type.
2. **The barrel** (`apps/<app>/index.ts`, or a line in `src/index.ts` for a
   primitive) decides which of those the outside world sees.
3. **`package.json` `exports`** publishes the barrels as `.`, `./primitives`,
   `./hooks`, `./icons`, and `./styles.css`.

An app importing from anywhere else — a deep path into `dist/`, or Mantine
directly — is out of contract.

## Code conventions

### File naming

| Suffix                     | Role                                                                                            |
| -------------------------- | ----------------------------------------------------------------------------------------------- |
| `*.component.tsx`          | A component that is exported. If it is public, it appears in a barrel.                          |
| `*.example.tsx`            | Visualisation only — a mock or a composed scene for Storybook. Never exported from the package. |
| `*.stories.tsx`            | The Storybook entry for a component or an example.                                              |
| `*.test.tsx` / `*.test.ts` | The tests.                                                                                      |
| `*.util.ts`                | Pure helpers belonging to one component, kept out of the render.                                |
| `*.module.css`             | A CSS module, only where Mantine genuinely cannot express something (see `simple-loader`).      |

Directories and files are kebab-case; the component inside is PascalCase.

### Components

**Own the inner workings and nothing else.** The open/closed state of a drawer it
owns: yes. Translated strings, click handlers, fetched data, routing: no — those
come in as props. A component that reaches outside itself cannot be reused by the
other app, and cannot be rendered in Storybook without dragging the app in with
it.

**Extend the Mantine props rather than replacing them.** Props interfaces build on
the underlying component's, so `m`, `p`, `className`, and the rest come through
and a caller can adjust spacing without a new prop being invented for it.

```tsx
export interface ButtonInfoContentProps extends StackProps, ElementProps<'div'> {
  /** The blocks to draw, top to bottom. An empty array draws nothing at all. */
  sections: ButtonInfoSection[];
}
```

**Export the props type.** Every public component exports its `Props` interface
alongside it, so an app can type a wrapper around it.

**Set `displayName`.** One line under each component — it keeps React DevTools and
the Storybook docs readable after minification.

```tsx
ButtonInfoContent.displayName = 'ButtonInfoContent';
```

**Compound components for multi-part layouts.** Where a component has parts a
caller arranges, hang them off the parent instead of taking a dozen render props:
`ButtonDrawer.Root`, `.Header`, `.Body`, `.Footer`.

### Styling

**Mantine props and primitives before anything hand-rolled.** Compose with
`Stack`, `Group`, `Flex`, `Box`, `Divider`; size and space with the style props
(`p`, `gap`, `mih`, `bd`, `bdrs`, `c`) and the theme tokens behind them.

**Then the escape hatches, in order of preference:**

1. A **style prop** — `p="md"`, `bg="var(--mantine-color-body)"`.
2. The **`vars` prop**, for a per-instance CSS variable. Preferred over `styles`,
   which reaches into a component's internals.
3. The **`style` prop**, only for what has no prop at all: `overflow`, a custom
   CSS variable. Never for a value a token already names.
4. A **CSS module**, only where the thing genuinely cannot be expressed in
   Mantine — a keyframe animation, for instance. `simple-loader` is the one case.

**Theme-wide changes go in the theme**, not into components: per-component
defaults in `custom-shadcn.theme.ts`, and global Mantine overrides in
`style.css`. If two components need the same tweak, it belongs in one of those.

### Documentation

**JSDoc explains what a component is for and how to use it.** Every exported
component gets a docblock: what it is for, why it is built the way it is where
that is not obvious, and an `@example` showing real usage. Write it for someone
deciding whether this is the component they want — it is also what Storybook's
autodocs shows.

**Every prop on an exported interface carries a comment** — what it means, and its
default where it has one.

```ts
export interface SateliteButtonProps extends Omit<ActionIconProps, 'variant'>, ElementProps<'button', 'color'> {
  /** Accessible name of the button, since the icon is all it shows. @default 'Satelite' */
  label?: string;
  /** Side of the icon, as a CSS length or a number of px. @default '1.5rem' */
  iconSize?: number | string;
}
```

**Inline comments only where the code is not self-explanatory.** Reserve them for
the unusual: a workaround, a non-obvious CSS interaction, a reason something is
*not* done the straightforward way. Do not narrate what the next line plainly
says.

### Tests

**Everything is tested.** A component lands with its test file. The suite is the
regression net for a library nothing else guards — if a prop has an observable
effect, there is an assertion for it.

Tests render through `MinervaThemeProvider`, so what is asserted is the component
as it actually appears, with the theme applied:

```tsx
function renderState(ui: ReactElement) {
  return render(<MinervaThemeProvider>{ui}</MinervaThemeProvider>);
}
```

Query the way a user would — `getByRole`, `getByText` — and name the test after
the behaviour rather than the implementation. `*.util.ts` helpers get their own
`*.util.test.ts`.

### Stories

Every component has stories covering the states that matter: empty, loading,
error, long text, disabled. `tags: ['autodocs']` turns the JSDoc into a docs page.

Titles follow the source layout — `Primitives/<Component>` for the shared
building blocks, `<App>/<Component>` for app components, and `<App>/Views/<Page>`
for the whole-page `*.example.tsx` scenes.

### TypeScript and lint

Strict throughout, with `noUncheckedIndexedAccess`, `noUnusedLocals`, and
`noUnusedParameters` on top. `verbatimModuleSyntax` and `erasableSyntaxOnly` mean
type-only imports must say `import type`, and no enums or parameter properties —
Vite transpiles file by file.

Relative imports are extensionless (`./empty-state.component`). `moduleResolution`
is `bundler`, and nothing here is consumed as unbundled ESM: `vite build` bundles
the source into one file per public subpath, and the declaration files `tsc`
emits are read by apps that resolve the same way. CSS module imports keep their
`.css` extension, since that is part of the filename, not a resolution guess.

Biome handles formatting, import sorting, and lint — single quotes, semicolons,
120 columns, `useImportType` as an error. Run `make format` to apply, `make lint`
to check, `make verify` before committing.

## Architecture decisions

### ADR-01 — Mantine as the component library

**Status:** accepted

Minerva needs one component library that carries both of its faces: a small
Outlook add-in that is mostly buttons, drawers, and status views, and a manager
application that will want tables, charts, forms, dates, and notifications. The
two must look like the same product.

Mantine was chosen for three reasons, in order of weight:

1. **Familiarity.** It is the library I already know well. That is not a small
   point on a project of this size — it means the design work goes into Minerva
   rather than into learning a styling model, and the idiomatic answer is usually
   the first one reached for.
2. **Adaptability.** Theme tokens, style props, and the `vars`/CSS-variable model
   let a theme be a real contract instead of a pile of overrides. Most components
   here need no custom CSS at all, and the ones that do override a named variable
   rather than fight a stylesheet. It is also unopinionated enough to sit inside
   an Outlook add-in, where the host page is not ours.
3. **Coverage.** Nearly everything either app will need already ships: the core
   primitives, the [hooks package](https://mantine.dev/hooks/use-disclosure/),
   [tables](https://mantine.dev/core/table/),
   [charts](https://mantine.dev/charts/getting-started/),
   [forms](https://mantine.dev/form/use-form/),
   [dates](https://mantine.dev/dates/getting-started/), and
   [notifications](https://mantine.dev/x/notifications/). The manager can be
   built without shopping for a new dependency every other feature.

**Rejected: [shadcn/ui](https://ui.shadcn.com/).** It is excellent at what it
covers and its look is the one Minerva wants — but the coverage runs out. The
pieces the manager will lean on hardest (data tables, charts, the richer date and
form primitives, hooks) are either absent, delegated to yet another dependency,
or left as recipes to assemble. Adopting it would have meant discovering that gap
late, halfway into the manager, with a copy-in-and-own model that makes changing
course expensive.

The look was kept regardless: the theme is a shadcn-flavoured one, so Minerva
gets shadcn's restraint on top of Mantine's completeness. See
`theme/custom-shadcn.theme.ts`, generated from a
[shadcn preset](https://ui.shadcn.com/create?preset=bK0OOeDdQ) via
[MantineHub](https://mantinehub.com/) and modified from there.

**Consequence.** Mantine is a dependency of this package alone, re-exported
through `/primitives`, `/hooks`, and `/icons`. That is what makes the boundary
hold: an app cannot import Mantine directly, so it cannot quietly grow its own
styling conventions, and the version is upgraded once here rather than in every
app.

### ADR-02 — Storybook as the development workbench

**Status:** accepted

Components are built and reviewed in [Storybook](https://storybook.js.org/)
before any app mounts them. A component gets its stories covering the states that
matter — empty, loading, error, long text, disabled — and is judged there, in
isolation, rather than inside a page where a bug could belong to anything.

That order matters here because the hosts are awkward to develop against: the
add-in wants a real Outlook, and both apps need TLS. Storybook gives every
component and every page state a URL that opens instantly, and it doubles as the
visual catalogue of what the library already offers — the first place to look
before building something that exists.

It is also where the `*.example.tsx` scenes earn their keep: whole pages
assembled from real components and mock data, reviewable without running the
product. [`addon-a11y`](https://storybook.js.org/addons/@storybook/addon-a11y)
checks accessibility while you build rather than after.

Run it with `make storybook`.

### ADR-03 — Tabler for the icon set

**Status:** accepted

[Tabler](https://tabler.io/icons) is the icon set, consumed via
[`@tabler/icons-react`](https://github.com/tabler/tabler-icons/tree/main/packages/icons-react)
and re-exported as `@minerva/ui-lib/icons`.

It sits closest to the theme: a uniform stroke weight and geometry that match
Mantine's own visual language and the restrained shadcn look, so icons read as
part of the design rather than as imports. The set is also large enough — several
thousand icons, still growing — that a use case rarely goes unserved, which
avoids the usual drift of mixing a second set in for the one glyph that was
missing.

Practically: MIT-licensed, shipped as tree-shakeable React components, with
`size` and `stroke` passed per icon (`stroke={1.5}` is the house weight), so
icons scale with whatever holds them.
