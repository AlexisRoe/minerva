#!/usr/bin/env bash
# Bring the working copy's dependencies and shared-library builds back in step with
# the revision that was just checked out or merged.
#
# WHY THIS EXISTS
#   The apps resolve @minerva/typescript-lib and @minerva/ui-lib through their built
#   dist/ directories, which are gitignored. Pulling a change to shared/** therefore
#   leaves every consumer typechecking against stale declarations, with errors that
#   point at the old symbol names and look nothing like the change that caused them.
#   Likewise, a moved pnpm-lock.yaml leaves node_modules out of date.
#
#   This is a convenience, not a guarantee: `make typecheck` depends on `build-libs`
#   so the stale-dist failure cannot survive a verification run either way. Running
#   here just means you rarely meet it in the first place.
#
# USAGE
#   sync-workspace.sh <old-rev> <new-rev>
#
#   Both revisions are git revisions to diff between. When <old-rev> is absent, empty
#   or unresolvable — a fresh clone, an orphan checkout — the sync runs unconditionally,
#   because nothing can be proven unnecessary.
#
# EXIT CODES
#   Always 0. This runs from post-* git hooks, after the operation git was asked to
#   perform has already succeeded; reporting failure there would be misleading and, on
#   post-checkout, actively confusing. Problems are reported on stderr and left for the
#   next `make` invocation to surface properly.

set -u

cd "$(git rev-parse --show-toplevel)" || exit 0

OLD_REV="${1:-}"
NEW_REV="${2:-HEAD}"

BOLD=$(printf '\033[1m')
RESET=$(printf '\033[0m')
step() { echo "${BOLD}sync-workspace: $1${RESET}"; }
warn() { echo "sync-workspace: $1" >&2; }

# --- what changed -------------------------------------------------------------
# Paths whose contents feed node_modules or the shared dist/ builds. Keep this in
# step with the `main`/`types`/`exports` fields in shared/*/package.json.
WATCHED=(pnpm-lock.yaml pnpm-workspace.yaml package.json shared)

NEEDS_INSTALL=0
NEEDS_BUILD=0

# An unresolvable or absent old revision means we cannot tell what moved, so we do
# the work rather than risk leaving the tree stale.
if [ -z "$OLD_REV" ] || ! git rev-parse --verify --quiet "$OLD_REV^{commit}" >/dev/null; then
  NEEDS_INSTALL=1
  NEEDS_BUILD=1
else
  CHANGED=$(git diff --name-only "$OLD_REV" "$NEW_REV" -- "${WATCHED[@]}" 2>/dev/null)
  if [ -n "$CHANGED" ]; then
    case "$CHANGED" in
      *pnpm-lock.yaml* | *pnpm-workspace.yaml* | *package.json*) NEEDS_INSTALL=1 ;;
    esac
    case "$CHANGED" in
      *shared/*) NEEDS_BUILD=1 ;;
    esac
    # A dependency change can alter what the libraries compile against, so an install
    # always implies a rebuild.
    [ "$NEEDS_INSTALL" = "1" ] && NEEDS_BUILD=1
  fi
fi

# A checkout that has never been built is stale regardless of the diff.
if [ ! -d shared/typescript-lib/dist ] || [ ! -d shared/ui-lib/dist ]; then
  NEEDS_BUILD=1
fi

if [ "$NEEDS_INSTALL" = "0" ] && [ "$NEEDS_BUILD" = "0" ]; then
  exit 0
fi

# --- install ------------------------------------------------------------------
if [ "$NEEDS_INSTALL" = "1" ]; then
  step "dependencies changed — installing"
  # --prefer-offline keeps this usable on a flaky or absent network, where the store
  # usually already holds everything the lockfile asks for.
  if ! pnpm install --prefer-offline; then
    warn "pnpm install failed — run 'make install' before your next build."
    exit 0
  fi
fi

# --- build the shared libs ----------------------------------------------------
if [ "$NEEDS_BUILD" = "1" ]; then
  step "rebuilding the shared libraries"
  if ! pnpm --filter @minerva/typescript-lib --filter @minerva/ui-lib build; then
    warn "the shared libraries failed to build — run 'make build-libs' to see why."
    warn "until then, apps will typecheck against stale declarations."
    exit 0
  fi
fi

step "workspace in step with $(git rev-parse --short "$NEW_REV" 2>/dev/null || echo HEAD)"
exit 0
