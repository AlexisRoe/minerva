import '@testing-library/jest-dom/vitest';

// jsdom leaves `window.localStorage` to whatever the host already defines, so
// `MantineProvider`'s colour-scheme manager reaches Node's own experimental
// `localStorage` and every worker prints the `--localstorage-file` warning.
// This is the whole `Storage` interface over a `Map`, which shadows it.
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

// An autosizing Textarea re-measures itself when a webfont swaps in, which it
// hears about from `document.fonts`; jsdom implements no FontFaceSet at all.
Object.defineProperty(document, 'fonts', {
  writable: true,
  value: {
    addEventListener: () => {},
    removeEventListener: () => {},
  },
});
