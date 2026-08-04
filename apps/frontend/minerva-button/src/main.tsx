import { MinervaThemeProvider } from '@minerva/ui-lib';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { hideBootSplash, showBootError } from './boot';
import { ConfigProvider, loadConfig } from './config';
import { MissingRootElementError } from './errors';
import { I18nProvider } from './i18n';
import { captureError, initSentry, MinervaErrorBoundary, RootErrorBoundary } from './sentry';
import { ErrorScreen } from './views';

import '@minerva/ui-lib/styles.css';
import '../../../../shared/assets/fonts.css';

/**
 * Loads the runtime configuration, then starts the app against it.
 *
 * Everything here is ordered around one constraint: the configuration arrives
 * over the network, so nothing that depends on it -- Sentry above all -- can run
 * at import time. `index.html` covers the gap with a CSS-only loader that is
 * painted before this bundle is even parsed; {@link hideBootSplash} puts it away
 * once the first render is through.
 *
 * The tree has two boundaries because the two positions can promise different
 * things. {@link MinervaErrorBoundary} sits *below* every provider, so its
 * fallback has a theme, a translator and a configuration to render against --
 * which is what lets {@link ErrorScreen} look like the rest of the app and offer
 * a retry against a real budget. {@link RootErrorBoundary} sits above them all
 * and catches what the inner one cannot see, including a provider throwing;
 * having no provider to draw against, it renders nothing and reveals the
 * document's own failure markup instead.
 *
 * Nothing between them is unguarded: React Router's `errorElement` covers the
 * whole route subtree, including loader and action rejections, which never reach
 * a React boundary at all.
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
      <RootErrorBoundary>
        <I18nProvider>
          <MinervaThemeProvider>
            <ConfigProvider config={config}>
              <MinervaErrorBoundary fallback={(error, errorId) => <ErrorScreen error={error} errorId={errorId} />}>
                <App />
              </MinervaErrorBoundary>
            </ConfigProvider>
          </MinervaThemeProvider>
        </I18nProvider>
      </RootErrorBoundary>
    </StrictMode>,
  );

  hideBootSplash();
}

bootstrap().catch((error: unknown) => {
  showBootError(error, captureError(error));
});
