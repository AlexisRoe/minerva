#!/usr/bin/env bash
#
# generate-certs.sh
#
# Creates locally-trusted TLS certificates (via mkcert) so the frontend
# projects, the shared ui-lib, and the backend services can be run over
# HTTPS, both directly and inside Docker. Certificates are written to
# infra/cert/.

set -uo pipefail

SCRIPT_VERSION="1.0.0"
RUN_TIME="$(date '+%Y-%m-%d %H:%M:%S %Z')"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
CERT_DIR="${REPO_ROOT}/infra/cert"
CERT_FILE="${CERT_DIR}/minerva-local.pem"
KEY_FILE="${CERT_DIR}/minerva-local-key.pem"

# Every name the certificate has to cover, listed one by one.
#
# A `*.localhost` wildcard does NOT work here: browsers and OpenSSL both refuse
# a wildcard whose parent is a single-label TLD, so `*.localhost` matches
# nothing at all and `https://api.localhost` fails with a name mismatch rather
# than a trust error. Every service origin therefore needs its own entry — add
# one here when a new service gets a hostname, and re-run this script.
CERT_DOMAINS=(
  "localhost"
  "api.localhost"
  "queue.localhost"
  "manager.localhost"
  "button.localhost"
  "storybook.localhost"
  "127.0.0.1"
  "::1"
)

# Regenerate if the certificate expires within this many days.
MIN_DAYS_REMAINING=30

# The names a certificate actually carries, one per line, sorted. openssl prints
# the IPv6 loopback expanded, so it is folded back to the short form the list
# above is written in.
cert_names() {
  openssl x509 -in "$1" -noout -ext subjectAltName 2>/dev/null |
    tr ',' '\n' |
    sed -n -e 's/^[[:space:]]*DNS://p' -e 's/^[[:space:]]*IP Address://p' |
    sed -e 's/^0:0:0:0:0:0:0:1$/::1/' |
    sort -u
}

# ---- colors -------------------------------------------------------------
if [[ -t 1 ]]; then
  BOLD="$(tput bold)"; RESET="$(tput sgr0)"
  RED="$(tput setaf 1)"; GREEN="$(tput setaf 2)"; YELLOW="$(tput setaf 3)"; CYAN="$(tput setaf 6)"
else
  BOLD=""; RESET=""; RED=""; GREEN=""; YELLOW=""; CYAN=""
fi

echo "${BOLD}Certificate generation${RESET}"
echo "Script version: ${SCRIPT_VERSION}"
echo "Checked at:     ${RUN_TIME}"
echo
echo "----------------------------------------------------------------------"
echo

# ---- 1. check mkcert is installed ---------------------------------------
echo "${BOLD}mkcert${RESET}"
if ! command -v mkcert >/dev/null 2>&1; then
  echo "  Status:         ${RED}not installed${RESET}"
  echo "  Check with:     ${CYAN}command -v mkcert${RESET}"
  echo "  Install (2026): brew install mkcert nss (then run: mkcert -install)"
  echo
  echo "${RED}Aborting:${RESET} mkcert is required to generate local certificates."
  exit 1
fi
echo "  Status:      ${GREEN}installed${RESET}"
echo "  Version:     $(mkcert -version 2>/dev/null || echo unknown)"

CA_INSTALL_OUTPUT="$(mkcert -install 2>&1)"
CA_INSTALL_STATUS=$?
if [[ "$CA_INSTALL_STATUS" -eq 0 ]]; then
  echo "  Local CA:    ${GREEN}installed/trusted${RESET}"
else
  echo "  Local CA:    ${YELLOW}could not confirm${RESET}"
  echo "${CA_INSTALL_OUTPUT}" | sed 's/^/    /'
fi
echo

# ---- 2. check infra/cert exists, create if missing -----------------------
echo "${BOLD}Certificate directory${RESET}"
if [[ -d "$CERT_DIR" ]]; then
  echo "  Status: ${GREEN}exists${RESET} (${CERT_DIR})"
else
  mkdir -p "$CERT_DIR"
  echo "  Status: ${YELLOW}created${RESET} (${CERT_DIR})"
fi
echo

