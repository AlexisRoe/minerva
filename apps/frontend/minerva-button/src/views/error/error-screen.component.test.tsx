import { MinervaError } from '@minerva/typescript-lib';
import { MinervaThemeProvider } from '@minerva/ui-lib';
import { type RenderResult, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthClientIdMissingError, TokenAcquisitionFailedError } from '@/domain/errors/auth.errors';
import { OfficeHostUnsupportedError, OfficeLoadTimeoutError } from '@/domain/errors/office.errors';
import { MinervaRequestFailedError } from '@/domain/errors/request.errors';
import { adaptersFixture } from '@/fixtures/adapters.fixture';
import { configFixture } from '@/fixtures/config.fixture';
import { MAX_RETRY } from '@/platform/config/config.types';
import { ConfigProvider } from '@/platform/config/provider/config.provider';
import { ErrorScreen } from './error-screen.component';

/** A MinervaError carrying a code the registry has never heard of. */
class UnregisteredError extends MinervaError {
  constructor() {
    super({
      reference: 'f0e9d8c7-b6a5-4938-8271-0a1b2c3d4e5f',
      code: 'ERR_999',
      message: 'Something no build has classified.',
      logLevel: 'error',
      payload: {},
    });
  }
}

/** Mounts the screen under a configuration with the given retry count. */
function renderScreen(error: unknown, retry = 0, errorId?: string): RenderResult {
  return render(
    <ConfigProvider adapters={adaptersFixture()} config={{ ...configFixture, retry }}>
      <MinervaThemeProvider>
        <ErrorScreen error={error} errorId={errorId} />
      </MinervaThemeProvider>
    </ConfigProvider>,
  );
}

describe('ErrorScreen', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('says the pane cannot run here, with no retry, for an environment failure', async () => {
    renderScreen(new OfficeHostUnsupportedError('Word', 'PC'));

    // Nothing has broken -- the pane is simply somewhere it does not work -- so
    // this is the no-content screen rather than the error one, and there is
    // nothing to retry.
    expect(await screen.findByText(/only runs in outlook/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
  });

  it('shows no error code on the no-content screen', async () => {
    const error = new OfficeLoadTimeoutError(5_000);
    renderScreen(error);

    // A stack reference invites someone to report a fault that is not one.
    await screen.findByText(/could not reach outlook/i);
    expect(screen.queryByText(new RegExp(error.code))).not.toBeInTheDocument();
  });

  it('is drawn in the pane frame, mark and all', async () => {
    renderScreen(new MinervaRequestFailedError('/api/button/settings', 503));

    // A failure is still Minerva speaking; a bare panel with no mark reads as a
    // broken page rather than as an answer.
    expect(await screen.findByText('Minerva')).toBeInTheDocument();
  });

  it('shows the code and reference for one of ours', async () => {
    const error = new MinervaRequestFailedError('/api/button/settings', 503);
    renderScreen(error);

    expect(await screen.findByText(new RegExp(error.code))).toBeInTheDocument();
  });

  it('quotes the Sentry event id, not the throw-site reference', async () => {
    const error = new MinervaRequestFailedError('/api/button/settings', 503);
    renderScreen(error, 0, 'a1b2c3d4e5f60718293a4b5c6d7e8f90');

    // The reference names the throw site and is identical for every occurrence,
    // so it groups reports but cannot pick one out. The event id is what support
    // can actually search for.
    expect(await screen.findByText(/a1b2c3d4e5f60718293a4b5c6d7e8f90/)).toBeInTheDocument();
    expect(screen.queryByText(new RegExp(error.reference))).not.toBeInTheDocument();
  });

  it('shows no id while the report is still in flight', async () => {
    renderScreen(new MinervaRequestFailedError('/api', 503));

    await screen.findByText(/could not continue/i);

    expect(screen.queryByText(/^[0-9a-f]{32}$/)).not.toBeInTheDocument();
  });

  it('shows no code at all for an error it does not recognise', async () => {
    renderScreen(new Error('something in React threw'));

    await screen.findByText(/could not continue/i);

    // A code shown here would invite someone to look up a reference that means
    // nothing and appears in no registry.
    expect(screen.queryByText(/ERR_/)).not.toBeInTheDocument();
  });

  it('gives advice aimed at the failure rather than one line for everything', async () => {
    const { unmount } = renderScreen(new MinervaRequestFailedError('/api', 503));

    expect(await screen.findByText(/check your connection/i)).toBeInTheDocument();

    unmount();
    renderScreen(new TokenAcquisitionFailedError('naa-popup'));

    expect(await screen.findByText(/could not sign you in/i)).toBeInTheDocument();
  });

  it('falls back to the generic tip for a code the registry does not know', async () => {
    // A code from a newer build than this bundle, or from a dependency. Adding an
    // error must never leave this screen without advice.
    renderScreen(new UnregisteredError());

    expect(await screen.findByText(/close the pane and open the message again/i)).toBeInTheDocument();
  });

  it('offers a retry while the budget allows one', async () => {
    renderScreen(new Error('boom'), 0);

    expect(await screen.findByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('offers no retry for a failure the user cannot influence', async () => {
    renderScreen(new AuthClientIdMissingError(), 0);

    await screen.findByText(/could not continue/i);

    // ERR_013 is an incomplete deployment. A button here would invite the user to
    // keep pressing something that cannot work.
    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
  });

  it('offers a retry for a failure that might pass', async () => {
    renderScreen(new MinervaRequestFailedError('/api', 503), 0);

    expect(await screen.findByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('offers no retry once the budget is spent', async () => {
    renderScreen(new Error('boom'), MAX_RETRY);

    await screen.findByText(/could not continue/i);

    // A third attempt only repeats the first two; a button that cannot help is
    // worse than no button.
    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
  });

  it('reloads with the retry counter advanced', async () => {
    const assign = vi.fn();
    vi.stubGlobal('location', { href: 'https://localhost:4101/?demo=true', assign });

    renderScreen(new Error('boom'), 0);
    await userEvent.click(await screen.findByRole('button', { name: /try again/i }));

    const target = new URL(assign.mock.calls[0]?.[0] as string);

    // A reload rather than a re-render: the point is to redo the start-up
    // sequence, which happens above React.
    expect(target.searchParams.get('retry')).toBe('1');
    expect(target.searchParams.get('demo')).toBe('true');
  });
});
