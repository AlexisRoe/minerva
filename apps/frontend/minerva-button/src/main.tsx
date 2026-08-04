import { MinervaThemeProvider } from '@minerva/ui-lib';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { showBootError } from './boot';
import { ConfigProvider, loadConfig } from './config';
import { BOOT_ELEMENT_ID } from './constants/bootstrap.constants';
import { MissingRootElementError } from './errors';
import { I18nProvider } from './i18n';
import { captureError, initSentry, MinervaErrorBoundary } from './sentry';
import { BootstrapErrorView } from './views';

import '@minerva/ui-lib/styles.css';
import '../../../../shared/assets/fonts.css';

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

  initSentry(config);

  const container = document.getElementById('root');

  if (!container) {
    throw new MissingRootElementError();
  }

  createRoot(container).render(
    <StrictMode>
      <MinervaErrorBoundary fallback={() => <BootstrapErrorView />}>
        <I18nProvider>
          <MinervaThemeProvider>
            <ConfigProvider config={config}>
              <App />
            </ConfigProvider>
          </MinervaThemeProvider>
        </I18nProvider>
      </MinervaErrorBoundary>
    </StrictMode>,
  );

  document.getElementById(BOOT_ELEMENT_ID)?.remove();
}

bootstrap().catch((error: unknown) => {
  showBootError(error, captureError(error));
});
