.DEFAULT_GOAL := help

.PHONY: help setup check-deps install certs copy-env icons dev dev-manager dev-button build verify test typecheck lint format storybook

# Defaults for `make icons` (override on the command line)
OUT ?= ./icons

help: ## Show this help
	@echo "Available commands:"
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z0-9_-]+:.*##/ { printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

setup: ## Prepare a fresh checkout: check-deps, then certs, then install (stops at the first failure)
	@$(MAKE) --no-print-directory check-deps
	@$(MAKE) --no-print-directory certs
	@$(MAKE) --no-print-directory install

check-deps: ## Check that required local tooling (homebrew, pnpm, node, docker, make) is installed
	@bash scripts/check-dependencies.sh

install: ## Install project dependencies with pnpm
	@pnpm install

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

build: ## Build every workspace package in dependency order
	@pnpm build

verify: ## Run lint, typecheck, and the test suite (stops at the first failure)
	@$(MAKE) --no-print-directory lint
	@$(MAKE) --no-print-directory typecheck
	@$(MAKE) --no-print-directory test

test: ## Run the whole Vitest suite across all packages
	@pnpm test

typecheck: ## Typecheck every workspace package
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
