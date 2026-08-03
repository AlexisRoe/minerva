import { MinervaThemeProvider } from '@minerva/ui-lib';
// The library build extracts every stylesheet -- Mantine, the theme overrides
// and the @font-face rules -- into one file that the bundled JS does not
// import, so the app has to pull it in itself.
import '@minerva/ui-lib/styles.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { ConfigProvider, loadConfig } from './config';
import { MissingRootElementError } from './errors';
import { captureError, initSentry, SentryErrorBoundary } from './sentry';

// The theme names the families; the files are shared across the repo and this
// app serves them, copied into dist/assets/fonts by `sharedFonts()`.
import '../../../../shared/assets/fonts.css';

/** The splash markup `index.html` ships, replaced by the first render. */
const BOOT_ELEMENT_ID = 'minerva-boot';
/** The message inside it that the failure path reveals. */
const BOOT_ERROR_ELEMENT_ID = 'minerva-boot-error';

/**
 * Loads the runtime configuration, then starts the app against it.
 *
 * Everything here is ordered around one constraint: the configuration arrives
 * over the network, so nothing that depends on it -- Sentry above all -- can run
 * at import time. `index.html` covers the gap with a CSS-only loader that is
 * painted before this bundle is even parsed; the first render replaces it.
 *
 * @see {@link https://react.dev/reference/react-dom/client/createRoot}
 */
async function bootstrap(): Promise<void> {
  const config = await loadConfig();

  // Before the first render, so an error thrown while mounting is reported.
  initSentry(config);

  const container = document.getElementById('root');
  if (!container) {
    throw new MissingRootElementError();
  }

  createRoot(container).render(
    <StrictMode>
      <SentryErrorBoundary fallback={<p>Something went wrong.</p>}>
        <ConfigProvider config={config}>
          <MinervaThemeProvider>
            <App />
          </MinervaThemeProvider>
        </ConfigProvider>
      </SentryErrorBoundary>
    </StrictMode>,
  );

  // React's first commit would clear it too; this drops it on the tick the
  // app mounts rather than whenever that commit lands.
  document.getElementById(BOOT_ELEMENT_ID)?.remove();
}

/**
 * Shows the static failure message `index.html` ships alongside the loader.
 *
 * A configuration this app cannot read is not something it can degrade around,
 * and at this point React never mounted -- there is no component tree to render
 * an error through, only the markup already in the document.
 */
function showBootError(): void {
  document.getElementById(BOOT_ELEMENT_ID)?.setAttribute('data-failed', 'true');
  document.getElementById(BOOT_ERROR_ELEMENT_ID)?.removeAttribute('hidden');
}

bootstrap().catch((error: unknown) => {
  captureError(error);
  showBootError();
});
