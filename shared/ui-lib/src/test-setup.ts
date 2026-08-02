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

// An autosizing Textarea re-measures itself when a webfont swaps in, which it
// hears about from `document.fonts`; jsdom implements no FontFaceSet at all.
Object.defineProperty(document, 'fonts', {
  writable: true,
  value: {
    addEventListener: () => {},
    removeEventListener: () => {},
  },
});
