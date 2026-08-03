# CLAUDE.md

`@minerva/ui-lib` — the design system. The root `CLAUDE.md` covers commands, package
management, and the repo-wide rules; only what is specific to this package is below.
`README.md` in this directory is the long form: component conventions, the styling
escape-hatch order, and the ADRs behind Mantine/Storybook/Tabler.

```bash
make storybook                                     # this library on https://localhost:4301
pnpm --filter @minerva/ui-lib test empty-state     # single file
pnpm --filter @minerva/ui-lib dev                  # vite build --watch, against a running app
```

## Architecture

**Four public entry points, and nothing else:** `.` (Minerva components + theme provider,
from `src/index.ts`), `./primitives` → `@mantine/core`, `./hooks` → `@mantine/hooks`,
`./icons` → `@tabler/icons-react` (pass-throughs in `src/export/`), plus `./styles.css`.
Deep imports into `dist/` are out of contract. `vite.config.ts` declares one library entry
per subpath; `tsconfig.build.json` emits the `.d.ts` files alongside them.

**`primitives/` versus `apps/` is the layout decision that matters.** A component lives in
`src/primitives/` when it knows nothing about what Minerva does and either app could use it;
in `src/apps/<app>/` when it embodies part of one app's flow. `apps/minerva-button/` and
`apps/minerva-manager/` never import from each other — when both want something, generalise
it down into `primitives/`.

**Three narrowing layers of visibility:** the component file exports the component and its
props type → the barrel (`apps/<app>/index.ts`, or a line in `src/index.ts` for a primitive)
decides what escapes → `package.json` `exports` publishes the barrels.

**The theme is a contract, not a pile of overrides.** `theme/custom-shadcn.theme.ts` holds
tokens and per-component defaults; `src/style.css` holds the global Mantine overrides the
theme object cannot express. A tweak two components both need belongs in one of those, not
in either component.

## Conventions

- **One component, one directory**, holding `<name>.component.tsx`, `.stories.tsx`,
  `.test.tsx`, and any `.util.ts`. `*.example.tsx` is visualisation-only
  (mocks, composed scenes for Storybook) and is never exported.
- **Relative imports are extensionless** (`./empty-state.component`) — `moduleResolution` is
  `bundler` and `vite build` bundles each public subpath. CSS module imports keep `.css`.
- **`verbatimModuleSyntax` + `erasableSyntaxOnly`:** type-only imports must use `import type`;
  no enums, no parameter properties.
- **Components own their inner workings and nothing else.** Strings, handlers, data, and
  routing arrive as props. A component that reaches outside itself cannot be reused by the
  other app or rendered in Storybook.
- **Extend Mantine props rather than replacing them** (`extends StackProps,
  ElementProps<'div'>`), export the props interface, and set `displayName`.
- **Styling escape hatches, in order:** style prop → `vars` prop → `style` prop → CSS module
  (only where Mantine genuinely cannot express it, e.g. keyframes in `simple-loader`). Never
  hand-roll a value a theme token already names.
- **Every prop on an exported interface gets a comment** including its default — Storybook
  autodocs renders it alongside the component's JSDoc `@example`.
- **Everything is tested**, rendered through `MinervaThemeProvider` so assertions see the
  themed component. Query as a user would (`getByRole`, `getByText`).
- **Story titles mirror the source layout:** `Primitives/<Component>`, `<App>/<Component>`,
  `<App>/Views/<Page>`.
