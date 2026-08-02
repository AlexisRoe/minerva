import './instrument';

import { MinervaThemeProvider } from '@minerva/ui-lib';
// The library build extracts every stylesheet -- Mantine, the theme overrides
// and the @font-face rules -- into one file that the bundled JS does not
// import, so the app has to pull it in itself.
import '@minerva/ui-lib/styles.css';
import * as Sentry from '@sentry/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

// The theme names the families; the files are shared across the repo and this
// app serves them, copied into dist/assets/fonts by `sharedFonts()`.
import '../../../../shared/assets/fonts.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Missing #root element');
}

createRoot(container).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<p>Something went wrong.</p>}>
      <MinervaThemeProvider>
        <App />
      </MinervaThemeProvider>
    </Sentry.ErrorBoundary>
  </StrictMode>,
);
