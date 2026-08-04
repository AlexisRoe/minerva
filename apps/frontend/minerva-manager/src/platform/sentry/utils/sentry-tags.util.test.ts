import * as Sentry from '@sentry/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { configFixture } from '@/fixtures/config.fixture';
import { setBuildTags, setTag } from './sentry-tags.util';

vi.mock('@sentry/react', () => ({
  setTag: vi.fn(),
  setTags: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('setBuildTags', () => {
  it('tags the app, version, build time and mode', () => {
    setBuildTags(configFixture);

    expect(Sentry.setTags).toHaveBeenCalledWith({
      app: configFixture.name,
      version: configFixture.version,
      buildTime: configFixture.buildTime,
      mode: configFixture.mode,
    });
  });

  it('follows the configuration it is given', () => {
    setBuildTags({ ...configFixture, version: '9.9.9', mode: 'production' });

    expect(Sentry.setTags).toHaveBeenCalledWith(expect.objectContaining({ version: '9.9.9', mode: 'production' }));
  });

  it('leaves the DSN and sample rate out -- neither belongs in a search index', () => {
    setBuildTags({ ...configFixture, sentryDsn: 'https://key@example.ingest.sentry.io/1' });

    const [tags] = vi.mocked(Sentry.setTags).mock.calls[0] ?? [];
    expect(tags).not.toHaveProperty('sentryDsn');
    expect(tags).not.toHaveProperty('sentryTracesSampleRate');
  });
});

describe('setTag', () => {
  it('sets one tag', () => {
    setTag('view', 'inbox');

    expect(Sentry.setTag).toHaveBeenCalledWith('view', 'inbox');
  });

  it('passes undefined through, which removes the tag', () => {
    setTag('view', undefined);

    expect(Sentry.setTag).toHaveBeenCalledWith('view', undefined);
  });
});
