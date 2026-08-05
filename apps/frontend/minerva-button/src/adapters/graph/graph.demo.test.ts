import { describe, expect, it } from 'vitest';

import { DEMO_MIME_CONTENT } from '@/fixtures/demo/mime.fixture';
import { createGraphDemoAdapter } from './graph.demo';

describe('createGraphDemoAdapter', () => {
  it('hands back the demo email as a parseable message/rfc822 blob', async () => {
    const { adapter } = createGraphDemoAdapter();

    const mime = await adapter.getMimeMessage('AAMkAD==');

    expect(mime.type).toBe('message/rfc822');
    await expect(mime.text()).resolves.toBe(DEMO_MIME_CONTENT);
  });

  it('gives a fresh blob per call, so upload and attachment do not race', async () => {
    const { adapter } = createGraphDemoAdapter();

    const first = await adapter.getMimeMessage('AAMkAD==');
    const second = await adapter.getMimeMessage('AAMkAD==');

    expect(first).not.toBe(second);
  });

  it('records what would have been sent instead of sending it', async () => {
    const { adapter, sentMail } = createGraphDemoAdapter();

    await adapter.sendMail({
      to: 'soc@contoso.example',
      subject: 'SUSPICIOUS| lure',
      bodyHtml: '<p>x</p>',
      headers: { 'X-Minerva-Report-Id': 'report-1' },
    });

    expect(sentMail).toEqual([expect.objectContaining({ to: 'soc@contoso.example' })]);
  });

  it('records what would have been moved instead of moving it', async () => {
    const { adapter, movedMessages } = createGraphDemoAdapter();

    await adapter.moveMessage('AAMkAD==', 'junkemail');

    expect(movedMessages).toEqual([{ exchangeId: 'AAMkAD==', destination: 'junkemail' }]);
  });

  it('keeps each adapter record to itself', async () => {
    const first = createGraphDemoAdapter();
    const second = createGraphDemoAdapter();

    await first.adapter.moveMessage('AAMkAD==', 'deleteditems');

    expect(second.movedMessages).toEqual([]);
  });
});
