import type { HealthResponse } from '@minerva/shared';
import { render, screen, waitFor } from '@testing-library/react';
import App from './app';

const healthyResponse: HealthResponse = {
  status: 'ok',
  version: '0.1.0',
  services: { databaseRead: 'up', databaseWrite: 'up', valkey: 'up', s3: 'up' },
};

describe('App', () => {
  it('renders the app name and reports API health', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(healthyResponse) }));

    render(<App />);

    expect(screen.getByRole('heading')).toHaveTextContent('Hello from Minerva Inspector');
    await waitFor(() => expect(screen.getByTestId('api-status')).toHaveTextContent('API is ok'));
  });

  it('shows an error when the API is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('connection refused')));

    render(<App />);

    await waitFor(() => expect(screen.getByTestId('api-error')).toHaveTextContent('connection refused'));
  });
});
