# syntax=docker/dockerfile:1.10
#
# @minerva/queue-coordinator — NestJS
#
# The build context is the *repository root*, not this directory: the coordinator
# is a pnpm workspace member and needs the root lockfile, the version catalog and
# shared/typescript-lib to install and build.
#
#   docker build -f apps/backend/queue-coordinator/Dockerfile --target production .
#
# Targets:
#   development  hot reload + inspector on 9229, sources arrive via bind mount
#   production   pruned runtime, non-root, dist only, no package manager
#
# infra/docker/docker-compose.yml builds `development` by default.
#
# Structurally identical to apps/backend/api/Dockerfile — the comments there
# explain why each step looks the way it does. The differences are the workspace
# filter, and that this service listens on a port it is told rather than a fixed
# one: the queue family is numbered from 4301 upwards, and none of those ports is
# published.

ARG NODE_VERSION=26.5.0

# --------------------------------------------------------------------- base --
FROM node:${NODE_VERSION}-alpine AS base

ENV HOME=/home/node \
    PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    HUSKY=0

COPY package.json /tmp/root-package.json
RUN npm install --global "pnpm@$(node -p "require('/tmp/root-package.json').packageManager.split('@').pop()")" \
    && rm /tmp/root-package.json \
    && mkdir -p /app /pnpm \
    && chown -R node:node /app /pnpm /home/node

WORKDIR /app
USER node

# --------------------------------------------------------------------- deps --
FROM base AS deps

COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY --chown=node:node apps/backend/queue-coordinator/package.json apps/backend/queue-coordinator/
COPY --chown=node:node shared/typescript-lib/package.json shared/typescript-lib/

RUN --mount=type=cache,target=/pnpm/store,uid=1000,gid=1000 \
    pnpm install --frozen-lockfile --filter @minerva/queue-coordinator... --store-dir /pnpm/store

# -------------------------------------------------------------------- build --
FROM deps AS build

COPY --chown=node:node tsconfig.base.json tsconfig.backend.json ./
COPY --chown=node:node shared/typescript-lib shared/typescript-lib
COPY --chown=node:node apps/backend/queue-coordinator apps/backend/queue-coordinator

RUN pnpm --filter @minerva/typescript-lib build \
    && pnpm --filter @minerva/queue-coordinator build

RUN --mount=type=cache,target=/pnpm/store,uid=1000,gid=1000 \
    pnpm install --frozen-lockfile --prod --ignore-scripts --filter @minerva/queue-coordinator... \
        --store-dir /pnpm/store --config.confirmModulesPurge=false \
    && mkdir -p shared/typescript-lib/node_modules apps/backend/queue-coordinator/node_modules

# -------------------------------------------------------------- development --
FROM deps AS development

# The port is not fixed here the way the api's is. `main.ts` reads
# QUEUE_COORDINATOR_PORT and falls back to 3001; compose passes BE_QUEUE_PORT's
# value, and this default keeps a bare `docker run` working.
ENV NODE_ENV=development \
    QUEUE_COORDINATOR_PORT=4301

COPY --chown=node:node tsconfig.base.json tsconfig.backend.json ./
COPY --chown=node:node shared/typescript-lib shared/typescript-lib
COPY --chown=node:node apps/backend/queue-coordinator apps/backend/queue-coordinator

RUN pnpm --filter @minerva/typescript-lib build

WORKDIR /app/apps/backend/queue-coordinator

# 9229 = V8 inspector. The service port is not exposed: nothing outside the
# compose network is meant to reach it, and EXPOSE is documentation that would
# say otherwise.
EXPOSE 9229

# `pnpm run`, not `pnpm exec`: only the former exports the manifest as
# `npm_package_name` / `npm_package_version`, which the service reads for its own
# identity.
CMD ["pnpm", "run", "dev:docker"]

# --------------------------------------------------------------- production --
FROM node:${NODE_VERSION}-alpine AS production

ENV NODE_ENV=production \
    QUEUE_COORDINATOR_PORT=4301

WORKDIR /app
USER node

COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/pnpm-workspace.yaml ./
COPY --from=build --chown=node:node /app/shared/typescript-lib/package.json ./shared/typescript-lib/
COPY --from=build --chown=node:node /app/shared/typescript-lib/node_modules ./shared/typescript-lib/node_modules
COPY --from=build --chown=node:node /app/shared/typescript-lib/dist ./shared/typescript-lib/dist
COPY --from=build --chown=node:node /app/apps/backend/queue-coordinator/package.json ./apps/backend/queue-coordinator/
COPY --from=build --chown=node:node /app/apps/backend/queue-coordinator/node_modules ./apps/backend/queue-coordinator/node_modules
COPY --from=build --chown=node:node /app/apps/backend/queue-coordinator/dist ./apps/backend/queue-coordinator/dist

WORKDIR /app/apps/backend/queue-coordinator

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.QUEUE_COORDINATOR_PORT||3001)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

STOPSIGNAL SIGTERM

CMD ["node", "dist/main.js"]
