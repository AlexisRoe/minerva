import { mixLanguages } from '@minerva/ui-lib';
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { InitialLoadingData } from '@/constants/initial-loading.constants';
import { ReportingLoadingData } from '@/constants/reporting-loading.constants';
import { LoadingView } from '@/views/loading/loading.view';

const LoaderDataContext = createContext<unknown>(null);

export function useLoaderData<T = unknown>(): T {
  const context = useContext(LoaderDataContext);

  if (context === null) {
    throw new Error('useLoaderData hook must be placed inside LoadingContext');
  }

  return context as T;
}

interface AsyncLoadingProps<T> {
  type?: 'initial' | 'report';
  loader: () => Promise<T>;
  children: ReactNode;
}

export function AsnycLoading<T>({ type = 'initial', loader, children }: AsyncLoadingProps<T>) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const isReporting = type === 'report';
  const steps = useMemo(() => mixLanguages(isReporting ? ReportingLoadingData : InitialLoadingData), [isReporting]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    loader()
      .then((res: T) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      });

    return () => {
      isMounted = false;
    };
  }, [loader]);

  // CRITICAL: Re-throwing during render allows your parent Error Boundary to catch async errors
  if (error) {
    throw error;
  }

  if (loading) {
    return <LoadingView steps={steps} />;
  }

  return <LoaderDataContext.Provider value={data}>{children}</LoaderDataContext.Provider>;
}
