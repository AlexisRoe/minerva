# syntax=docker/dockerfile:1
# Build from the repository root:  docker build -f apps/api/Dockerfile .

FROM node:26.5.1-alpine3.24 AS deps
WORKDIR /workspace
COPY package.json package-lock.json .npmrc ./
COPY apps/api/package.json apps/api/
COPY libs/shared/package.json libs/shared/
RUN npm ci --ignore-scripts

FROM deps AS build
ENV NX_DAEMON=false
COPY nx.json tsconfig.base.json tsconfig.json biome.json ./
COPY libs/shared libs/shared
COPY apps/api apps/api
# nx sync first: the image contains only api + shared, so TS project references must be regenerated.
RUN npx nx sync && npx nx build api

FROM deps AS prod-deps
RUN npm ci --omit=dev --ignore-scripts

FROM node:26.5.1-alpine3.24 AS runtime
ENV NODE_ENV=production
WORKDIR /workspace
RUN addgroup -S minerva && adduser -S minerva -G minerva
COPY --from=prod-deps --chown=minerva:minerva /workspace/node_modules node_modules
COPY --from=build --chown=minerva:minerva /workspace/libs/shared libs/shared
COPY --from=build --chown=minerva:minerva /workspace/apps/api/dist apps/api/dist
COPY --from=build --chown=minerva:minerva /workspace/apps/api/package.json apps/api/package.json
USER minerva
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["node", "-e", "fetch('http://localhost:3000/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
CMD ["node", "apps/api/dist/main.js"]
