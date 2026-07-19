#!/usr/bin/env bash
# Generates locally-trusted TLS certificates for all local dev servers (Vite apps + NestJS API).
# Requires mkcert: https://github.com/FiloSottile/mkcert  (macOS: `brew install mkcert`)
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CERT_DIR="${ROOT_DIR}/infra/certs"

if ! command -v mkcert >/dev/null 2>&1; then
  echo "error: mkcert is not installed. Install it first (macOS: brew install mkcert)." >&2
  exit 1
fi

mkdir -p "${CERT_DIR}"

# Installs the mkcert root CA into the system/browser trust stores (may prompt for your password once).
# In non-interactive shells this can fail — certificates are still generated, but you must run
# `mkcert -install` once yourself so browsers trust them.
if ! mkcert -install; then
  echo "warning: 'mkcert -install' failed (likely needs an interactive password prompt)." >&2
  echo "         Run 'mkcert -install' manually once, then restart your browser." >&2
fi

mkcert \
  -cert-file "${CERT_DIR}/localhost-cert.pem" \
  -key-file "${CERT_DIR}/localhost-key.pem" \
  localhost 127.0.0.1 ::1

chmod 600 "${CERT_DIR}/localhost-key.pem"
echo "Certificates written to ${CERT_DIR}"
