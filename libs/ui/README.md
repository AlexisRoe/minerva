# @minerva/ui

This library was generated with [Nx](https://nx.dev).

## Running unit tests

Run `nx test @minerva/ui` to execute the unit tests via [Vitest](https://vitest.dev/).

## Adding a shadcn component

Components under `src/lib/base/components/*` (button, card, empty, drawer, ...) are adapted
from [shadcn](https://ui.shadcn.com/) rather than written from scratch. This repo has no
`components.json`/path aliases of its own, so the shadcn CLI can't target it directly —
pull components into a throwaway Vite project first, then relocate the files here.

Components are grouped into two top-level categories under `src/lib/`:
- `base/components/<name>/` — generic, shadcn-style primitives (Button, Card, Drawer, ...)
- `reporting-button/components/<name>/` — components specific to the reporting-button
  add-in flow (ReportingFeedbackDrawer, MailClassificationCard, ...)

1. Scaffold a scratch project somewhere outside the repo (e.g. in a temp/scratchpad dir):

   ```bash
   npm create vite@latest shadcn-scratch -- --template react-ts
   cd shadcn-scratch
   npm install
   npm install tailwindcss @tailwindcss/vite
   ```

2. Wire up Tailwind v4 and a `@/*` alias (required by the CLI):
   - `vite.config.ts`: add the `tailwindcss()` plugin and a `resolve.alias` for `@` → `./src`.
   - `tsconfig.app.json`: add `"baseUrl": "."` and `"paths": { "@/*": ["./src/*"] }`.
   - `src/index.css`: replace the contents with `@import "tailwindcss";`.

3. Initialize shadcn with the **radix** base and **base** preset — this matches what's
   already used in this lib (`@radix-ui/react-slot`, plain OKLCH neutral theme, no
   Geist/base-ui). The default `-d`/`shadcn@latest init` picks the newer "nova" preset
   (`@base-ui/react`, Geist font) — don't use it here:

   ```bash
   npx shadcn@latest init -t vite -b radix -p base -y
   ```

4. Add whatever components you need:

   ```bash
   npx shadcn@latest add card empty drawer
   ```

   Generated files land in `@/components/ui/*.tsx` (the `@` alias resolves to a literal
   `@` folder if `baseUrl` isn't picked up — check both `src/components/ui` and `./@/components/ui`).

5. Relocate each component into this repo's per-component folder convention
   (`src/lib/base/components/<name>/<name>.tsx` + `<name>.stories.tsx`), adapting as you copy:
   - `import { cn } from "@/lib/utils"` → `import { cn } from '../../../utils/cn';`
   - Prefer named function declarations (`export function X(...)`) over the CLI's
     `function X(...) { ... }\nexport { X }` split, to match existing components.
   - Swap double quotes for single quotes, add semicolons (Biome enforces this — run
     `npx biome check --write` on the new files when done).
   - Compound components (Card, Empty, Drawer, ...) stay in one file with one export
     per sub-component, same as shadcn ships them.

6. If the component uses color tokens not yet in `src/styles/shadcn-theme.css`
   (`bg-popover`, `text-accent-foreground`, etc.), add them there — copy the token's
   `:root`/`.dark` values and its `@theme inline` mapping from the scratch project's
   `src/index.css`. Don't import the scratch project's full generated CSS wholesale;
   it includes tokens (sidebar, chart-*) this lib doesn't use.

7. Install any new runtime dependency the component pulled in (check the scratch
   project's `package.json` diff — e.g. `vaul` for Drawer, `@radix-ui/react-*` packages)
   into the **root** `package.json`, not `libs/ui/package.json`.

8. Export the new component(s) from `src/index.ts` as explicit named exports
   (`export { X } from '...'`, plus `export type { XProps } from '...'` for types) —
   never `export * from '...'`. Then verify:

   ```bash
   npx tsc --noEmit -p libs/ui/tsconfig.json
   npx biome check --write libs/ui/src/lib/<name>
   npx nx build-storybook ui
   ```

9. Clean up the scratch project — it's throwaway and shouldn't be committed.
