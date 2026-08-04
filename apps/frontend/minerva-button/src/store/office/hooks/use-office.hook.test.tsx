import { Languages } from '@minerva/typescript-lib';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import type { OfficeEnvironment, OutlookMessage, OutlookUser } from '../../../adapters/office';
import { useOfficeStore } from '../office.store';
import { useOffice } from './use-office.hook';

const environment: OfficeEnvironment = {
  host: 'Outlook',
  platform: 'PC',
  naaSupported: false,
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
  displayLanguage: 'en-US',
  language: Languages.English,
};

describe('useOffice', () => {
  beforeEach(() => {
    useOfficeStore.getState().reset();
  });

  it('reports nothing open before the gate has run', () => {
    const { result } = renderHook(() => useOffice());

    expect(result.current).toMatchObject({
      environment: null,
      message: null,
      user: null,
      hasMessage: false,
    });
  });

  it('reads what the loader recorded', () => {
    useOfficeStore.getState().setOffice({ environment, message, user });

    const { result } = renderHook(() => useOffice());

    expect(result.current).toMatchObject({ environment, message, user, hasMessage: true });
  });

  it('reports no message when the pane was not opened on one', () => {
    useOfficeStore.getState().setOffice({ environment, message: null, user });

    const { result } = renderHook(() => useOffice());

    expect(result.current.hasMessage).toBe(false);
  });
});
