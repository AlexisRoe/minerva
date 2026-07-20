import * as Sentry from '@sentry/react';
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import App from './app/app';

const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    release: __APP_VERSION__,
    environment: import.meta.env.MODE,
    sendDefaultPii: false,
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('root element missing in index.html');
}

ReactDOM.createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
