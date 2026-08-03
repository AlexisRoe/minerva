import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { configFixture } from '../config.fixture';
import { useConfig } from '../hooks/use-config.hook';
import { ConfigProvider } from './config.provider';

function Version() {
  const { name, version } = useConfig();
  return <p>{`${name}@${version}`}</p>;
}

describe('ConfigProvider', () => {
  it('serves the configuration to the tree below it', () => {
    render(
      <ConfigProvider config={configFixture}>
        <Version />
      </ConfigProvider>,
    );

    expect(screen.getByText('@minerva/manager@0.1.0')).toBeInTheDocument();
  });

  it('serves whatever configuration it is given', () => {
    render(
      <ConfigProvider config={{ ...configFixture, version: '9.9.9' }}>
        <Version />
      </ConfigProvider>,
    );

    expect(screen.getByText('@minerva/manager@9.9.9')).toBeInTheDocument();
  });
});
