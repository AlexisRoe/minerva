import { describe, expect, it } from 'vitest';
import { demoEnvironment, demoMessage, demoUser } from '@/fixtures/demo/office.fixture';
import { createOfficeDemoAdapter } from './office.demo';

describe('createOfficeDemoAdapter', () => {
  it('reports the fixture host without touching Office.js', async () => {
    expect(typeof Office).toBe('undefined');

    await expect(createOfficeDemoAdapter().readHost()).resolves.toEqual({
      environment: demoEnvironment,
      message: demoMessage,
      user: demoUser,
    });
  });

  it('hands out an empty token rather than failing', async () => {
    await expect(createOfficeDemoAdapter().acquireToken()).resolves.toBe('');
  });

  it('closes without a container to close', () => {
    expect(() => createOfficeDemoAdapter().closePane()).not.toThrow();
  });
});
