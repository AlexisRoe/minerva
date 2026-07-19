/// <reference types="vite/client" />

declare const __APP_VERSION__: string;
declare const __BUILD_COMMIT_HASH__: string;
declare const __BUILD_TIME__: string;

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_SENTRY_DSN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
