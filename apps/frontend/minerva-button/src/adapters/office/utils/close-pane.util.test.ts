import { afterEach, describe, expect, it, vi } from 'vitest';

import { closePane } from './close-pane.util';

describe('closePane', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('asks the host to close the container', () => {
    const closeContainer = vi.fn();
    vi.stubGlobal('Office', { context: { ui: { closeContainer } } });

    closePane();

    expect(closeContainer).toHaveBeenCalledOnce();
  });

  it('fails with ERR_010 when called before the gate has run', () => {
    expect(() => closePane()).toThrow(expect.objectContaining({ code: 'ERR_010', payload: { reader: 'closePane' } }));
  });

  it('fails with ERR_010 when the host exposes no dialog surface', () => {
    vi.stubGlobal('Office', { context: {} });

    expect(() => closePane()).toThrow(expect.objectContaining({ code: 'ERR_010' }));
  });
});
