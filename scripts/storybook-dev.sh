#!/usr/bin/env bash
#
# storybook-dev.sh
#
# Starts Storybook for shared/ui-lib. Storybook runs Vite in middleware mode
# behind its own Node server, so the `server.https` option in a Vite config is
# ignored -- TLS has to be passed on the command line instead.
#
# Mirrors the fallback in vite.https.ts: HTTPS when the mkcert pair exists,
# plain HTTP when it does not, so a fresh clone still boots before `make certs`
# has been run.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
CERT_FILE="${REPO_ROOT}/infra/cert/minerva-local.pem"
KEY_FILE="${REPO_ROOT}/infra/cert/minerva-local-key.pem"

PORT="${STORYBOOK_PORT:-4301}"
ARGS=("dev" "-p" "$PORT")

if [[ -f "$CERT_FILE" && -f "$KEY_FILE" ]]; then
  ARGS+=("--https" "--ssl-cert" "$CERT_FILE" "--ssl-key" "$KEY_FILE")

  # mkcert signs with a local root CA, so Storybook counts the certificate as
  # self-signed and wants the CA alongside it.
  CA_ROOT="$(mkcert -CAROOT 2>/dev/null || true)"
  if [[ -n "$CA_ROOT" && -f "${CA_ROOT}/rootCA.pem" ]]; then
    ARGS+=("--ssl-ca" "${CA_ROOT}/rootCA.pem")
  fi
else
  echo "[minerva] No local TLS certificate in infra/cert/ -- serving Storybook over plain HTTP."
  echo "[minerva] Run \`make certs\` and restart Storybook to use https://."
fi

# Storybook's CLI still calls `module.register()`, which Node >=26 reports as
# DEP0205. Nothing in this repo can act on it, so the one warning is silenced
# by id -- every other Node warning still comes through.
export NODE_OPTIONS="${NODE_OPTIONS:-} --disable-warning=DEP0205"

exec storybook "${ARGS[@]}" "$@"
