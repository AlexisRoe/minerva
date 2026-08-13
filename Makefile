.DEFAULT_GOAL := help

.PHONY: help setup check-deps install build-libs certs copy-env secret secrets reset-db reset-storage icons fonts dev dev-manager dev-button shutdown-fe preflight infra api backend up down logs docker-build api-build api-logs api-down build verify verify-i18n verify-i18n-verbose test typecheck lint format storybook

# Defaults for `make icons` (override on the command line)
OUT ?= ./icons

# The dockerised stack. docker compose interpolates the compose file from the
# root .env; the ports are read here too so the URLs printed at the end match
# whatever Caddy actually bound.
COMPOSE := docker compose --env-file .env -f infra/docker/docker-compose.yml

# Kept as its own variable: `make api-logs` and `make api-down` predate the rest
# of the stack and still mean what they always did.
API_COMPOSE := $(COMPOSE)

env_port = $(or $(shell sed -n 's/^$(1)=//p' .env 2>/dev/null | tail -1),$(2))

# The long-lived services, named explicitly because `up --wait` treats *any*
# container that has exited as a failure — including garage-init, whose whole
# job is to do its work and exit 0. Naming these leaves it to `depends_on` and
# `service_completed_successfully`, which is where waiting for it belongs.
INFRA_SERVICES := caddy postgres valkey garage camo
BACKEND_SERVICES := api queue-coordinator

API_PORT := $(call env_port,BE_API_PORT,4401)
BUTTON_PORT := $(call env_port,APP_FE_RB_PORT,4101)
MANAGER_PORT := $(call env_port,APP_FE_MANANGER_PORT,4201)
ASSETS_PORT := $(call env_port,INFRA_GARAGE_WEB_PORT,4501)
CAMO_PORT := $(call env_port,INFRA_CAMO_PORT,4502)

# Defaults for `make verify-i18n` (override on the command line)
I18N_PROJECTS ?= apps/frontend/minerva-button
I18N_LANG ?= en
I18N_FLAGS ?=

help: ## Show this help
	@echo "Available commands:"
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z0-9_-]+:.*##/ { printf "  \033[36m%-13s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

# Everything a fresh checkout needs before `make infra` or `make dev` will work,
# in the order the steps depend on each other. Safe to re-run: copy-env backs up
# an existing .env, certs only regenerate what has expired or lost a name, and
# secrets never replaces a value that is already there.
setup: ## Prepare a fresh checkout: deps, .env, secrets, certs, install, shared libs (stops at the first failure)
	@$(MAKE) --no-print-directory check-deps
	@if [ ! -f .env ]; then $(MAKE) --no-print-directory copy-env; fi
	@$(MAKE) --no-print-directory secrets
	@$(MAKE) --no-print-directory certs
	@$(MAKE) --no-print-directory install
	@$(MAKE) --no-print-directory build-libs

check-deps: ## Check that required local tooling (homebrew, pnpm, node, docker, make, openssl) is installed
	@bash scripts/check-dependencies.sh

install: ## Install project dependencies with pnpm
	@pnpm install

# The apps consume the shared libraries through their built dist/ (see the `main`,
# `types` and `exports` fields in shared/*/package.json), and dist/ is gitignored.
# A checkout that has never built them — or that pulled a change to shared/** —
# therefore typechecks against stale or absent declarations. Anything that reads
# those declarations must depend on this target.
build-libs: ## Build the shared libraries the apps typecheck and bundle against
	@pnpm --filter @minerva/typescript-lib --filter @minerva/ui-lib build

certs: ## Create/renew local TLS certificates (mkcert) for the frontends, ui-lib, and docker services
	@bash scripts/generate-certs.sh

copy-env: ## Create the local .env from .env.template (backs up an existing .env)
	@bash scripts/initial-setup.sh

# One call per credential the stack needs but nobody chooses, each in the shape
# its consumer demands — Garage will not take a base64 RPC secret. Anything
# already filled in is left alone, so this is safe on every run.
secrets: ## Fill every empty credential in .env with a generated one (DRY_RUN=1 to preview)
	@bash scripts/bootstrap-secrets.sh

# The single-value version of the above. Without VAR the secret is printed and
# nothing is touched, so `make secret | pbcopy` works. With VAR it is written
# into .env, and an existing value is kept unless FORCE=1 — rotating one
# invalidates everything already signed with it.
secret: ## Generate a random secret; VAR=NAME writes it into .env (HEX=1 for 64 hex chars, FORCE=1 to replace)
	@HEX="$(HEX)" bash scripts/generate-secret.sh "$(VAR)"

