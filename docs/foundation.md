# Minerva Foundation

This document records how the monorepo foundation is built and why. The product requirements live in [architecture-foundation.md](architecture-foundation.md).

## Tooling

- **Nx 23 + npm workspaces + TypeScript project references** — Nx provides the task graph, caching, and `affected`; each project owns its configuration. TS 6 strict mode plus `noUncheckedIndexedAccess`, `noImplicitOverride`, `verbatimModuleSyntax`.
- **BiomeJS** (single root `biome.json`): formatter + linter for all TS/JS/JSON — 120 columns, single quotes, 2-space indent. Per-project `lint` scripts run `biome check .`.
- **uv workspace** (root `pyproject.toml`): single lockfile and venv for all Python projects; `ruff` (lint + format, 120 cols, bandit security rules) and `mypy --strict`.
- **Vitest everywhere** for TS (jsdom for frontends, SWC transform for NestJS decorators); **pytest** for Python (`--import-mode=importlib`).
- **Husky**: pre-commit → lint-staged (Biome/Ruff on staged files); pre-push → `nx affected -t lint typecheck test build`.
- Python projects integrate with Nx through `project.json` run-commands (no third-party Nx plugins), so caching and `affected` cover them too.

## Local TLS

`./scripts/setup-certs.sh` uses mkcert to generate `infra/certs/localhost-{cert,key}.pem` (gitignored). Both Vite dev servers and the NestJS API read them; everything speaks HTTPS locally. In containers TLS is disabled (`API_TLS=false`) — production terminates TLS at the ingress.

## Security decisions

| Layer | Measure |
| --- | --- |
| Frontends | CSP meta tag (no `unsafe-inline` scripts, `object-src 'none'`, restricted `connect-src`), referrer policy, PWA served over HTTPS. Header-only directives (`frame-ancestors`, HSTS, `X-Content-Type-Options`, `Permissions-Policy`) must be set by the production edge/server — meta tags cannot express them. |
| API | helmet, strict CORS allowlist, global rate limiting (`@nestjs/throttler`), `ValidationPipe` with `whitelist` + `forbidNonWhitelisted`, zod-validated environment (fails fast on boot), graceful shutdown hooks. |
| Database | Two Postgres roles enforced in the database: `minerva_rw` (DML + DDL for migrations) and `minerva_ro` (SELECT only, kept current via `ALTER DEFAULT PRIVILEGES`). The API holds two Prisma clients, one per role. `scram-sha-256` auth everywhere. Local-only: `minerva_rw` has `CREATEDB` for Prisma's shadow database (`migrate dev`); production uses `migrate deploy`. |
| Queue | Valkey requires a password; workers ack only after successful handling, bounded retries, dead-letter stream. |
| Images | go-camo proxy — the API HMAC-signs image URLs, the proxy rejects unsigned requests (shared `CAMO_HMAC_KEY`). |
| Secrets | Only via environment; `.env` is gitignored, `.env.example` documents every variable with placeholders. Compose fails on missing variables (`:?` syntax). |
| Dependencies | Exact-pinned npm versions (`save-exact`), uv lockfile, Dependabot (npm, uv, docker, docker-compose, actions), `npm audit`, gitleaks, and CodeQL in CI. |
| Containers | Multi-stage builds, non-root `minerva` user, slim/alpine bases, `HEALTHCHECK`s, `.dockerignore` excludes secrets and certs. |
| Sentry | Wired in all five apps (`@sentry/react`, `@sentry/nestjs`, `sentry-sdk`), enabled only when a DSN env var is set, `sendDefaultPii: false`. |

## Event pipeline

Redis Streams on Valkey. The API publishes (`XADD minerva:events`); each worker is its own consumer group, so every worker sees every event. `libs/worker-core` owns the loop: `XREADGROUP` → handler → `XACK`, in-process retries with backoff, dead-lettering to `minerva:events:dlq`, `XAUTOCLAIM` of stale pending messages on startup, graceful SIGTERM/SIGINT shutdown, structured JSON logs (structlog), pydantic-settings config. A worker is: a name + a `handle(event)` function.

## CI / GitHub

- One workflow per project (`ci-<project>.yml`) with path filters covering the project, the libs it depends on, and root configs. **The path filters are maintained by hand** — update them when a project gains a dependency.
- `security.yml`: npm audit, gitleaks, CodeQL (JS/TS + Python), weekly schedule.
- `version-bump.yml`: when a merged PR into `main` carries a `version:major|minor|patch` label, the root `package.json` version is bumped, committed, and tagged `vX.Y.Z`. No label → no-op. Requires the workflow to be allowed to push to `main` (adjust branch protection accordingly, e.g. allow the github-actions bot to bypass).

## Deployment notes

Backends ship as individual images (`apps/api/Dockerfile`, `apps/email-parser/Dockerfile`, `apps/email-screenshot/Dockerfile`), built from the repo root. Kubernetes manifests are a later phase; images already run non-root with healthchecks. Frontend production hosting must add the security headers listed above and real PNG app icons (the SVG icons are placeholders).

## Adding a new project

- **TS app/lib**: `npx nx g @nx/react:application|library` or `@nx/js:library`, then: add the `lint` script (`biome check .`), Vitest setup (`test-setup.ts` + jest-dom), and run `npx nx sync`. For a Vite app copy the https/PWA/CSP setup from an existing app and reuse `tools/vite/vite-shared.ts`.
- **Python worker**: copy an existing worker (pyproject + `src/<pkg>/handler.py` + `main.py` + tests + `project.json`), add it to `[tool.uv.workspace].members` in the root `pyproject.toml`, run `uv sync --all-packages`, write the handler.
- In both cases: add a `ci-<project>.yml` workflow and, if containerized, a Dockerfile.
