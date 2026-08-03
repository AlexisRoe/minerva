.DEFAULT_GOAL := help

.PHONY: help setup check-deps install build-libs certs copy-env icons dev dev-manager dev-button shutdown-fe build verify verify-i18n verify-i18n-verbose test typecheck lint format storybook

# Defaults for `make icons` (override on the command line)
OUT ?= ./icons

# Defaults for `make verify-i18n` (override on the command line)
I18N_PROJECTS ?= apps/frontend/minerva-button
I18N_LANG ?= en
I18N_FLAGS ?=

help: ## Show this help
	@echo "Available commands:"
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z0-9_-]+:.*##/ { printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

setup: ## Prepare a fresh checkout: check-deps, certs, install, then build the shared libs (stops at the first failure)
	@$(MAKE) --no-print-directory check-deps
	@$(MAKE) --no-print-directory certs
	@$(MAKE) --no-print-directory install
	@$(MAKE) --no-print-directory build-libs

check-deps: ## Check that required local tooling (homebrew, pnpm, node, docker, make) is installed
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
