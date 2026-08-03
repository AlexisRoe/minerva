import type { defaultNS, resources } from './i18next.instance';

// Makes `t()` keys checked against the English catalogue at compile time.
// https://www.i18next.com/overview/typescript
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS;
    resources: (typeof resources)['en'];
  }
}