dev: ## Run every app in watch mode (builds the ui-lib first)
	@pnpm dev

dev-manager: ## Run only minerva-manager on https://localhost:4201 (builds the ui-lib first)
	@pnpm --filter @minerva/ui-lib build && pnpm --filter @minerva/manager dev

dev-button: ## Run only minerva-button on https://localhost:4101 (builds the ui-lib first)
	@pnpm --filter @minerva/ui-lib build && pnpm --filter @minerva/button dev

# Blunt on purpose: SIGTERM, then SIGKILL. Only processes whose command line
# mentions `vite` are touched — see the guard in the script.
shutdown-fe: ## DANGEROUS: force-kill the button and manager dev servers (DRY_RUN=1 to preview)
	@bash scripts/shutdown-frontends.sh

# `docker compose up` needs both preconditions before it can start: the .env it
# interpolates, and the certificate Caddy terminates TLS with. Checked here
# rather than letting compose fail with its own, less obvious message. Every
# docker target depends on this, which is why it is a target and not four copies.
#
# The certificate check runs every time rather than only when the files are
# missing, because the failure it catches is a certificate that exists and is
# trusted but does not carry the hostname you opened — which shows up as a name
# mismatch in the browser and nowhere else. `--quiet` says nothing unless it
# actually had to write one.
preflight:
	@if [ ! -f .env ]; then \
		echo "No .env found. Run: make copy-env" >&2; \
		exit 1; \
	fi
	@bash scripts/generate-certs.sh --quiet

# The four ways to bring the stack up, in order of how much of it they start.
# Each is a superset of the one above: compose pulls a dependency in even when
# its own profile was not selected, so `infra` is never named twice.
infra: preflight ## Run the background services only: postgres, valkey, garage, camo, caddy
	@$(COMPOSE) --profile infra up --build --detach --wait $(INFRA_SERVICES)
	@echo
	@echo "  postgres 127.0.0.1:$(call env_port,INFRA_POSTGRES_PORT,5432)  (db $(call env_port,INFRA_POSTGRES_DB,minerva))"
	@echo "  valkey   127.0.0.1:$(call env_port,INFRA_VALKEY_PORT,6379)"
	@echo "  s3 api   127.0.0.1:$(call env_port,INFRA_GARAGE_S3_PORT,3900)  (buckets: assets, artifacts)"
	@echo "  assets   https://assets.localhost:$(ASSETS_PORT)"
	@echo "  proxy    https://proxy.localhost:$(CAMO_PORT)"
	@echo "  logs     make logs"

api: preflight ## Run the api in Docker behind Caddy on https://api.localhost:BE_API_PORT (hot reload + inspector)
	@$(COMPOSE) --profile api up --build --detach --wait $(INFRA_SERVICES) api
	@echo
	@echo "  api      https://api.localhost:$(API_PORT)  (also https://localhost:$(API_PORT))"
	@echo "  health   https://api.localhost:$(API_PORT)/health"
	@echo "  debugger 127.0.0.1:$(call env_port,BE_API_DEBUG_PORT,9229) — VS Code: 'Attach to api (Docker)'"
	@echo "  logs     make logs"

# The queue coordinator has no URL to print: it listens on the compose network
# only, and the inspector is the one thing about it that reaches the host.
backend: preflight ## Run every backend service in Docker: the api and the queue coordinator
	@$(COMPOSE) --profile backend up --build --detach --wait $(INFRA_SERVICES) $(BACKEND_SERVICES)
	@echo
	@echo "  api      https://api.localhost:$(API_PORT)"
	@echo "  queue    internal only — http://queue-coordinator:$(call env_port,BE_QUEUE_PORT,4301)"
	@echo "  debugger 127.0.0.1:$(call env_port,BE_QUEUE_DEBUG_PORT,9230) — the queue coordinator"
	@echo "  logs     make logs"

# The frontends are built into the Caddy image rather than served by a dev
# server, so this target rebuilds that image — two Vite builds, which is why no
# other target sets the variable.
up: preflight ## Run everything: the backend services plus the button and manager, served by Caddy
	@MINERVA_CADDY_TARGET=proxy-with-frontends $(COMPOSE) --profile backend up --build --detach --wait $(INFRA_SERVICES) $(BACKEND_SERVICES)
	@echo
	@echo "  api      https://api.localhost:$(API_PORT)"
	@echo "  button   https://reporter.localhost:$(BUTTON_PORT)"
	@echo "  manager  https://manager.localhost:$(MANAGER_PORT)"
	@echo "  assets   https://assets.localhost:$(ASSETS_PORT)"
	@echo "  proxy    https://proxy.localhost:$(CAMO_PORT)"
	@echo "  logs     make logs"

