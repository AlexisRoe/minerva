import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const workspaceRoot = join(import.meta.dirname, '../..');

/**
 * TLS options for local dev servers, backed by the mkcert certificates.
 * Returns undefined when the certificates have not been generated (e.g. CI),
 * so servers fall back to plain http instead of crashing.
 */
export function localHttps(): { cert: Buffer; key: Buffer } | undefined {
  const cert = join(workspaceRoot, 'infra/certs/localhost-cert.pem');
  const key = join(workspaceRoot, 'infra/certs/localhost-key.pem');
  if (!existsSync(cert) || !existsSync(key)) {
    console.warn('[vite-shared] infra/certs not found — serving over http. Run ./scripts/setup-certs.sh');
    return undefined;
  }
  return { cert: readFileSync(cert), key: readFileSync(key) };
}

/** Compile-time build metadata, injected via Vite `define`. */
export function buildInfoDefine(): Record<string, string> {
  const rootPackage = JSON.parse(readFileSync(join(workspaceRoot, 'package.json'), 'utf8')) as { version: string };
  let commitHash = 'unknown';
  try {
    commitHash = execSync('git rev-parse --short HEAD', { cwd: workspaceRoot }).toString().trim();
  } catch {
    // not a git checkout (e.g. docker build context)
  }
  return {
    __APP_VERSION__: JSON.stringify(rootPackage.version),
    __BUILD_COMMIT_HASH__: JSON.stringify(commitHash),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  };
}
