#!/usr/bin/env bash
#
# bootstrap-secrets.sh
#
# Fills every credential the local stack needs but nobody chooses: the Postgres
# passwords, the Valkey password, Garage's cluster secrets and S3 key pair, and
# go-camo's HMAC key. Run by `make setup`, and on its own with `make secrets`.
#
# Idempotent, and deliberately timid: a variable that already has a value is
# never touched. Rotating one is a decision with consequences — a Garage RPC
# secret changed under a running cluster locks the node out of its own data — so
# that stays a deliberate act (`FORCE=1 make secret VAR=...`), not something a
# setup script does on a second run.
#
# Usage:
#   bootstrap-secrets.sh          # fill whatever is still empty
#   DRY_RUN=1 bootstrap-secrets.sh
#
# What it does not do: create the .env. That is `make copy-env`, which this
# refuses to work without, because writing secrets into a file that is about to
# be overwritten from the template would be worse than useless.

set -uo pipefail

SCRIPT_VERSION="1.0.0"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${REPO_ROOT}/.env"
DRY_RUN="${DRY_RUN:-0}"

# Every generated credential, and how it has to be shaped.
#
#   base64  the default: 32 random bytes, 44 characters
#   hex     64 hexadecimal characters — Garage rejects an RPC secret or an S3
#           secret key that is anything else, and go-camo parses its key as hex
#   s3id    `GK` followed by 24 hexadecimal characters, which is the only form
#           Garage accepts as an access key id
#
# BE_API_COOKIE_SECRET is in here too: the api issues unsigned cookies without
# it, which works right up until the first thing worth signing.
SECRETS=(
  "BE_API_COOKIE_SECRET:base64"
  "INFRA_POSTGRES_PASSWORD:base64"
  "INFRA_POSTGRES_RW_PASSWORD:base64"
  "INFRA_POSTGRES_RO_PASSWORD:base64"
  "INFRA_VALKEY_PASSWORD:base64"
  "INFRA_GARAGE_RPC_SECRET:hex"
  "INFRA_GARAGE_ADMIN_TOKEN:hex"
  "INFRA_GARAGE_ACCESS_KEY_ID:s3id"
  "INFRA_GARAGE_SECRET_ACCESS_KEY:hex"
  "INFRA_CAMO_KEY:hex"
)

# ---- colors -------------------------------------------------------------
if [[ -t 1 ]]; then
  BOLD="$(tput bold)"; RESET="$(tput sgr0)"
  RED="$(tput setaf 1)"; GREEN="$(tput setaf 2)"; YELLOW="$(tput setaf 3)"; CYAN="$(tput setaf 6)"
else
  BOLD=""; RESET=""; RED=""; GREEN=""; YELLOW=""; CYAN=""
fi

echo "${BOLD}Local credentials${RESET} (script version ${SCRIPT_VERSION})"
echo

# ---- 1. preconditions ----------------------------------------------------
if ! command -v openssl >/dev/null 2>&1; then
  echo "${RED}Aborting:${RESET} openssl is not installed." >&2
  echo "  Check with: ${CYAN}make check-deps${RESET}" >&2
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "${RED}Aborting:${RESET} there is no .env to write to." >&2
  echo "  Create one first: ${CYAN}make copy-env${RESET}" >&2
  exit 1
fi

# ---- 2. generate ---------------------------------------------------------
generate() {
  case "$1" in
    hex) openssl rand -hex 32 ;;
    s3id) echo "GK$(openssl rand -hex 12)" ;;
    *) openssl rand -base64 32 ;;
  esac
}

WRITTEN=0
KEPT=0
MISSING=()

for entry in "${SECRETS[@]}"; do
  VARIABLE="${entry%%:*}"
  KIND="${entry##*:}"

  # An unknown name is not appended. It is far more often a variable that was
  # renamed in .env.template and not here than a genuinely new one, and silently
  # adding it would hide that.
  if ! grep -q "^${VARIABLE}=" "$ENV_FILE"; then
    MISSING+=("$VARIABLE")
    printf "  %-32s ${RED}not in .env${RESET}\n" "$VARIABLE"
    continue
  fi

  CURRENT="$(grep "^${VARIABLE}=" "$ENV_FILE" | tail -1 | cut -d= -f2-)"
  if [[ -n "$CURRENT" ]]; then
    KEPT=$((KEPT + 1))
    printf "  %-32s ${GREEN}already set${RESET}\n" "$VARIABLE"
    continue
  fi

  if [[ "$DRY_RUN" == "1" ]]; then
    printf "  %-32s ${YELLOW}would generate${RESET} (%s)\n" "$VARIABLE" "$KIND"
    continue
  fi

  SECRET="$(generate "$KIND")"

  # awk rather than `sed -i`, whose in-place flag differs between BSD and GNU,
  # and the replacement line is built rather than substituted so that the / and +
  # base64 produces are never read as part of a pattern.
  TEMP_FILE="$(mktemp)"
  if ! awk -v name="$VARIABLE" -v secret="$SECRET" \
    'index($0, name "=") == 1 { print name "=" secret; next } { print }' \
    "$ENV_FILE" >"$TEMP_FILE"; then
    rm -f "$TEMP_FILE"
    echo "${RED}Aborting:${RESET} could not rewrite ${ENV_FILE}." >&2
    exit 1
  fi

  # Written through the existing file rather than moved over it, so the 600 that
  # initial-setup.sh set survives.
  if ! cat "$TEMP_FILE" >"$ENV_FILE"; then
    rm -f "$TEMP_FILE"
    echo "${RED}Aborting:${RESET} could not write ${ENV_FILE}." >&2
    exit 1
  fi
  rm -f "$TEMP_FILE"

  WRITTEN=$((WRITTEN + 1))
  printf "  %-32s ${YELLOW}generated${RESET} (%s)\n" "$VARIABLE" "$KIND"
done

# ---- 3. summary ----------------------------------------------------------
echo
echo "----------------------------------------------------------------------"
echo "${BOLD}Summary${RESET}"
echo "  Generated:  ${WRITTEN}"
echo "  Kept:       ${KEPT}"
echo "  File:       ${ENV_FILE}"

if [[ ${#MISSING[@]} -gt 0 ]]; then
  echo
  echo "${RED}${#MISSING[@]} variable(s) are not in your .env:${RESET} ${MISSING[*]}"
  echo "  Nothing was appended, because a name missing here is far more often a"
  echo "  variable that moved than a new one. Your .env predates them — copy the"
  echo "  block across from .env.template, then run this again."
  exit 1
fi

if [[ "$WRITTEN" -gt 0 ]]; then
  echo
  echo "  These are local development credentials and nothing else. To rotate one:"
  echo "    ${CYAN}FORCE=1 make secret VAR=<NAME>${RESET}"
  echo "  A Postgres password only takes effect on a fresh volume — ${CYAN}make reset-db${RESET}."
fi

exit 0
