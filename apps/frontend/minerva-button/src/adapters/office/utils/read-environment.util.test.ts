import { afterEach, describe, expect, it, vi } from 'vitest';

import type { OfficeReadyInfo } from '../office.types';
import { MAILBOX_REQUIREMENT_SET, NAA_REQUIREMENT_SET, readEnvironment } from './read-environment.util';

/**
 * What `Office.onReady()` hands back inside Outlook on the web.
 *
 * The strings are asserted into the enums deliberately: those are the values
 * Office.js really sends, while `@types/office-js` declares the enums as
 * numeric. See `OfficeReadyInfo` -- this fixture is the discrepancy written out.
 */
const readyInfo: OfficeReadyInfo = {
  host: 'Outlook' as unknown as Office.HostType,
  platform: 'OfficeOnline' as unknown as Office.PlatformType,
};

/**
 * Installs an `Office` global whose `isSetSupported` answers from `supported`,
 * so a test names the sets this client has and nothing else.
 */
function stubOffice(options: { withMailbox?: boolean; supported?: readonly string[] }): void {
  const { withMailbox = true, supported = ['Mailbox', 'NestedAppAuth'] } = options;

  vi.stubGlobal('Office', {
    context: {
      ...(withMailbox ? { mailbox: {} } : {}),
      requirements: { isSetSupported: (name: string) => supported.includes(name) },
    },
  });
}

describe('readEnvironment', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reports the host, the platform and that NAA is available', () => {
    stubOffice({});

    expect(readEnvironment(readyInfo)).toEqual({
      host: 'Outlook',
      platform: 'OfficeOnline',
      naaSupported: true,
    });
  });

  it('reports NAA as unavailable without failing', () => {
    stubOffice({ supported: ['Mailbox'] });

    expect(readEnvironment(readyInfo)).toMatchObject({ naaSupported: false });
  });

  it('fails with ERR_008 when the host is not Outlook', () => {
    stubOffice({ withMailbox: false });

    expect(() => readEnvironment(readyInfo)).toThrow(
      expect.objectContaining({
        code: 'ERR_008',
        payload: { host: 'Outlook', platform: 'OfficeOnline' },
      }),
    );
  });

  it('fails with ERR_009 when Outlook is too old', () => {
    stubOffice({ supported: [] });

    expect(() => readEnvironment(readyInfo)).toThrow(
      expect.objectContaining({
        code: 'ERR_009',
        payload: {
          name: 'Mailbox',
          minVersion: '1.13',
          host: 'Outlook',
          platform: 'OfficeOnline',
        },
      }),
    );
  });

  it('falls back to "unknown" when the host reports neither', () => {
    stubOffice({});

    expect(readEnvironment({ host: null, platform: null })).toMatchObject({
      host: 'unknown',
      platform: 'unknown',
    });
  });

  it('requires the same Mailbox set the manifest declares', () => {
    expect(MAILBOX_REQUIREMENT_SET).toEqual({ name: 'Mailbox', minVersion: '1.13' });
    expect(NAA_REQUIREMENT_SET).toEqual({ name: 'NestedAppAuth', minVersion: '1.1' });
  });
});
