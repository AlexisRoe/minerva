import { Languages } from '@minerva/typescript-lib';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { stubOffice } from '@/fixtures/office.fixture';
import { readCurrentUser } from './read-current-user.util';

describe('readCurrentUser', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('narrows the mailbox owner to an OutlookUser', () => {
    stubOffice({
      userProfile: {
        displayName: 'Ada Lovelace',
        emailAddress: 'ada@example.com',
        timeZone: 'W. Europe Standard Time',
      },
      displayLanguage: 'de-DE',
    });

    expect(readCurrentUser()).toEqual({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      timeZone: 'W. Europe Standard Time',
      displayLanguage: 'de-DE',
      language: Languages.German,
    });
  });

  it('keeps the full tag while reducing it to a catalogue', () => {
    stubOffice({ displayLanguage: 'en-GB' });

    // The region is what the backend picks templates by, so it must survive;
    // the catalogues are keyed by language alone.
    expect(readCurrentUser()).toMatchObject({
      displayLanguage: 'en-GB',
      language: Languages.English,
    });
  });

  it('falls back to the default catalogue for a language Minerva has none of', () => {
    stubOffice({ displayLanguage: 'ja-JP' });

    expect(readCurrentUser()).toMatchObject({
      displayLanguage: 'ja-JP',
      language: Languages.English,
    });
  });

  it('fills in for a profile the host left blank', () => {
    stubOffice({ userProfile: {} });

    // Every field is optional in the Office.js declarations; a missing name must
    // not become the string "undefined" in the details drawer.
    expect(readCurrentUser()).toMatchObject({ name: '', email: '', timeZone: '' });
  });

  it('fails with ERR_010 when there is no mailbox to read', () => {
    stubOffice({ hasMailbox: false });

    // A mailbox always has an owner, so this is the gate having been skipped
    // rather than a user who does not exist.
    expect(() => readCurrentUser()).toThrow(
      expect.objectContaining({ code: 'ERR_010', payload: { reader: 'readCurrentUser' } }),
    );
  });

  it('fails with ERR_010 when called before the gate has run', () => {
    expect(() => readCurrentUser()).toThrow(expect.objectContaining({ code: 'ERR_010' }));
  });
});
