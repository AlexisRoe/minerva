import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';

import { adaptersFixture } from '@/fixtures/adapters.fixture';
import { configFixture } from '@/fixtures/config.fixture';
import { useConfig } from '@/platform/config/hooks/use-config.hook';
import { ConfigProvider } from './config.provider';

function Version(): ReactElement {
  const { name, version } = useConfig();
  return <p>{`${name}@${version}`}</p>;
}

describe('ConfigProvider', () => {
  it('serves the configuration to the tree below it', () => {
    render(
      <ConfigProvider adapters={adaptersFixture()} config={configFixture}>
        <Version />
      </ConfigProvider>,
    );

    expect(screen.getByText('@minerva/button@0.1.0')).toBeInTheDocument();
  });

  it('serves whatever configuration it is given', () => {
    render(
      <ConfigProvider adapters={adaptersFixture()} config={{ ...configFixture, version: '9.9.9' }}>
        <Version />
      </ConfigProvider>,
    );

    expect(screen.getByText('@minerva/button@9.9.9')).toBeInTheDocument();
  });
});
