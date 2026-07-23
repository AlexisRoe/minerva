import { API_ROUTES, APP_NAME, type HealthResponse } from '@minerva/shared';
import { useEffect, useState } from 'react';

const apiUrl: string = import.meta.env.VITE_API_URL ?? 'https://localhost:3000';

export function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${apiUrl}${API_ROUTES.health}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json() as Promise<HealthResponse>;
      })
      .then(setHealth)
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setError(cause instanceof Error ? cause.message : String(cause));
        }
      });
    return () => controller.abort();
  }, []);

  return (
    <section>
      <h1>{APP_NAME} Inspector</h1>
      <p>
        Version {__APP_VERSION__} ({__BUILD_COMMIT_HASH__})
      </p>
      {health && (
        <p data-testid="api-status">
          API is {health.status} — db-ro: {health.services.databaseRead}, db-rw: {health.services.databaseWrite},
          valkey: {health.services.valkey}, s3: {health.services.s3}
        </p>
      )}
      {error && <p data-testid="api-error">API unreachable: {error}</p>}
      {!health && !error && <p>Checking API…</p>}
    </section>
  );
}

export default App;
