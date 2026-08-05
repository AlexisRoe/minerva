import { afterEach, describe, expect, it, vi } from 'vitest';
import { configFixture } from '@/fixtures/config.fixture';
import { stubOffice } from '@/fixtures/office.fixture';
import { createOfficeLiveAdapter } from './office.live';

vi.mock('@/auth-dialog/utils/acquire-token.util', () => ({
  acquireToken: vi.fn(),
}));

// Kept real, and only spied on: the timeout it is handed is what this file is
// about, but every other case still needs it to read the stubbed host.
vi.mock('@/adapters/office/utils/wait-for-office.util', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/adapters/office/utils/wait-for-office.util')>();

  return { waitForOffice: vi.fn(actual.waitForOffice) };
});

const { acquireToken } = await import('@/auth-dialog/utils/acquire-token.util');
const { waitForOffice } = await import('@/adapters/office/utils/wait-for-office.util');

const config = { ...configFixture, entraClientId: 'client-id' };

describe('createOfficeLiveAdapter', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.mocked(acquireToken).mockReset();
  });

  it('reads the environment, the message and the user in one call', async () => {
    stubOffice({
      item: { itemId: 'item-1', subject: 'Invoice', dateTimeCreated: new Date('2026-08-03T07:42:00.000Z') },
      userProfile: { displayName: 'Ada', emailAddress: 'ada@contoso.example' },
    });

    const host = await createOfficeLiveAdapter(config).readHost();

    expect(host.environment).toMatchObject({ host: 'Outlook', naaSupported: true });
    expect(host.message).toMatchObject({ id: 'item-1', subject: 'Invoice' });
    expect(host.user).toMatchObject({ name: 'Ada', email: 'ada@contoso.example' });
  });

  it('waits for Office.js for as long as the configuration says', async () => {
    stubOffice();

    await createOfficeLiveAdapter({ ...config, officeReadyTimeoutMs: 12_000 }).readHost();

    expect(waitForOffice).toHaveBeenCalledWith(12_000);
  });

  it('signs in with the environment it read', async () => {
    stubOffice();
    vi.mocked(acquireToken).mockResolvedValue({ accessToken: 'token', flow: 'naa' });

    const office = createOfficeLiveAdapter(config);
    await office.readHost();

    await expect(office.acquireToken()).resolves.toBe('token');
    expect(acquireToken).toHaveBeenCalledWith('client-id', expect.objectContaining({ naaSupported: true }));
  });

  it('fails with ERR_010 when a token is asked for before the host was read', async () => {
    stubOffice();

    await expect(createOfficeLiveAdapter(config).acquireToken()).rejects.toThrow(
      expect.objectContaining({ code: 'ERR_010' }),
    );
    expect(acquireToken).not.toHaveBeenCalled();
  });

  it('closes the pane through the host', () => {
    const { closeContainer } = stubOffice();

    createOfficeLiveAdapter(config).closePane();

    expect(closeContainer).toHaveBeenCalledOnce();
  });
});
