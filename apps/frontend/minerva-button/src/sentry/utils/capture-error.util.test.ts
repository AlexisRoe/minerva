import * as Sentry from '@sentry/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ConfigRequestFailedError, MissingRootElementError, OfficeHostUnsupportedError } from '../../errors';
import { useErrorLogStore } from '../../store';
import { captureError } from './capture-error.util';

vi.mock('@sentry/react', () => ({
  captureException: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  localStorage.clear();
  useErrorLogStore.setState({ entries: [] });
});

describe('captureError', () => {
  it('indexes a Minerva error by code and reference', () => {
    const error = new ConfigRequestFailedError('/config.json', 404, 'Not Found');

    captureError(error);

    expect(Sentry.captureException).toHaveBeenCalledWith(
      error,
      expect.objectContaining({
        tags: { code: 'ERR_001', reference: error.reference },
        extra: { path: '/config.json', status: 404, statusText: 'Not Found' },
      }),
    );
  });

  it('fingerprints on code and reference, so one throw site is one issue', () => {
    const error = new ConfigRequestFailedError('/config.json', 500, 'Server Error');

    captureError(error);

    expect(Sentry.captureException).toHaveBeenCalledWith(
      error,
      expect.objectContaining({ fingerprint: ['ERR_001', error.reference] }),
    );
  });

  it('keeps two errors apart by their reference', () => {
    const first = new ConfigRequestFailedError('/config.json', 500, 'Server Error');
    const second = new MissingRootElementError();

    captureError(first);
    captureError(second);

    const fingerprints = vi
      .mocked(Sentry.captureException)
      .mock.calls.map(([, hint]) => (hint as { fingerprint?: string[] } | undefined)?.fingerprint);

    expect(fingerprints[0]).not.toEqual(fingerprints[1]);
  });

  it("reports at the error's own level", () => {
    // `MissingRootElementError` asks for 'fatal', which Sentry spells the same.
    captureError(new MissingRootElementError());

    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ level: 'fatal' }),
    );
  });

  it("maps the level Sentry spells differently ('warn' is 'warning')", () => {
    const error = new ConfigRequestFailedError('/config.json', 404, 'Not Found');
    Object.defineProperty(error, 'logLevel', { value: 'warn' });

    captureError(error);

    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ level: 'warning' }),
    );
  });

  it('falls back to error for an error carrying no level', () => {
    const error = new ConfigRequestFailedError('/config.json', 404, 'Not Found');
    Object.defineProperty(error, 'logLevel', { value: undefined });

    captureError(error);

    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ level: 'error' }),
    );
  });

  it('logs a Minerva error as one JSON line', () => {
    const error = new ConfigRequestFailedError('/config.json', 404, 'Not Found');

    captureError(error);

    expect(console.error).toHaveBeenCalledWith(JSON.stringify(error));
  });

  it('writes the console line with the method the level asks for', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const error = new OfficeHostUnsupportedError('Word', 'PC');

    captureError(error);

    // A warning in Sentry and a red line in the console would be two different
    // stories about one event.
    expect(console.warn).toHaveBeenCalledWith(JSON.stringify(error));
    expect(console.error).not.toHaveBeenCalled();
  });

  it("logs 'fatal' through console.error, which is as loud as the console gets", () => {
    captureError(new MissingRootElementError());

    expect(console.error).toHaveBeenCalledTimes(1);
  });

  it('still reports something it did not throw itself, at the default level', () => {
    const error = new TypeError('boom');

    captureError(error);

    expect(Sentry.captureException).toHaveBeenCalledWith(error, { level: 'error' });
    expect(console.error).toHaveBeenCalledWith('Minerva error', error);
  });

  it('handles a thrown non-error', () => {
    captureError('boom');

    expect(Sentry.captureException).toHaveBeenCalledWith('boom', { level: 'error' });
  });

  it('writes every error to the persisted log, whatever its kind', () => {
    captureError(new ConfigRequestFailedError('/config.json', 404, 'Not Found'));
    captureError(new TypeError('boom'));
    captureError('boom');

    expect(useErrorLogStore.getState().entries.map((entry) => entry.name)).toEqual([
      'UnknownError',
      'TypeError',
      'ConfigRequestFailedError',
    ]);
  });
});
