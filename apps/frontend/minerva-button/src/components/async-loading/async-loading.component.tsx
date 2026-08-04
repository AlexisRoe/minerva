import { mixLanguages } from '@minerva/ui-lib';
import {
  createContext,
  type ReactElement,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { InitialLoadingData } from '@/constants/initial-loading.constants';
import { ReportingLoadingData } from '@/constants/reporting-loading.constants';
import { LoadingView } from '@/views/loading/loading.view';

/**
 * Holds whatever the loader resolved with, for the subtree it wrapped.
 *
 * Boxed in an object so `null` is the "no provider above me" marker on its own:
 * a loader is allowed to resolve with `null` or `undefined` -- the start-up one
 * resolves with nothing at all -- and an unboxed value could not tell that apart
 * from a missing provider.
 */
const AsyncDataContext = createContext<{ readonly value: unknown } | null>(null);

/**
 * Reads what the enclosing {@link AsyncLoading} loaded.
 *
 * Named for what it is rather than `useLoaderData`, which is React Router's --
 * two hooks of the same name doing almost the same thing is exactly the import
 * mistake that ends up debugged rather than noticed.
 *
 * Children only render once the loader has resolved, so what this returns is
 * whatever it resolved *with* -- including nothing, for a loader that only has
 * side effects.
 *
 * @typeParam T What the loader resolves with.
 * @returns The loaded value.
 * @throws {@link Error} When called outside an {@link AsyncLoading}.
 *
 * @example
 * ```tsx
 * const result = useAsyncData<ReportResult>();
 * ```
 */
export function useAsyncData<T = unknown>(): T {
  const context = useContext(AsyncDataContext);

  if (context === null) {
    throw new Error('useAsyncData must be called inside an <AsyncLoading>');
  }

  return context.value as T;
}

export interface AsyncLoadingProps<T> {
  /** Which reel to show while waiting: the start-up one, or the reporting one. */
  readonly type?: 'initial' | 'report';
  /** The work to do before the children may render. Must be stable -- memoise it. */
  readonly loader: () => Promise<T>;
  /** What renders once the loader has resolved. */
  readonly children: ReactNode;
}

/**
 * Runs a promise, shows the steps reel while it runs, and renders its result.
 *
 * The pane's whole loading story, and the reason it needs no data router: a
 * screen is wrapped in one of these, its work happens before it renders, and
 * nothing below it has to carry a spinner or a nullable value. The waits are
 * long enough to need something said during them -- start-up signs the user in
 * and fetches settings, reporting uploads an email and sends mail -- so the
 * reel names each step rather than spinning.
 *
 * A failure is **rethrown during render**, which is the only way an async
 * rejection can reach a React error boundary at all; `MinervaErrorBoundary` in
 * `main.tsx` catches it and renders `ErrorScreen`. That is what replaced the
 * router's `errorElement`, and it is why the pane now has one error path rather
 * than two.
 *
 * The loader runs **exactly once per identity**, guarded by a ref rather than
 * left to the effect. Under `StrictMode` React runs every effect twice on mount,
 * and both loaders here have side effects -- one signs in and fetches settings,
 * the other *files a report* -- so a second invocation would mean a duplicate
 * report in the backend and a second notification to the security team. A loader
 * that genuinely changes identity is a different piece of work and does re-run.
 *
 * @typeParam T What the loader resolves with.
 * @returns The reel, or the children with the loaded value in context.
 *
 * @see {@link https://react.dev/reference/react/StrictMode#fixing-bugs-found-by-re-running-effects-in-development}
 *
 * @example
 * ```tsx
 * const loader = useMemo(() => createBootstrapLoader(adapters), [adapters]);
 *
 * <AsyncLoading loader={loader}>
 *   <ReportView />
 * </AsyncLoading>
 * ```
 */
export function AsyncLoading<T>({ type = 'initial', loader, children }: AsyncLoadingProps<T>): ReactElement {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<Error | null>(null);

  const started = useRef<(() => Promise<T>) | null>(null);

  const isReporting = type === 'report';
  const steps = useMemo(() => mixLanguages(isReporting ? ReportingLoadingData : InitialLoadingData), [isReporting]);

  useEffect(() => {
    if (started.current === loader) {
      return;
    }

    started.current = loader;

    setLoading(true);
    setError(null);

    /** Ignores a result that a newer loader has already superseded. */
    const isCurrent = (): boolean => started.current === loader;

    loader()
      .then((result: T) => {
        if (isCurrent()) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((cause: unknown) => {
        if (isCurrent()) {
          setError(cause instanceof Error ? cause : new Error(String(cause)));
          setLoading(false);
        }
      });

    // No cleanup: `StrictMode` unmounts and remounts on the first pass, and a
    // cleanup that cancelled the result would leave the reel spinning forever
    // over work that had already been done. Staleness is decided by the loader's
    // identity instead, which is the thing that actually distinguishes one piece
    // of work from another.
  }, [loader]);

  // Rethrowing during render is what lets the parent error boundary see a
  // failure that happened in a promise.
  if (error !== null) {
    throw error;
  }

  if (loading) {
    return <LoadingView steps={steps} />;
  }

  return <AsyncDataContext.Provider value={{ value: data }}>{children}</AsyncDataContext.Provider>;
}
