import { afterEach, describe, expect, it, vi } from 'vitest';

import { stubOffice } from '@/fixtures/office.fixture';
import { closePane } from './close-pane.util';

describe('closePane', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('asks the host to close the container', () => {
    const { closeContainer } = stubOffice();

    closePane();

    expect(closeContainer).toHaveBeenCalledOnce();
  });

  it('fails with ERR_010 when called before the gate has run', () => {
    expect(() => closePane()).toThrow(expect.objectContaining({ code: 'ERR_010', payload: { reader: 'closePane' } }));
  });

  it('fails with ERR_010 when the host exposes no dialog surface', () => {
    stubOffice({ hasUi: false });

    expect(() => closePane()).toThrow(expect.objectContaining({ code: 'ERR_010' }));
  });
});
