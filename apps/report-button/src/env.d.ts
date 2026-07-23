/// <reference types="vite/client" />

declare const __APP_VERSION__: string;
declare const __BUILD_COMMIT_HASH__: string;
declare const __BUILD_TIME__: string;

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_SENTRY_DSN?: string;
}

// biome-ignore lint/correctness/noUnusedVariables: vite uses that in a different way
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