# ---- 3. check certificates exist and are still valid ----------------------
echo "${BOLD}Existing certificate${RESET}"
NEED_NEW_CERT=false
REASON=""

if [[ ! -f "$CERT_FILE" || ! -f "$KEY_FILE" ]]; then
  NEED_NEW_CERT=true
  REASON="no existing certificate/key pair found"
  echo "  Status: ${YELLOW}missing${RESET}"
elif ! openssl x509 -checkend "$((MIN_DAYS_REMAINING * 86400))" -noout -in "$CERT_FILE" >/dev/null 2>&1; then
  NEED_NEW_CERT=true
  REASON="certificate is expired or expires within ${MIN_DAYS_REMAINING} days"
  EXPIRY="$(openssl x509 -enddate -noout -in "$CERT_FILE" 2>/dev/null | cut -d= -f2)"
  echo "  Status:     ${YELLOW}outdated${RESET}"
  echo "  Expires:    ${EXPIRY:-unknown}"
elif [[ "$(printf '%s\n' "${CERT_DOMAINS[@]}" | sort -u)" != "$(cert_names "$CERT_FILE")" ]]; then
  # A still-valid certificate for the wrong set of names is the failure mode
  # that is hardest to see: it is trusted, it just does not match the host you
  # opened. Adding a name to CERT_DOMAINS has to be enough to get a new one.
  NEED_NEW_CERT=true
  REASON="certificate does not cover the same names as CERT_DOMAINS"
  echo "  Status:     ${YELLOW}wrong names${RESET}"
  MISSING="$(comm -23 <(printf '%s\n' "${CERT_DOMAINS[@]}" | sort -u) <(cert_names "$CERT_FILE") | paste -sd' ' -)"
  EXTRA="$(comm -13 <(printf '%s\n' "${CERT_DOMAINS[@]}" | sort -u) <(cert_names "$CERT_FILE") | paste -sd' ' -)"
  [[ -n "$MISSING" ]] && echo "  Missing:    ${MISSING}"
  [[ -n "$EXTRA" ]] && echo "  No longer wanted: ${EXTRA}"
else
  EXPIRY="$(openssl x509 -enddate -noout -in "$CERT_FILE" 2>/dev/null | cut -d= -f2)"
  echo "  Status:     ${GREEN}valid${RESET}"
  echo "  Expires:    ${EXPIRY:-unknown}"
fi
echo

# ---- 4. create new certificates if missing or outdated --------------------
if [[ "$NEED_NEW_CERT" == true ]]; then
  echo "${BOLD}Generating certificate${RESET} (${REASON})"
  echo "  Domains: ${CERT_DOMAINS[*]}"
  MKCERT_LOG="$(mktemp)"
  if mkcert -cert-file "$CERT_FILE" -key-file "$KEY_FILE" "${CERT_DOMAINS[@]}" >"$MKCERT_LOG" 2>&1; then
    chmod 644 "$CERT_FILE"
    chmod 600 "$KEY_FILE"
    rm -f "$MKCERT_LOG"
    echo "  Status: ${GREEN}created${RESET}"
  else
    echo "  Status: ${RED}failed${RESET}"
    cat "$MKCERT_LOG"
    rm -f "$MKCERT_LOG"
    exit 1
  fi
  echo
fi

# ---- 5. inform user what happened -----------------------------------------
EXPIRY="$(openssl x509 -enddate -noout -in "$CERT_FILE" 2>/dev/null | cut -d= -f2)"
echo "----------------------------------------------------------------------"
echo "${BOLD}Summary${RESET}"
if [[ "$NEED_NEW_CERT" == true ]]; then
  echo "  A new certificate was generated (${REASON})."
else
  echo "  Existing certificate is still valid, nothing to do."
fi
echo "  Certificate: ${CERT_FILE}"
echo "  Key:         ${KEY_FILE}"
echo "  Expires:     ${EXPIRY:-unknown}"
echo "  Domains:     ${CERT_DOMAINS[*]}"
echo
echo "  Point your frontend dev servers, the ui-lib dev server, and the"
echo "  dockerised services' TLS config at these files to run over https://."
echo "  Only the names listed above are covered — there is no wildcard, so a"
echo "  new service origin means adding it to CERT_DOMAINS and re-running this."

exit 0
