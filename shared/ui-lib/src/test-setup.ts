import '@testing-library/jest-dom/vitest';

// Mantine components read `window.matchMedia` for the colour scheme; jsdom
// does not implement it.
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

// Node 26 defines its own `localStorage` global, and it shadows the jsdom one
// that vitest installs. Reading it without `--localstorage-file` returns
// `undefined` and logs an ExperimentalWarning, which Mantine's colour scheme
// manager triggers on every render. Replace it with an in-memory Storage.
const storage = new Map<string, string>();
Object.defineProperty(window, 'localStorage', {
  configurable: true,
  writable: true,
  value: {
    get length() {
      return storage.size;
    },
    key: (index: number) => [...storage.keys()][index] ?? null,
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      storage.set(key, String(value));
    },
    removeItem: (key: string) => {
      storage.delete(key);
    },
    clear: () => {
      storage.clear();
    },
  } satisfies Storage,
});

// An autosizing Textarea re-measures itself when a webfont swaps in, which it
// hears about from `document.fonts`; jsdom implements no FontFaceSet at all.
Object.defineProperty(document, 'fonts', {
  writable: true,
  value: {
    addEventListener: () => {},
    removeEventListener: () => {},
  },
});
