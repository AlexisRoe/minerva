# syntax=docker/dockerfile:1.10
#
# @minerva/api — NestJS
#
# The build context is the *repository root*, not this directory: the api is a
# pnpm workspace member and needs the root lockfile, the version catalog and
# shared/typescript-lib to install and build.
#
#   docker build -f apps/backend/api/Dockerfile --target production .
#
# Targets:
#   development  hot reload + inspector on 9229, sources arrive via bind mount
#   production   pruned runtime, non-root, dist only, no package manager
#
# infra/docker/docker-compose.api.yml builds `development` by default.

ARG NODE_VERSION=26.5.0

# --------------------------------------------------------------------- base --
# Everything below runs as the unprivileged `node` user (uid 1000). Doing that
# from the first layer keeps ownership correct without a `chown -R` on
# node_modules later, which would double the image size.
FROM node:${NODE_VERSION}-alpine AS base

ENV HOME=/home/node \
    PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    # The root `prepare` script installs husky's git hooks; there is no .git here.
    HUSKY=0

# Node 26 no longer ships corepack, so pnpm is installed by hand — with the
# version taken from `packageManager` in the root manifest rather than pinned
# a second time here, so the image cannot drift from the lockfile's pnpm.
COPY package.json /tmp/root-package.json
RUN npm install --global "pnpm@$(node -p "require('/tmp/root-package.json').packageManager.split('@').pop()")" \
    && rm /tmp/root-package.json \
    && mkdir -p /app /pnpm \
    && chown -R node:node /app /pnpm /home/node

WORKDIR /app
USER node

# --------------------------------------------------------------------- deps --
# Manifests only, so this layer is reused until a package.json or the lockfile
# changes.
#
# Only the api and the one library it depends on enter the image. The other
# workspace members (queue-coordinator, both frontends, ui-lib) are simply not
# copied: pnpm finds no directory for them, drops them from the workspace, and
# `--frozen-lockfile` still validates against the shared lockfile. The root
# manifest comes along because it pins the pnpm version and the catalog.
FROM base AS deps

COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY --chown=node:node apps/backend/api/package.json apps/backend/api/
COPY --chown=node:node shared/typescript-lib/package.json shared/typescript-lib/

RUN --mount=type=cache,target=/pnpm/store,uid=1000,gid=1000 \
    pnpm install --frozen-lockfile --filter @minerva/api... --store-dir /pnpm/store

# -------------------------------------------------------------------- build --
FROM deps AS build

COPY --chown=node:node tsconfig.base.json tsconfig.backend.json ./
COPY --chown=node:node shared/typescript-lib shared/typescript-lib
COPY --chown=node:node apps/backend/api apps/backend/api

# The api resolves @minerva/typescript-lib through its built dist/, so the
# library has to be compiled before nest build typechecks against it.
RUN pnpm --filter @minerva/typescript-lib build \
    && pnpm --filter @minerva/api build

# Drop devDependencies in place. The layout under /app stays identical, so the
# relative symlinks from each package's node_modules into node_modules/.pnpm
# keep resolving after they are copied into the runtime stage.
#
# Narrowing a full install to --prod makes pnpm rebuild node_modules from
# scratch, and it will not do that unprompted without a TTY; there is nothing to
# confirm in a throwaway build stage. The mkdir keeps the COPYs below valid for
# packages that end up with no production dependencies of their own.
# `--ignore-scripts` because the only lifecycle scripts in play are the root's
# `prepare` (husky, a devDependency that no longer exists at this point) and
# @swc/core's postinstall, which is dev-only too — `allowBuilds` in
# pnpm-workspace.yaml lists nothing that ships to production.
RUN --mount=type=cache,target=/pnpm/store,uid=1000,gid=1000 \
    pnpm install --frozen-lockfile --prod --ignore-scripts --filter @minerva/api... \
        --store-dir /pnpm/store --config.confirmModulesPurge=false \
    && mkdir -p shared/typescript-lib/node_modules apps/backend/api/node_modules

# -------------------------------------------------------------- development --
# Sources are bind-mounted over src/ by compose; the image only provides the
# toolchain, node_modules and a compiled typescript-lib. Changing the library
# therefore needs `make api-build`, changing the api does not.
FROM deps AS development

# API_PORT is container-internal and deliberately fixed: only Caddy talks to it,
# over the compose network, so it never meets a port on the host. The port the
# api is *reachable* on is BE_API_PORT, which Caddy publishes.
ENV NODE_ENV=development \
    API_PORT=3000

COPY --chown=node:node tsconfig.base.json tsconfig.backend.json ./
COPY --chown=node:node shared/typescript-lib shared/typescript-lib
COPY --chown=node:node apps/backend/api apps/backend/api

RUN pnpm --filter @minerva/typescript-lib build

WORKDIR /app/apps/backend/api

# 3000 = HTTP (Caddy proxies to it), 9229 = V8 inspector.
EXPOSE 3000 9229

# The inspector binds to 0.0.0.0 because a debugger attaches from the host;
# the port is published on 127.0.0.1 only, so it stays off the network.
CMD ["pnpm", "exec", "nest", "start", "--debug", "0.0.0.0:9229", "--watch", "--preserveWatchOutput"]

# --------------------------------------------------------------- production --
FROM node:${NODE_VERSION}-alpine AS production

# See the note on the development stage: internal port, not a published one.
ENV NODE_ENV=production \
    API_PORT=3000

WORKDIR /app
USER node

COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/pnpm-workspace.yaml ./
COPY --from=build --chown=node:node /app/shared/typescript-lib/package.json ./shared/typescript-lib/
COPY --from=build --chown=node:node /app/shared/typescript-lib/node_modules ./shared/typescript-lib/node_modules
COPY --from=build --chown=node:node /app/shared/typescript-lib/dist ./shared/typescript-lib/dist
COPY --from=build --chown=node:node /app/apps/backend/api/package.json ./apps/backend/api/
COPY --from=build --chown=node:node /app/apps/backend/api/node_modules ./apps/backend/api/node_modules
COPY --from=build --chown=node:node /app/apps/backend/api/dist ./apps/backend/api/dist

WORKDIR /app/apps/backend/api

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.API_PORT||3000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Nest's shutdown hooks only fire if the signal reaches node. As PID 1 node
# ignores signals it has no handler for, so run the container with an init
# process (`init: true` in compose, `docker run --init`).
STOPSIGNAL SIGTERM

CMD ["node", "dist/main.js"]
