/**
 * A `Storage` that never throws, for the persisted error log.
 *
 * `localStorage` is not always there to be used: it throws on access when
 * third-party or partitioned storage is blocked, and `setItem` throws once the
 * origin's quota is full. Any of those would take down
 * the caller -- and the caller here is `captureError`, so a storage fault would
 * turn "something went wrong" into "the error handler went wrong".
 *
 * So every operation is guarded, and a working `Storage` is always returned: the
 * real one when it can be reached, otherwise an in-memory stand-in that keeps
 * the log usable for the life of the page and simply does not survive a reload.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage#exceptions}
 * @see {@link https://zustand.docs.pmnd.rs/integrations/persisting-store-data#storage}
 *
 * @example
 * ```ts
 * persist(creator, { name: 'x', storage: createJSONStorage(() => getErrorLogStorage()) });
 * ```
 */
export function getErrorLogStorage(): Storage {
  const storage = readLocalStorage();
  return storage ?? memoryStorage;
}

/** `localStorage` if it exists and actually works, `undefined` otherwise. */
function readLocalStorage(): Storage | undefined {
  try {
    const probe = '__minerva.probe__';
    globalThis.localStorage.setItem(probe, probe);
    globalThis.localStorage.removeItem(probe);
    return globalThis.localStorage;
  } catch {
    // Reading the property alone can throw, so the whole probe is guarded.
    return undefined;
  }
}

/** The stand-in: the `Storage` interface over a `Map`, page-lifetime only. */
const memoryStorage: Storage = {
  get length() {
    return entries.size;
  },
  key: (index: number) => [...entries.keys()][index] ?? null,
  getItem: (key: string) => entries.get(key) ?? null,
  setItem: (key: string, value: string) => {
    entries.set(key, value);
  },
  removeItem: (key: string) => {
    entries.delete(key);
  },
  clear: () => {
    entries.clear();
  },
};

const entries = new Map<string, string>();
