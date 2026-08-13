#!/usr/bin/env bash
#
# generate-secret.sh
#
# Generates a cryptographically random secret with openssl, and optionally
# writes it into the local .env under a given variable name.
#
# Usage:
#   generate-secret.sh                          # print a fresh secret
#   generate-secret.sh BE_API_COOKIE_SECRET     # set it in .env (refuses to overwrite)
#   FORCE=1 generate-secret.sh BE_API_COOKIE_SECRET
#   HEX=1 generate-secret.sh INFRA_GARAGE_RPC_SECRET   # 64 hex characters instead of base64
#
# Rotating a secret invalidates everything already signed with the old one —
# every cookie a running api handed out — which is why an existing value is
# never replaced without FORCE=1.

set -uo pipefail

SCRIPT_VERSION="1.0.0"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${REPO_ROOT}/.env"

VARIABLE="${1:-}"
FORCE="${FORCE:-0}"
HEX="${HEX:-0}"

# 32 bytes: the floor the api's COOKIE_SECRET validation enforces is 32
# characters, and base64 of 32 bytes is 44 of them.
SECRET_BYTES=32

# ---- colors -------------------------------------------------------------
if [[ -t 2 ]]; then
  BOLD="$(tput bold)"; RESET="$(tput sgr0)"
  RED="$(tput setaf 1)"; GREEN="$(tput setaf 2)"; YELLOW="$(tput setaf 3)"; CYAN="$(tput setaf 6)"
else
  BOLD=""; RESET=""; RED=""; GREEN=""; YELLOW=""; CYAN=""
fi

# ---- 1. openssl has to be there ------------------------------------------
if ! command -v openssl >/dev/null 2>&1; then
  echo "${RED}Aborting:${RESET} openssl is not installed." >&2
  echo "  Check with: ${CYAN}make check-deps${RESET}" >&2
  echo "  Install:    ${CYAN}brew install openssl${RESET} (macOS ships one, but a PATH without it is possible)" >&2
  exit 1
fi

# Base64 packs the same 32 bytes into fewer characters, so it is the default.
# HEX=1 exists for the values whose consumer parses them rather than compares
# them: Garage rejects an rpc_secret that is not exactly 64 hexadecimal
# characters, and go-camo's HMAC key is read the same way.
if [[ "$HEX" == "1" ]]; then
  SECRET="$(openssl rand -hex "$SECRET_BYTES")"
else
  SECRET="$(openssl rand -base64 "$SECRET_BYTES")"
fi

if [[ -z "$SECRET" ]]; then
  echo "${RED}Aborting:${RESET} openssl produced no output." >&2
  exit 1
fi

# ---- 2. no variable named: just hand the secret over ----------------------
# The secret goes to stdout on its own so that `make secret | pbcopy` is the
# whole workflow; everything else is commentary and belongs on stderr.
if [[ -z "$VARIABLE" ]]; then
  echo "$SECRET"
  echo "${YELLOW}Not written anywhere.${RESET} To set it in .env: ${CYAN}make secret VAR=<NAME>${RESET}" >&2
  exit 0
fi

# ---- 3. writing into .env -------------------------------------------------
echo "${BOLD}Secret for ${VARIABLE}${RESET} (script version ${SCRIPT_VERSION})" >&2
echo >&2

if [[ ! -f "$ENV_FILE" ]]; then
  echo "  Status:     ${RED}no .env${RESET} (${ENV_FILE})" >&2
  echo >&2
  echo "${RED}Aborting:${RESET} there is no local .env to write to." >&2
  echo "  Create one first: ${CYAN}make copy-env${RESET}" >&2
  exit 1
fi

if ! grep -q "^${VARIABLE}=" "$ENV_FILE"; then
  echo "  Status:     ${RED}unknown variable${RESET}" >&2
  echo >&2
  echo "${RED}Aborting:${RESET} ${VARIABLE} is not in ${ENV_FILE}." >&2
  echo "  Nothing was appended, because an unset name here is far more often a typo" >&2
  echo "  than a new variable. Add it to .env.template first if it is genuinely new." >&2
  exit 1
fi

CURRENT="$(grep "^${VARIABLE}=" "$ENV_FILE" | tail -1 | cut -d= -f2-)"
if [[ -n "$CURRENT" && "$FORCE" != "1" ]]; then
  echo "  Status:     ${YELLOW}already set${RESET}" >&2
  echo >&2
  echo "${YELLOW}Nothing changed.${RESET} ${VARIABLE} already has a value." >&2
  echo "  Replacing it invalidates everything signed with the old one — every" >&2
  echo "  cookie a running api handed out. To rotate it anyway:" >&2
  echo "    ${CYAN}FORCE=1 make secret VAR=${VARIABLE}${RESET}" >&2
  exit 1
fi

# awk rather than `sed -i`, whose in-place flag differs between BSD and GNU,
# and the replacement line is built rather than substituted so that the / and +
# base64 produces are never read as part of a pattern.
TEMP_FILE="$(mktemp)"
trap 'rm -f "$TEMP_FILE"' EXIT

if ! awk -v name="$VARIABLE" -v secret="$SECRET" \
  'index($0, name "=") == 1 { print name "=" secret; next } { print }' \
  "$ENV_FILE" >"$TEMP_FILE"; then
  echo "${RED}Aborting:${RESET} could not rewrite ${ENV_FILE}." >&2
  exit 1
fi

# Written through the existing file rather than moved over it, so the 600 that
# initial-setup.sh set survives.
if ! cat "$TEMP_FILE" >"$ENV_FILE"; then
  echo "${RED}Aborting:${RESET} could not write ${ENV_FILE}." >&2
  exit 1
fi

echo "  Status:     ${GREEN}written${RESET} (${ENV_FILE})" >&2
if [[ -n "$CURRENT" ]]; then
  echo "  Previous:   ${YELLOW}replaced${RESET} — anything signed with it is now invalid" >&2
fi
echo "  Restart the services that read it: ${CYAN}make api-down && make api${RESET}" >&2

exit 0
