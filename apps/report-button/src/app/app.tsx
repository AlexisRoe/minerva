import { API_ROUTES, APP_NAME, type HelloEventResponse } from '@minerva/shared';
import { useState } from 'react';

const apiUrl: string = import.meta.env.VITE_API_URL ?? 'https://localhost:3000';

export function App() {
  const [lastEventId, setLastEventId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sendReport = () => {
    setError(null);
    fetch(`${apiUrl}${API_ROUTES.helloEvent}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'hello from report-button' }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json() as Promise<HelloEventResponse>;
      })
      .then((result) => setLastEventId(result.eventId))
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : String(cause)));
  };

  return (
    <section>
      <h1>{APP_NAME} Report Button</h1>
      <p>
        Version {__APP_VERSION__} ({__BUILD_COMMIT_HASH__})
      </p>
      <button type="button" onClick={sendReport}>
        Send hello event
      </button>
      {lastEventId && <p data-testid="event-id">Event published: {lastEventId}</p>}
      {error && <p data-testid="api-error">Failed to publish: {error}</p>}
    </section>
  );
}

export default App;
