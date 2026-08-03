import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Shared TLS material for the Vite dev/preview servers and for Storybook.
 *
 * The pair is produced by `make certs` (scripts/generate-certs.sh) and covers
 * `localhost`, `*.localhost`, `127.0.0.1` and `::1`, so every dev server can
 * share this one certificate.
 */
const CERT_FILE = resolve(import.meta.dirname, 'infra/cert/minerva-local.pem');
const KEY_FILE = resolve(import.meta.dirname, 'infra/cert/minerva-local-key.pem');

let warned = false;

/**
 * HTTPS options for a dev server, or `undefined` when no certificate has been
 * generated yet.
 *
 * `infra/cert/` is gitignored, so a fresh clone has no certificate until
 * `make certs` has been run. Returning `undefined` makes Vite fall back to
 * plain HTTP in that case — an unconfigured checkout still boots, it just
 * boots on http:// until the certificates exist.
 */
export function localHttps(): { cert: Buffer; key: Buffer } | undefined {
  if (!existsSync(CERT_FILE) || !existsSync(KEY_FILE)) {
    if (!warned) {
      warned = true;
      console.warn(
        '[minerva] No local TLS certificate in infra/cert/ — serving over plain HTTP.\n' +
          '[minerva] Run `make certs` and restart the dev server to use https://.',
      );
    }
    return undefined;
  }

  return { cert: readFileSync(CERT_FILE), key: readFileSync(KEY_FILE) };
}
