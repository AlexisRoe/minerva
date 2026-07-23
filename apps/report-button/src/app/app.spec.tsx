import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './app';

describe('App', () => {
  it('renders the app name', () => {
    render(<App />);
    expect(screen.getByRole('heading')).toHaveTextContent('Minerva Report Button');
  });

  it('publishes a hello event on click', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ eventId: '42-0' }) }));

    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: /send hello event/i }));

    await waitFor(() => expect(screen.getByTestId('event-id')).toHaveTextContent('42-0'));
  });
});
