# Minerva

Security-first polyglot monorepo: two React PWAs, a NestJS API, and Python queue workers — managed with [Nx](https://nx.dev), npm workspaces, and [uv](https://docs.astral.sh/uv/).

## Projects

| Project          | Path                    | Stack                          | Local URL              |
| ---------------- | ----------------------- | ------------------------------ | ---------------------- |
| inspector        | `apps/inspector`        | React 19 + Vite 8 (PWA)        | https://localhost:5173 |
| report-button    | `apps/report-button`    | React 19 + Vite 8 (PWA)        | https://localhost:5174 |
| api              | `apps/api`              | NestJS 11 + Prisma 7           | https://localhost:3000 |
| email-parser     | `apps/email-parser`     | Python 3.14 worker             | —                      |
| email-screenshot | `apps/email-screenshot` | Python 3.14 worker             | —                      |
| @minerva/shared  | `libs/shared`           | Shared TS types/constants/DTOs | —                      |
| @minerva/ui      | `libs/ui`               | Shared React components        | —                      |
| worker-core      | `libs/worker-core`      | Shared Python worker frame     | —                      |

Persistent dev services (`npm run infra:up`): Postgres 18 (`localhost:5432`, roles `minerva_rw`/`minerva_ro`), Valkey 9 (`localhost:6379`), LocalStack S3 (`localhost:4566`), go-camo image proxy (`localhost:8443`).

## Prerequisites

- [nvm](https://github.com/nvm-sh/nvm) + Node 24 (`nvm install`)
- [uv](https://docs.astral.sh/uv/getting-started/installation/)
- [mkcert](https://github.com/FiloSottile/mkcert) (`brew install mkcert`)
- Docker Desktop

## Quickstart

```sh
nvm use
cp .env.example .env        # then replace every change-me value with real secrets
npm run setup               # npm ci + uv sync + local TLS certificates
mkcert -install             # once, so browsers trust the local CA
npm run infra:up            # postgres, valkey, localstack, go-camo (waits for healthy)
npx nx run api:prisma-migrate-dev   # apply database migrations
npm run dev                 # serve everything (frontends, api, workers)
```

Then open https://localhost:5173 — the page renders the shared UI component and shows the API health check. Press "Send hello event" on https://localhost:5174 and watch both workers log the consumed event.

## Everyday commands

```sh
npx nx run-many -t lint typecheck test build   # everything
npx nx affected -t lint typecheck test build   # only what changed (also runs on pre-push)
npx nx run inspector:dev                       # one app
uv run pytest apps/email-parser                # python tests directly
npm run lint:fix                               # biome autofix
```

## Event flow (hello world)

`report-button` → `POST /events/hello` → API validates, `XADD`s a `HelloEventPayload` (from `@minerva/shared`) onto the Valkey stream `minerva:events` and records it via Prisma → each worker's consumer group (`email-parser`, `email-screenshot`) picks it up through the shared `worker-core` frame (retries + dead-letter stream `minerva:events:dlq`).

## More

See [docs/foundation.md](docs/foundation.md) for architecture, security decisions, CI/versioning workflows, and how to add a new project.
