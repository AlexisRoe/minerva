import '@testing-library/jest-dom/vitest';

// Tests render components that call `useTranslation()`; without this the
// catalogues are never registered and `t()` echoes the raw keys back.
import '@/platform/i18n/i18next.instance';

// jsdom ships no `localStorage`, and the persisted error-log store expects a
// working one. This is the whole `Storage` interface over a `Map`, so the tests
// exercise the real persistence path instead of the store's in-memory fallback.
const storedItems = new Map<string, string>();
Object.defineProperty(window, 'localStorage', {
  writable: true,
  value: {
    get length(): number {
      return storedItems.size;
    },
    key: (index: number) => [...storedItems.keys()][index] ?? null,
    getItem: (key: string) => storedItems.get(key) ?? null,
    setItem: (key: string, value: string) => {
      storedItems.set(key, String(value));
    },
    removeItem: (key: string) => {
      storedItems.delete(key);
    },
    clear: () => {
      storedItems.clear();
    },
  } satisfies Storage,
});

// The report drawer's note is an autosizing Textarea, which re-measures itself
// when a webfont swaps in and hears about that from `document.fonts`; jsdom
// implements no FontFaceSet at all. `shared/ui-lib/src/test-setup.ts` carries
// the same stub, for the same component.
Object.defineProperty(document, 'fonts', {
  writable: true,
  value: {
    addEventListener: () => {},
    removeEventListener: () => {},
  },
});

// Mantine components read `window.matchMedia` for the colour scheme; jsdom does
// not implement it.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
