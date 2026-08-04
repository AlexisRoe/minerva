import { afterEach, describe, expect, it } from 'vitest';

import { configFixture } from '../config';
import { createRouter } from './router';

describe('createRouter', () => {
  afterEach(() => {
    Reflect.deleteProperty(window.history, 'replaceState');
    Reflect.deleteProperty(window.history, 'pushState');
  });

  it('builds a router even after Office.js removed the History API', () => {
    // Exactly what Office.js does when the pane is opened in a plain browser --
    // demo mode. `createHashRouter` reads `replaceState` as it is built, so
    // without the repair the app throws before React ever mounts.
    Object.assign(window.history, { pushState: undefined, replaceState: undefined });

    expect(() => createRouter(configFixture)).not.toThrow();
  });

  it('starts on the task pane', () => {
    expect(createRouter(configFixture).state.location.pathname).toBe('/');
  });
});
