#!/usr/bin/env bash
#
# initial-setup.sh
#
# Prepares a fresh local checkout for development. For now that means
# creating the local .env from .env.template, backing up any existing .env
# as .env.<timestamp> first so nothing is lost.

set -uo pipefail

SCRIPT_VERSION="1.0.0"
RUN_TIME="$(date '+%Y-%m-%d %H:%M:%S %Z')"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
TEMPLATE_FILE="${REPO_ROOT}/.env.template"
ENV_FILE="${REPO_ROOT}/.env"
TIMESTAMP="$(date '+%Y%m%d-%H%M%S')"
BACKUP_FILE="${ENV_FILE}.${TIMESTAMP}"

# ---- colors -------------------------------------------------------------
if [[ -t 1 ]]; then
  BOLD="$(tput bold)"; RESET="$(tput sgr0)"
  RED="$(tput setaf 1)"; GREEN="$(tput setaf 2)"; YELLOW="$(tput setaf 3)"; CYAN="$(tput setaf 6)"
else
  BOLD=""; RESET=""; RED=""; GREEN=""; YELLOW=""; CYAN=""
fi

echo "${BOLD}Initial setup${RESET}"
echo "Script version: ${SCRIPT_VERSION}"
echo "Run at:         ${RUN_TIME}"
echo
echo "----------------------------------------------------------------------"
echo

# ---- 1. check the template exists ----------------------------------------
echo "${BOLD}Environment template${RESET}"
if [[ ! -f "$TEMPLATE_FILE" ]]; then
  echo "  Status:     ${RED}missing${RESET} (${TEMPLATE_FILE})"
  echo "  Check with: ${CYAN}ls -l .env.template${RESET}"
  echo
  echo "${RED}Aborting:${RESET} .env.template is required to create the local .env."
  echo "  Restore it from version control (${CYAN}git checkout -- .env.template${RESET}) and run this script again."
  exit 1
fi
echo "  Status:     ${GREEN}found${RESET} (${TEMPLATE_FILE})"
echo

# ---- 2. back up an existing .env -----------------------------------------
echo "${BOLD}Existing .env${RESET}"
BACKED_UP=false
if [[ -f "$ENV_FILE" ]]; then
  if ! cp -p "$ENV_FILE" "$BACKUP_FILE"; then
    echo "  Status: ${RED}backup failed${RESET}"
    echo
    echo "${RED}Aborting:${RESET} could not back up ${ENV_FILE}, leaving it untouched."
    exit 1
  fi
  BACKED_UP=true
  echo "  Status: ${YELLOW}backed up${RESET}"
  echo "  Backup: ${BACKUP_FILE}"
else
  echo "  Status: ${GREEN}none${RESET} (nothing to back up)"
fi
echo

# ---- 3. copy the template into place --------------------------------------
echo "${BOLD}Creating .env${RESET}"
if ! cp "$TEMPLATE_FILE" "$ENV_FILE"; then
  echo "  Status: ${RED}failed${RESET}"
  echo
  echo "${RED}Aborting:${RESET} could not write ${ENV_FILE}."
  if [[ "$BACKED_UP" == true ]]; then
    echo "  Your previous values are still available at ${BACKUP_FILE}."
  fi
  exit 1
fi
chmod 600 "$ENV_FILE"
echo "  Status: ${GREEN}created${RESET} (${ENV_FILE})"
echo

# ---- 4. inform user what happened -----------------------------------------
echo "----------------------------------------------------------------------"
echo "${BOLD}Summary${RESET}"
echo "  Template: ${TEMPLATE_FILE}"
echo "  Env file: ${ENV_FILE}"
if [[ "$BACKED_UP" == true ]]; then
  echo "  Backup:   ${BACKUP_FILE}"
  echo
  echo "  Your previous .env was replaced with a fresh copy of the template."
  echo "  Copy any values you still need over from the backup."
else
  echo
  echo "  A fresh .env was created from the template."
fi
echo "  Fill in the required values before starting the services."

exit 0