# `--profile '*'` so this stops what any of the targets above started, whichever
# one it was. Volumes are kept: dropping the database is `docker volume rm`, and
# it should take more than a typo.
down: ## Stop every service and remove its containers (volumes are kept)
	@$(COMPOSE) --profile '*' down

# The Postgres roles and their passwords are created by
# infra/postgres/init/01-roles.sh, which the image runs *only* when it
# initialises an empty data directory. Changing a password in .env therefore does
# nothing until the volume is gone — which is what this does, along with every
# row in it.
reset-db: ## DESTRUCTIVE: drop the Postgres volume and re-create the database and its roles from .env
	@printf "This deletes the Minerva database and everything in it. Continue? [y/N] "
	@read -r reply; [ "$$reply" = "y" ] || [ "$$reply" = "Y" ] || { echo "Nothing changed."; exit 1; }
	@$(COMPOSE) --profile '*' down
	@docker volume rm minerva_postgres-data
	@$(MAKE) --no-print-directory infra

# Same shape, for the object store: Garage's layout, buckets and access key are
# created once by garage-init, so a changed S3 credential needs the volumes gone.
reset-storage: ## DESTRUCTIVE: drop the Garage volumes and re-create the buckets and key from .env
	@printf "This deletes both buckets and everything stored in them. Continue? [y/N] "
	@read -r reply; [ "$$reply" = "y" ] || [ "$$reply" = "Y" ] || { echo "Nothing changed."; exit 1; }
	@$(COMPOSE) --profile '*' down
	@docker volume rm minerva_garage-meta minerva_garage-data
	@$(MAKE) --no-print-directory infra

logs: ## Follow the logs of everything currently running
	@$(COMPOSE) logs --follow

# The targets above already pass --build, which rebuilds every layer whose inputs
# changed. This is the escape hatch for when the cache itself is the problem.
docker-build: ## Force a full rebuild of every image, ignoring the layer cache
	@$(COMPOSE) --profile '*' build --no-cache

api-build: ## Force a full rebuild of the api image, ignoring the layer cache
	@$(API_COMPOSE) build --no-cache api

api-logs: ## Follow the logs of the api and the proxy in front of it
	@$(API_COMPOSE) logs --follow api caddy

api-down: ## Stop the api stack and remove its containers
	@$(API_COMPOSE) --profile '*' down

build: ## Build every workspace package in dependency order
	@pnpm build

verify: ## Run lint, typecheck, and the test suite (stops at the first failure)
	@$(MAKE) --no-print-directory lint
	@$(MAKE) --no-print-directory typecheck
	@$(MAKE) --no-print-directory test

verify-i18n: ## Verify the translation catalogues: valid JSON, no missing/stale keys, no unknown keys in code (I18N_PROJECTS=... I18N_LANG=en)
	@python3 scripts/check-i18n-json.py $(I18N_PROJECTS) $(I18N_FLAGS)
	@python3 scripts/check-i18n-keys.py $(I18N_PROJECTS) --default-lang $(I18N_LANG) $(I18N_FLAGS)
	@python3 scripts/check-i18n-usage.py $(I18N_PROJECTS) --default-lang $(I18N_LANG) $(I18N_FLAGS)

verify-i18n-verbose: ## Same as verify-i18n, but lists every finding with the default language's source string
	@$(MAKE) --no-print-directory verify-i18n I18N_FLAGS="--verbose $(I18N_FLAGS)"

test: ## Run the whole Vitest suite across all packages
	@pnpm test

typecheck: ## Typecheck every workspace package (builds the shared libs first)
	@$(MAKE) --no-print-directory build-libs
	@pnpm typecheck

lint: ## Check formatting, imports, and lint rules with Biome
	@pnpm lint

format: ## Apply Biome formatting and safe fixes across the repo
	@pnpm lint:fix

storybook: ## Start Storybook for the shared ui-lib on https://localhost:4301
	@pnpm storybook

icons: ## Generate PWA/Outlook PNG icon sizes from a source image (SRC=path/to/source.png [OUT=dir])
	@if [ -z "$(SRC)" ]; then \
		echo "Usage: make icons SRC=path/to/source.png [OUT=output_dir]" >&2; \
		exit 1; \
	fi
	@bash scripts/generate-icons.sh "$(SRC)" "$(OUT)"

fonts: ## Convert any .ttf/.otf in shared/assets/fonts to woff2 and drop the original
	@bash scripts/convert-fonts.sh
