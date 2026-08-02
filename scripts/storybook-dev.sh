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

# Without this, a leftover Storybook on the port makes the new one silently move
# to 4302 -- so half the team ends up on a stale build at the documented URL.
# --exact-port makes the clash fatal; naming the holder makes it fixable.
HOLDER="$(lsof -nP -iTCP:"$PORT" -sTCP:LISTEN -t 2>/dev/null || true)"
if [[ -n "$HOLDER" ]]; then
  echo "[minerva] Port ${PORT} is already in use by PID ${HOLDER}:"
  ps -o pid=,command= -p "$HOLDER" 2>/dev/null | sed 's/^/[minerva]   /'
  echo "[minerva] Stop it (\`kill ${HOLDER}\`) or set STORYBOOK_PORT to a free port."
  exit 1
fi

ARGS=("dev" "-p" "$PORT" "--exact-port")

# Storybook's ESM loader still calls the deprecated module.register(); the
# DEP0205 warning is theirs to fix, so silence that one code only.
export NODE_OPTIONS="${NODE_OPTIONS:-} --disable-warning=DEP0205"

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

exec storybook "${ARGS[@]}" "$@"
