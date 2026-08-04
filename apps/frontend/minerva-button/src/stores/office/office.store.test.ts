import { Languages } from '@minerva/typescript-lib';
import { beforeEach, describe, expect, it } from 'vitest';

import type { OfficeEnvironment, OutlookMessage, OutlookUser } from '@/adapters/office/office.types';
import { useOfficeStore } from './office.store';

const environment: OfficeEnvironment = {
  host: 'Outlook',
  platform: 'OfficeOnline',
  naaSupported: true,
};

const message: OutlookMessage = {
  id: 'AAMkAD==',
  exchangeId: 'rest:AAMkAD==',
  internetMessageId: '<abc@example.com>',
  subject: 'Invoice 2026-0042',
  from: 'billing@example.com',
  receivedAt: '2026-08-03T09:15:00.000Z',
};

const user: OutlookUser = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  timeZone: 'W. Europe Standard Time',
  displayLanguage: 'de-DE',
  language: Languages.German,
};

describe('useOfficeStore', () => {
  beforeEach(() => {
    useOfficeStore.getState().reset();
  });

  it('starts empty, before the start-up gate has run', () => {
    expect(useOfficeStore.getState()).toMatchObject({
      environment: null,
      message: null,
      user: null,
    });
  });

  it('records everything the gate learned in one write', () => {
    useOfficeStore.getState().setOffice({ environment, message, user });

    expect(useOfficeStore.getState()).toMatchObject({ environment, message, user });
  });

  it('keeps a pane with no open message distinguishable from one not yet read', () => {
    useOfficeStore.getState().setOffice({ environment, message: null, user });

    // Both leave `message` null, so the environment is what tells them apart.
    expect(useOfficeStore.getState().message).toBeNull();
    expect(useOfficeStore.getState().environment).toBe(environment);
  });

  it('empties again on reset', () => {
    useOfficeStore.getState().setOffice({ environment, message, user });
    useOfficeStore.getState().reset();

    expect(useOfficeStore.getState()).toMatchObject({
      environment: null,
      message: null,
      user: null,
    });
  });
});
