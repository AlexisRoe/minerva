#!/usr/bin/env bash
#
# check-dependencies.sh
#
# Checks whether the required local tooling for this project is installed
# and reports version, the check command used, and how to install/update it.

set -uo pipefail

SCRIPT_VERSION="1.0.0"
CHECK_TIME="$(date '+%Y-%m-%d %H:%M:%S %Z')"

# ---- colors -----------------------------------------------------------
if [[ -t 1 ]]; then
  BOLD="$(tput bold)"; DIM="$(tput dim)"; RESET="$(tput sgr0)"
  RED="$(tput setaf 1)"; GREEN="$(tput setaf 2)"; YELLOW="$(tput setaf 3)"; CYAN="$(tput setaf 6)"
else
  BOLD=""; DIM=""; RESET=""; RED=""; GREEN=""; YELLOW=""; CYAN=""
fi

MISSING_COUNT=0
FOUND_COUNT=0

# ---- helper -------------------------------------------------------------
# check_app <display name> <binary> <version command> <install instructions (2026)>
check_app() {
  local name="$1" bin="$2" version_cmd="$3" install_hint="$4"
  local check_cmd="command -v ${bin}"

  echo "${BOLD}${name}${RESET}"
  if command -v "$bin" >/dev/null 2>&1; then
    local version
    version="$(eval "$version_cmd" 2>/dev/null | head -n1)"
    echo "  Status:      ${GREEN}installed${RESET}"
    echo "  Version:     ${version:-unknown}"
    FOUND_COUNT=$((FOUND_COUNT + 1))
  else
    echo "  Status:      ${RED}not installed${RESET}"
    MISSING_COUNT=$((MISSING_COUNT + 1))
  fi
  echo "  Check with:  ${CYAN}${check_cmd}${RESET}"
  echo "  Install (2026): ${install_hint}"
  echo
}

# ---- header ---------------------------------------------------------------
echo "${BOLD}Dependency check${RESET}"
echo "Script version: ${SCRIPT_VERSION}"
echo "Checked at:     ${CHECK_TIME}"
echo
echo "----------------------------------------------------------------------"
echo

# ---- checks -----------------------------------------------------------
check_app "Homebrew" "brew" \
  "brew --version" \
  "/bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\" (see https://brew.sh)"

check_app "pnpm" "pnpm" \
  "pnpm --version" \
  "corepack enable pnpm (bundled with Node 24+), or: curl -fsSL https://get.pnpm.io/install.sh | sh -"

check_app "Node.js" "node" \
  "node --version" \
  "brew install node, or nvm install --lts (this repo pins $( [[ -f "$(dirname "$0")/../.nvmrc" ]] && cat "$(dirname "$0")/../.nvmrc" || echo "a version" ) via .nvmrc)"

check_app "Docker" "docker" \
  "docker --version" \
  "brew install --cask docker (Docker Desktop), or: brew install docker docker-compose colima && colima start"

check_app "make" "make" \
  "make --version" \
  "xcode-select --install (Xcode Command Line Tools), or: brew install make"

# `make secret` generates the signing keys .env holds (BE_API_COOKIE_SECRET and
# whatever follows it) with `openssl rand`. macOS ships a binary, but a PATH
# that does not reach it is possible — and a checkout that cannot generate a
# secret cannot bring the api up with signed cookies.
check_app "OpenSSL" "openssl" \
  "openssl version" \
  "ships with macOS; brew install openssl for a current one, or: apt install openssl"

# ---- summary ----------------------------------------------------------
echo "----------------------------------------------------------------------"
echo "${BOLD}Summary:${RESET} ${GREEN}${FOUND_COUNT} installed${RESET}, ${RED}${MISSING_COUNT} missing${RESET}"

if [[ "$MISSING_COUNT" -gt 0 ]]; then
  exit 1
fi
exit 0
