# Typescript library

`@minerva/typescript-lib` shares interface, response or request objects, shared
constants, utils and shape definitions between the backend services and the
frontend applications.

Everything in here is framework-free TypeScript: no React, no Nest, no runtime
dependency on any app. If a piece of code cannot be consumed by both a backend
service and a frontend app, it does not belong in this package.

Current building blocks:

- `MinervaError` — the shared error base class, its types and serialisation helpers
- `Result` — the generic success/failure result type and its guards
- `UseCase` — the abstract use-case base class
- `env` — typed environment variable readers (`requireEnv`, `optionalEnv`, `readPort`)
- `queue` — email job shapes and their type guards
- `validators` — small shared runtime guards

## How to use

The package is private to the workspace and consumed through the workspace
protocol:

```jsonc
// package.json of the consuming package
{
  "dependencies": {
    "@minerva/typescript-lib": "workspace:*"
  }
}
```

There is exactly one public entry point — the root barrel `src/index.ts`,
emitted to `dist/index.js`. Deep imports into `dist/` are out of contract.

```ts
import { MinervaError, Result, requireEnv } from '@minerva/typescript-lib';
import type { ErrorCode, SerializedResult } from '@minerva/typescript-lib';
```

A new export becomes public only when it is re-exported from `src/index.ts`.

## Commands

Run from the repository root (`/Users/alexis/dev/minerva-v2`). Never call `npx`
or the underlying binaries directly — the Makefile is the interface.

| Command          | What it does                                                                        |
| ---------------- | ----------------------------------------------------------------------------------- |
| `make verify`    | lint → typecheck → test, stopping at the first failure. The gate before any commit. |
| `make test`      | Full Vitest suite across all workspace packages.                                     |
| `make typecheck` | `tsc --noEmit` per package.                                                          |
| `make lint`      | Biome check (format, import order, lint).                                            |
| `make format`    | Applies Biome formatting and safe fixes.                                             |
| `make build`     | Builds every package in dependency order.                                            |

Narrowing the loop to this package:

```bash
pnpm --filter @minerva/typescript-lib test               # this package's tests only
pnpm --filter @minerva/typescript-lib test result        # single file — positional is a path filter
pnpm --filter @minerva/typescript-lib test -t "returns a failure"   # single test by name
pnpm --filter @minerva/typescript-lib typecheck
pnpm --filter @minerva/typescript-lib build              # tsc -p tsconfig.build.json
pnpm --filter @minerva/typescript-lib dev                # same build in watch mode
```

## Code conventions

- all code needs to be tested in a `*.spec.ts` file
- all code needs an `*.example.ts` file to showcase how to use it (and use that
  for the test files)
- types and interfaces live in an external `*.types.ts` file
- functions have clear annotations and descriptive, concise JSDocs explaining
  what the purpose of the method or class is, containing at least one example —
  never explain how it works, just the intention
- relative imports are extensionless (`./minerva.error.types`) — the package is
  CommonJS (`module: nodenext`, no `"type": "module"`), so `require` resolves
  them without help
- one concept, one directory (`custom-errors/`, `result-type/`, `use-case/`);
  files are kebab-case, the exported symbol inside is PascalCase
- `verbatimModuleSyntax` + `erasableSyntaxOnly`: type-only imports must use
  `import type`; no enums, no parameter properties

### File suffixes

| Suffix         | Contains                                                                       |
| -------------- | ------------------------------------------------------------------------------ |
| `*.class.ts`   | A single exported class and nothing else.                                       |
| `*.types.ts`   | Types and interfaces only — no runtime code.                                    |
| `*.error.ts`   | An error class extending `MinervaError`.                                        |
| `*.constants.ts` | Frozen literal values and the types derived from them.                        |
| `*.util.ts`    | Free-standing pure helper functions around the concept in the same directory.   |
| `*.example.ts` | Runnable usage examples, consumed by the spec files. Never exported.            |
| `*.spec.ts`    | Vitest suite for the sibling file of the same base name.                        |

## ADR

_No architecture decisions recorded yet._
