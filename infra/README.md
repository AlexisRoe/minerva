# Infrastructure

Everything Minerva runs on locally, and how it is wired together. The root
[`README.md`](../README.md) covers the repository; this file covers the Docker stack.

```
infra/
  caddy/Caddyfile              the single ingress, one site block per hostname
  cert/                        mkcert output from `make certs` (gitignored)
  docker/docker-compose.yml    every service, split into profiles
  docker/Dockerfile.caddy      Caddy, optionally carrying the frontend bundles
  garage/                      object storage config + its one-shot init container
  postgres/init/               role creation, run once when the volume is created
  valkey/valkey.conf           persistence and eviction policy
```

## Tech stack

Every version is pinned exactly, in the file named in the last column — see
[ADR-I9](#adr-i9--every-image-pinned-to-an-exact-version). Nothing here is on `latest`.

| Component                                                   | Version         | What it does here                                                                   | Pinned in                                             |
| ----------------------------------------------------------- | --------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------- |
| [Caddy](https://caddyserver.com/docs/)                      | `2.10.2-alpine` | The single ingress: terminates TLS, routes by hostname, serves the frontend bundles | `docker/Dockerfile.caddy`                             |
| [PostgreSQL](https://www.postgresql.org/docs/18/index.html) | `18.4-alpine`   | The database, with three roles of differing privilege                               | `docker/docker-compose.yml`                           |
| [Valkey](https://valkey.io/docs/)                           | `9.1.1-alpine`  | Job queues, cache and the SSE fan-out                                               | `docker/docker-compose.yml`                           |
| [Garage](https://garagehq.deuxfleurs.fr/documentation/)     | `v2.3.0`        | S3-compatible object storage: one public bucket, one private                        | `docker/docker-compose.yml`, `garage/Dockerfile.init` |
| [go-camo](https://github.com/cactus/go-camo)                | `v2.7.5`        | Signed-URL image proxy for remote content in reported email                         | `docker/docker-compose.yml`                           |
| [Node.js](https://nodejs.org/docs/latest-v26.x/api/)        | `26.5.0-alpine` | Runtime for the two NestJS services and both Vite builds                            | each `Dockerfile`                                     |
| [Alpine](https://alpinelinux.org/)                          | `3.22`          | Base for the Garage init container, the one image built from scratch                | `garage/Dockerfile.init`                              |

### Reference documentation

**Caddy** — [documentation](https://caddyserver.com/docs/) ·
[Caddyfile directives](https://caddyserver.com/docs/caddyfile/directives) ·
[`reverse_proxy`](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy) ·
[`file_server`](https://caddyserver.com/docs/caddyfile/directives/file_server) ·
[`try_files`](https://caddyserver.com/docs/caddyfile/directives/try_files)

**PostgreSQL 18** — [manual](https://www.postgresql.org/docs/18/index.html) ·
[`GRANT`](https://www.postgresql.org/docs/18/sql-grant.html) ·
[`ALTER DEFAULT PRIVILEGES`](https://www.postgresql.org/docs/18/sql-alterdefaultprivileges.html) ·
[the `postgres` image](https://github.com/docker-library/docs/blob/master/postgres/README.md), whose
[initialisation scripts](https://github.com/docker-library/docs/blob/master/postgres/README.md#initialization-scripts)
are the thing to read before editing `postgres/init/`

**Valkey** — [documentation](https://valkey.io/docs/) ·
[the annotated valkey.conf](https://valkey.io/topics/valkey.conf/) ·
[persistence](https://valkey.io/topics/persistence/) ·
[eviction policies](https://valkey.io/topics/lru-cache/) ·
[pub/sub](https://valkey.io/topics/pubsub/), which is *not* database-scoped

**Redis** — Valkey is a fork of Redis 7.2 and remains protocol-compatible, so client libraries,
the `redis://` URL scheme and most of the older material still apply. The
[Redis command reference](https://redis.io/docs/latest/commands/) is often the faster lookup, and
[the Valkey blog](https://valkey.io/blog/) explains why two sets of docs
exist for one wire protocol.

**BullMQ** — [documentation](https://docs.bullmq.io/) ·
[going to production](https://docs.bullmq.io/guide/going-to-production), which is where the
`maxmemory-policy noeviction` requirement in `valkey/valkey.conf` comes from ·
[connections](https://docs.bullmq.io/guide/connections). Not a dependency yet — no package in the
workspace imports it — but it is what the Valkey configuration is written for, and
[ADR-I4](#adr-i4--one-valkey-noeviction-and-ttls-on-the-cache) is the decision it forced.

**Garage** — [documentation](https://garagehq.deuxfleurs.fr/documentation/) ·
[quick start](https://garagehq.deuxfleurs.fr/documentation/quick-start/) ·
[configuration reference](https://garagehq.deuxfleurs.fr/documentation/reference-manual/configuration/) ·
[the CLI](https://garagehq.deuxfleurs.fr/documentation/reference-manual/cli/) ·
[admin API](https://garagehq.deuxfleurs.fr/documentation/reference-manual/admin-api/), which
`garage/init.sh` reads the node id from ·
[S3 compatibility](https://garagehq.deuxfleurs.fr/documentation/reference-manual/s3-compatibility/)

**go-camo** — [repository and README](https://github.com/cactus/go-camo) ·
[how it works](https://github.com/cactus/go-camo#how-it-works), which is where the signed URL
format is defined ·
[environment variables](https://github.com/cactus/go-camo#environment-vars), the reason the compose
file sets `GOCAMO_HMAC` rather than a `CAMO_KEY` of its own ·
[securing an installation](https://github.com/cactus/go-camo#securing-an-installation) ·
[the original camo](https://github.com/atmos/camo), which defined the scheme

**Docker** — [Compose file reference](https://docs.docker.com/reference/compose-file/) ·
[profiles](https://docs.docker.com/compose/how-tos/profiles/) ·
[`depends_on` conditions](https://docs.docker.com/reference/compose-file/services/#depends_on) ·
[Dockerfile reference](https://docs.docker.com/reference/dockerfile/) ·
[multi-stage builds](https://docs.docker.com/build/building/multi-stage/)

**mkcert** — [repository](https://github.com/FiloSottile/mkcert), which produces the one
certificate every service in this stack terminates TLS with.

## Starting it

The Makefile is the interface — it checks the preconditions, selects the profiles and prints
the URLs.

| Command        | What starts                                                 |
| -------------- | ----------------------------------------------------------- |
| `make infra`   | postgres, valkey, garage, camo, caddy                       |
| `make api`     | the api, plus the background services it depends on         |
| `make backend` | every backend service: api and queue coordinator            |
| `make up`      | the above, plus the button and manager built for production |
| `make down`    | stops all of it; volumes survive                            |
| `make logs`    | follows whatever is running                                 |

Each row is a superset of the one above it. `depends_on` pulls a service in even when its own
profile was not selected, so `make api` starts Postgres without naming the `infra` profile.

First run, on a fresh checkout:

```sh
make setup     # tooling check, .env, credentials, certificates, install, shared libs
make infra
```

`make setup` calls `make secrets` (`scripts/bootstrap-secrets.sh`), which fills every credential
the stack needs but nobody chooses — the Postgres and Valkey passwords, Garage's RPC secret,
admin token and S3 key pair, go-camo's HMAC key — each in the shape its consumer demands, since
Garage will not accept a base64 RPC secret and go-camo parses its key as hex.

It never replaces a value that is already there. Rotating one is a deliberate act, with
consequences worth thinking about first:

```sh
make secrets                              # fill whatever is still empty
DRY_RUN=1 make secrets                     # say what it would do
FORCE=1 make secret VAR=INFRA_CAMO_KEY     # rotate one on purpose
```

Compose fails loudly and by name if a required credential is still empty; that is the `:?` in
the compose file rather than a service that starts and then cannot authenticate.

### Changing a credential after the fact

Two of these services read their credentials exactly once, when their volume is created (see
[Things that only happen once](#things-that-only-happen-once)), so editing `.env` afterwards
changes nothing until the volume is gone. Both destroy data and both ask first:

```sh
make reset-db        # drop the Postgres volume, re-create the database and its three roles
make reset-storage   # drop the Garage volumes, re-create the buckets and the access key
```

## What is reachable, and from where

Caddy is the only way in. It terminates TLS with the mkcert pair from `make certs` and routes
by hostname, so every service keeps the port it already owned in `.env.template` — the
dockerised button answers on the same URL its Vite dev server does. The two are mutually
exclusive by design.

| URL                               | Service                    | Started by   |
| --------------------------------- | -------------------------- | ------------ |
| `https://api.localhost:4401`      | the api                    | `make api`   |
| `https://reporter.localhost:4101` | the reporting button       | `make up`    |
| `https://manager.localhost:4201`  | the manager                | `make up`    |
| `https://assets.localhost:4501`   | the public `assets` bucket | `make infra` |
| `https://proxy.localhost:4502`    | the go-camo image proxy    | `make infra` |

Bound to `127.0.0.1` for a debugger or a database client, not for the application:

| Address          | What                                 |
| ---------------- | ------------------------------------ |
| `127.0.0.1:5432` | Postgres                             |
| `127.0.0.1:6379` | Valkey                               |
| `127.0.0.1:3900` | Garage's signed S3 API               |
| `127.0.0.1:9229` | the api's V8 inspector               |
| `127.0.0.1:9230` | the queue coordinator's V8 inspector |

**Internal only.** The queue coordinator has no published port and no Caddy site block: it is
reached at `http://queue-coordinator:4301` from inside the compose network and from nowhere
else. The queue family is numbered from 4301 upwards — 4301 the coordinator, 4302
`worker-email-parser`, 4303 `worker-email-screenshot`. Those are container ports, so they
share the number space with nothing on the host; 4301 is also Storybook's host port and the
two can never meet.

The Python workers have no compose service yet — both directories currently hold nothing but a
README. When they gain code they take 4302 and 4303, and the same "no published port" rule.

## Where configuration comes from

One `.env` at the repository root holds every value, namespaced per service (`BE_API_*`,
`APP_FE_RB_*`, `INFRA_*`). The services themselves read unprefixed names. Bridging the two is
what the `environment:` blocks in the compose file are for:

```
.env                       docker-compose.yml              the service
BE_API_COOKIE_SECRET   ->  COOKIE_SECRET: ${BE_API_...} -> EnvironmentVariables.COOKIE_SECRET
```

So one Sentry DSN variable per service in `.env`, and a single `SENTRY_DSN` inside each
container. Adding a variable means four edits, in this order:

1. `.env.template`, prefixed, with a comment saying what it is for
2. the service's `environment:` block in `infra/docker/docker-compose.yml`, unprefixed
3. a field with `class-validator` decorators on `EnvironmentVariables`
   (`apps/backend/api/src/plattform/environment/interface/environment.interface.ts`)
4. a getter on `EnvironmentService`, which decides what absence means for that one variable

A name misspelled at step 2 fails the api's boot validation with the offending variable named
on its own line, which is the point of doing it this way rather than reading `process.env`.

## Things that only happen once

Two of these services configure themselves on first boot and then never again. Both are easy
to trip over, because editing the file that describes the setup does nothing to a volume that
already exists.

**Postgres roles.** `infra/postgres/init/01-roles.sh` runs from the image's
`docker-entrypoint-initdb.d`, which the entrypoint executes *only* when it initialises an empty
data directory. Changing a password in `.env` afterwards changes nothing until the volume is
gone, which is what `make reset-db` does — along with every row in it.

**Garage layout, buckets and key.** `garage-init` is a one-shot container that runs
`infra/garage/init.sh`, and every step in it checks before it acts — a second `make infra`
finds the layout applied, the buckets present and the key imported, and does nothing. Every
backend service waits for it with `condition: service_completed_successfully`, so nothing
starts against a half-configured store.

The S3 credentials come from `.env` rather than being generated by Garage, so they survive a
rebuild. A generated key would have to be copied out of a container log by hand after every
`docker volume rm`.

## Architecture decisions

### ADR-I1 — Garage for object storage, not MinIO or LocalStack

The root README used to describe LocalStack. LocalStack emulates S3 for tests and is not
something to keep data in; MinIO's licence changed and its single-node story has been narrowing
since. Garage is a small Rust binary, AGPL, built for exactly this shape of deployment, and it
has one feature the alternatives make awkward: a website endpoint that serves a bucket
unauthenticated, which is how `assets.localhost` works without the frontend holding an S3
credential.

The cost is that Garage needs a cluster layout before it will accept a single byte — hence the
`garage-init` container, which exists purely to make that a thing nobody has to know about.

### ADR-I2 — Postgres 18, not 19

The specification asked for Postgres 19. There is no stable 19 to pin: 18 is the current major
and 19 is expected around September 2026. Pinning a beta tag would mean a database that can
change under a `docker compose pull`, in exchange for nothing anybody here needs yet.

`postgres:18.4-alpine`, pinned to the patch. Bumping to 19 is a one-line change in the compose
file plus a `pg_dump`/restore across the major, whenever it ships and is worth having.

### ADR-I3 — Three Postgres roles, and migrations do not run as the application

`minerva_app` owns the schema, `minerva_rw` reads and writes rows, `minerva_ro` only reads. The
application connects as `minerva_rw`, which means an application bug cannot drop a table, and
`ALTER DEFAULT PRIVILEGES FOR ROLE minerva_app` means a migration that adds a table does not
also have to remember to grant on it.

The separation is worth more in production than locally, which is exactly why it is set up
locally: a permission that only exists in production is a permission that is first tested
there.

### ADR-I4 — One Valkey, `noeviction`, and TTLs on the cache

BullMQ requires `maxmemory-policy noeviction`, and it is not a preference: its queues are
ordinary keys, so an evicted key is a job that disappeared without ever being marked failed.
The policy is server-wide, so one instance means one answer for queues, cache and SSE alike.

The consequence is that everything cached here carries a TTL of its own instead of relying on
Valkey to make room, and that reaching `maxmemory` is a hard error rather than a slow
degradation. Accepted, because a second Valkey is a second thing to run, back up and reason
about, for a cache that is currently hypothetical. If cache pressure ever makes this the wrong
trade, the fix is that second instance — not a change to the policy.

Databases 0, 1 and 2 are assigned to queues, cache and SSE. That is convention, not
enforcement, and pub/sub ignores it entirely: a message published on one database reaches
subscribers on all of them, so SSE channel names carry their own prefix.

### ADR-I5 — The frontends are built into the Caddy image

`infra/docker/Dockerfile.caddy` has two final targets: `proxy` is Caddy alone, and
`proxy-with-frontends` additionally builds the button and the manager and copies their `dist/`
to `/srv/reporter` and `/srv/manager`. Only `make up` asks for the second.

The alternative — a container per frontend, each with its own web server, proxied by Caddy —
adds two containers and two more places for a cache header to be wrong, to serve files that
never change while the container is alive. One ingress serving them directly is less machinery
for the same result.

Two targets rather than one because Caddy is always running: `make infra` must not pay for two
Vite builds it has no use for. With the plain `proxy` target the two directories exist but are
empty, and the frontend site blocks return 404 — the honest answer to "no frontend was built".

### ADR-I6 — `config.json` is baked at build time, for now

The frontends read their settings from a `config.json` that `vite.runtime-config.ts` emits
next to the bundle, precisely so that a new Sentry DSN does not mean a new build. Building the
bundle inside an image gives that up: the values are passed as build args and frozen when the
image is built.

Acceptable here because these images are rebuilt by `make up` on every run and never promoted
between stages. If they ever are, the way out is an entrypoint that rewrites `config.json`
before Caddy starts — the file is already deliberately unhashed and served `no-store` for
exactly that reason.

### ADR-I7 — One hostname per service, on the port that service already owned

Caddy routes by `Host`, so every site could share one port. Instead each keeps the port it has
in `.env.template`: the api on 4401, the button on 4101, the manager on 4201. Nothing new to
learn, the existing documentation stays true, and running the dockerised button while its Vite
dev server is up is a port conflict rather than a confusing pair of tabs.

The cost is that `make certs` has to list every hostname explicitly — a `*.localhost` wildcard
is not valid, because browsers and OpenSSL both refuse a wildcard whose parent is a
single-label TLD. `scripts/generate-certs.sh` regenerates whenever `CERT_DOMAINS` no longer
matches the certificate, so adding a service is one line there.

### ADR-I8 — The queue coordinator is not published

It accepts jobs from the api and the workers, all of which reach it by service name on the
compose network. It has no authentication of its own, and a published port would be an
invitation to POST a job into it from outside. Its V8 inspector is published on `127.0.0.1`,
because a debugger runs on the host and that is a development tool rather than a service.

### ADR-I9 — Every image pinned to an exact version

`caddy:2.10.2-alpine`, `postgres:18.4-alpine`, `valkey/valkey:9.1.1-alpine`,
`dxflrs/garage:v2.3.0`, `ghcr.io/cactus/go-camo:v2.7.5`, `node:26.5.0-alpine`. No `latest`
anywhere, so a rebuild is never an upgrade nobody asked for, and two machines running
`make infra` on the same commit run the same software.

`infra/garage/Dockerfile.init` pins the Garage version separately and must be kept in step with
the compose file: the CLI and the node speak a versioned RPC protocol and refuse each other
across a major.
