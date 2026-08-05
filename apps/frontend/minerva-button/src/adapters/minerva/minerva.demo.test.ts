import { Languages } from '@minerva/typescript-lib';
import { describe, expect, it } from 'vitest';

import { demoAuthorization, demoReportingResponse, demoSettings } from '@/fixtures/demo/minerva.fixture';
import { createMinervaDemoAdapter } from './minerva.demo';

describe('createMinervaDemoAdapter', () => {
  it('answers every call from the fixtures', async () => {
    const minerva = createMinervaDemoAdapter();

    await expect(minerva.authorize({ authToken: 'anything' })).resolves.toEqual(demoAuthorization);
    await expect(minerva.getSettings({ userLanguage: Languages.English })).resolves.toEqual(demoSettings);
    await expect(
      minerva.submitReport({
        file: new Blob(['mime']),
        reportingReasons: [],
        feedbackMessage: '',
        timeZone: 'Europe/Berlin',
        userLanguage: 'en-GB',
        reportedAs: 'spam',
        deliveredAt: '2026-08-03T07:42:00.000Z',
        exchangeId: 'AAMkAD==',
      }),
    ).resolves.toEqual(demoReportingResponse);
  });
});
