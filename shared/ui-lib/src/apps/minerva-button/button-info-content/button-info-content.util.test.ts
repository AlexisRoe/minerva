import { describe, expect, it } from 'vitest';
import { toTitleCase } from './button-info-content.util';

describe('toTitleCase', () => {
  it('opens every word with a capital', () => {
    expect(toTitleCase('display name')).toBe('Display Name');
  });

  it('brings the rest of a word back down', () => {
    expect(toTitleCase('ADDRESS')).toBe('Address');
    expect(toTitleCase('dISPLAY nAME')).toBe('Display Name');
  });

  it('leaves what sits between the words exactly as it was', () => {
    expect(toTitleCase('  sender   address  ')).toBe('  Sender   Address  ');
    expect(toTitleCase('subject (raw)')).toBe('Subject (Raw)');
  });

  it('cases both halves of a hyphenated word', () => {
    expect(toTitleCase('E-MAIL address')).toBe('E-Mail Address');
  });

  it('cases a contraction as the one word it is', () => {
    expect(toTitleCase("sender didn't reply")).toBe("Sender Didn't Reply");
    expect(toTitleCase('sender didn’t reply')).toBe('Sender Didn’t Reply');
  });

  it('keeps a word that opens with a digit', () => {
    expect(toTitleCase('2FA enabled')).toBe('2fa Enabled');
  });

  it('cases letters outside the alphabet it was written for', () => {
    expect(toTitleCase('ÜBERMITTLUNG')).toBe('Übermittlung');
    expect(toTitleCase('anschrift des absenders')).toBe('Anschrift Des Absenders');
  });

  it('hands back a line with nothing to case', () => {
    expect(toTitleCase('')).toBe('');
    expect(toTitleCase('— / —')).toBe('— / —');
  });
});
