import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ErrorView } from './error-view';

describe('ErrorView', () => {
  it('renders the given title and description', () => {
    render(
      <ErrorView
        title="Something went wrong"
        description="We couldn't submit your report."
        id="a1b2c3d4-e5f6-7890-abcd-ef1234567890"
        errorCode="ERR_500"
        buttonText="Try again"
        onButtonClick={vi.fn()}
      />,
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText("We couldn't submit your report.")).toBeInTheDocument();
  });

  it('renders the id and error code', () => {
    render(
      <ErrorView
        title="Title"
        description="Description"
        id="a1b2c3d4-e5f6-7890-abcd-ef1234567890"
        errorCode="ERR_500"
        buttonText="Try again"
        onButtonClick={vi.fn()}
      />,
    );

    expect(screen.getByText(/a1b2c3d4-e5f6-7890-abcd-ef1234567890/)).toBeInTheDocument();
    expect(screen.getByText(/ERR_500/)).toBeInTheDocument();
  });

  it('renders the skull icon', () => {
    const { container } = render(
      <ErrorView
        title="Title"
        description="Description"
        id="ref"
        errorCode="code"
        buttonText="Try again"
        onButtonClick={vi.fn()}
      />,
    );

    expect(container.querySelector('svg.tabler-icon-skull')).toBeInTheDocument();
  });

  it('renders the button with the given text and calls onButtonClick when clicked', async () => {
    const user = userEvent.setup();
    const onButtonClick = vi.fn();
    render(
      <ErrorView
        title="Title"
        description="Description"
        id="ref"
        errorCode="code"
        buttonText="Try again"
        onButtonClick={onButtonClick}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(onButtonClick).toHaveBeenCalledOnce();
  });
});
