import { describe, expect, it } from 'vitest';

import { createReportAction, readReportIntent } from './report.action';

/** Builds the body the report drawer submits. */
function form(entries: [string, string][]): FormData {
  const data = new FormData();

  for (const [key, value] of entries) {
    data.append(key, value);
  }

  return data;
}

describe('readReportIntent', () => {
  it('reads back everything the drawer collected', () => {
    expect(
      readReportIntent(
        form([
          ['variant', 'spam'],
          ['reasons', 'reason-a'],
          ['reasons', 'reason-b'],
          ['comment', 'Looks like a fake login page.'],
        ]),
      ),
    ).toEqual({
      variant: 'spam',
      reasons: ['reason-a', 'reason-b'],
      comment: 'Looks like a fake login page.',
    });
  });

  it('reads repeated fields as the list they are', () => {
    const intent = readReportIntent(
      form([
        ['variant', 'suspicious'],
        ['reasons', 'only-one'],
      ]),
    );

    // A single pick must still come back as a list, or the upload would send a
    // string where the contract wants an array.
    expect(intent.reasons).toEqual(['only-one']);
  });

  it('tolerates a report with no reasons and no note', () => {
    expect(readReportIntent(form([['variant', 'spam']]))).toEqual({
      variant: 'spam',
      reasons: [],
      comment: '',
    });
  });

  it('falls back to suspicious rather than losing a malformed report', () => {
    // Whatever the form said, a submission got this far because a user pressed
    // send; dropping it would be worse than filing it under the stricter variant.
    expect(readReportIntent(form([['variant', 'nonsense']])).variant).toBe('suspicious');
    expect(readReportIntent(form([])).variant).toBe('suspicious');
  });
});

describe('createReportAction', () => {
  it('hands the intent on to the confirmation screen', async () => {
    const request = new Request('https://localhost/confirmation', {
      method: 'POST',
      body: form([
        ['variant', 'spam'],
        ['comment', 'unsolicited'],
      ]),
    });

    await expect(createReportAction()({ request })).resolves.toEqual({
      variant: 'spam',
      reasons: [],
      comment: 'unsolicited',
    });
  });
});
