import { MinervaThemeProvider } from '@minerva/ui-lib';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createAdapters } from '@/adapters/create-adapters.util';
import { MissingRootElementError } from '@/domain/errors/config.errors';
import { hideBootSplash } from '@/platform/boot/hide-boot-splash.util';
import { showBootError } from '@/platform/boot/show-boot-error.util';
import { ConfigProvider } from '@/platform/config/provider/config.provider';
import { loadConfig } from '@/platform/config/utils/load-config.util';
import { I18nProvider } from '@/platform/i18n/provider/i18n.provider';
import { MinervaErrorBoundary } from '@/platform/sentry/components/minerva-error-boundary.component';
import { RootErrorBoundary } from '@/platform/sentry/components/root-error-boundary.component';
import { captureError } from '@/platform/sentry/utils/capture-error.util';
import { initSentry } from '@/platform/sentry/utils/init-sentry.util';
import { ErrorScreen } from '@/views/error/error-screen.component';
import { App } from './App';

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
 * Nothing between them is unguarded, and there is no third boundary: the pane's
 * two long-running sequences run inside `AsyncLoading`, which rethrows a
 * rejection during render precisely so that {@link MinervaErrorBoundary} is the
 * one thing that has to catch it.
 *
 * The adapters are built here, next to the configuration they are chosen from,
 * and handed to the whole tree through {@link ConfigProvider}. One decision
 * about demo mode, one Office adapter holding the environment sign-in needs, and
 * one Graph token cache shared by the boot sequence and the screen that moves
 * the mail at the very end.
 *
 * @see {@link https://react.dev/reference/react-dom/client/createRoot}
 */
async function bootstrap(): Promise<void> {
  const config = await loadConfig();
  initSentry(config);
  const adapters = createAdapters(config);
  const container = document.getElementById('root');

  if (!container) {
    throw new MissingRootElementError();
  }

  createRoot(container).render(
    <StrictMode>
      <RootErrorBoundary>
        <I18nProvider>
          <MinervaThemeProvider>
            <ConfigProvider adapters={adapters} config={config}>
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
