import { MinervaThemeProvider } from '@minerva/ui-lib';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { OutlookMessage } from '../../adapters/office';
import { MessageSummary } from './message-summary.component';

const message: OutlookMessage = {
  id: 'AAMkAD==',
  exchangeId: 'rest:AAMkAD==',
  internetMessageId: '<abc@example.com>',
  subject: 'Invoice 2026-0042',
  from: 'billing@example.com',
  receivedAt: '2026-08-03T09:15:00.000Z',
};

describe('MessageSummary', () => {
  it('names the message that is about to be sent', () => {
    render(
      <MinervaThemeProvider>
        <MessageSummary message={message} />
      </MinervaThemeProvider>,
    );

    expect(screen.getByText('Invoice 2026-0042')).toBeInTheDocument();
    expect(screen.getByText('billing@example.com')).toBeInTheDocument();
  });
});
