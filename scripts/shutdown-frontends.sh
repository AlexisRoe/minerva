#!/usr/bin/env bash
#
# Kill the local Vite dev servers for minerva-button and minerva-manager.
#
# Ctrl+C normally does this. This script is for the cases where it did not: a
# detached `vite`, a shell that was closed out from under it, or a port that is
# still held after `make dev-*` exited. It is deliberately blunt — it sends
# SIGTERM, waits, then SIGKILLs whatever is still listening.
#
# Vite falls forward to the next free port when its configured one is taken
# (4101 -> 4102 -> ...), so a stuck server is often not on the port you expect.
# Both configured ports are therefore swept together with PORT_SCAN_RANGE
# following ports each.
#
# Guard: only processes whose command line mentions `vite` are killed. Anything
# else listening on those ports is reported and left alone — the range overlaps
# ports this repo does not own.
#
# Usage:
#   bash scripts/shutdown-frontends.sh          # kill
#   DRY_RUN=1 bash scripts/shutdown-frontends.sh # list what would be killed
set -euo pipefail

readonly REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# How many ports past each configured one to sweep, covering Vite's fall-forward.
readonly PORT_SCAN_RANGE="${PORT_SCAN_RANGE:-9}"

readonly DEFAULT_BUTTON_PORT=4101
readonly DEFAULT_MANAGER_PORT=4201

# Seconds to let a process shut down on SIGTERM before escalating to SIGKILL.
readonly TERM_GRACE_SECONDS=3

readonly DRY_RUN="${DRY_RUN:-0}"

# Reads a port from the repo .env, falling back to the given default when the
# file or the key is absent. Uses the same names as vite.config.ts.
read_env_port() {
  local key="$1" fallback="$2" value=""

  if [ -f "$REPO_ROOT/.env" ]; then
    value="$(grep -E "^${key}=" "$REPO_ROOT/.env" | tail -n 1 | cut -d= -f2- | tr -d "\"' \\r")"
  fi

  case "$value" in
    '' | *[!0-9]*) echo "$fallback" ;;
    *) echo "$value" ;;
  esac
}

# Prints every port to sweep: each configured port plus PORT_SCAN_RANGE after it.
ports_to_sweep() {
  local base
  for base in "$(read_env_port APP_FE_RB_PORT "$DEFAULT_BUTTON_PORT")" \
    "$(read_env_port APP_FE_MANANGER_PORT "$DEFAULT_MANAGER_PORT")"; do
    seq "$base" "$((base + PORT_SCAN_RANGE))"
  done
}

# Prints the full command line of a pid, or nothing if it is already gone.
command_line_of() {
  ps -o command= -p "$1" 2>/dev/null || true
}

main() {
  local port pid command killed=0 skipped=0
  local -a doomed=()

  for port in $(ports_to_sweep); do
    for pid in $(lsof -ti "tcp:${port}" -sTCP:LISTEN 2>/dev/null || true); do
      command="$(command_line_of "$pid")"
      [ -n "$command" ] || continue

      if ! printf '%s' "$command" | grep -q 'vite'; then
        echo "  skip  :${port}  pid ${pid}  (not vite) ${command:0:80}"
        skipped=$((skipped + 1))
        continue
      fi

      echo "  kill  :${port}  pid ${pid}  ${command:0:80}"
      doomed+=("$pid")
      killed=$((killed + 1))
    done
  done

  if [ "$killed" -eq 0 ]; then
    if [ "$skipped" -eq 0 ]; then
      echo "No frontend dev server is listening."
    fi
    return 0
  fi

  if [ "$DRY_RUN" != "0" ]; then
    echo "DRY_RUN=${DRY_RUN}: nothing was killed."
    return 0
  fi

  kill -TERM "${doomed[@]}" 2>/dev/null || true
  sleep "$TERM_GRACE_SECONDS"

  for pid in "${doomed[@]}"; do
    if kill -0 "$pid" 2>/dev/null; then
      echo "  pid ${pid} ignored SIGTERM, sending SIGKILL"
      kill -KILL "$pid" 2>/dev/null || true
    fi
  done

  echo "Stopped ${killed} frontend dev server(s)."
}

main "$@"
