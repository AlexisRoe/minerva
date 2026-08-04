import { type RenderResult, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { MinervaThemeProvider } from '../../../theme/minerva-provider.component';
import { ErrorView } from './error-view.component';

const errorId = '3f9a1c2e-7b4d-4e8a-9c1f-0a2b6d5e8c31';

function renderView(ui: ReactElement): RenderResult {
  return render(<MinervaThemeProvider>{ui}</MinervaThemeProvider>);
}

describe('ErrorView', () => {
  it('says what went wrong', () => {
    renderView(<ErrorView title="Reporting failed" />);

    expect(screen.getByText('Reporting failed')).toBeInTheDocument();
  });

  it('explains it in the line under the title', () => {
    renderView(<ErrorView title="Reporting failed" description="Nothing has been reported." />);

    expect(screen.getByText('Nothing has been reported.')).toBeInTheDocument();
  });

  it('takes an element as the description, not only a string', () => {
    renderView(
      <ErrorView
        title="Reporting failed"
        description={
          <span>
            Quote the references to <a href="mailto:support@example.net">support</a>.
          </span>
        }
      />,
    );

    expect(screen.getByRole('link', { name: 'support' })).toBeInTheDocument();
  });

  it('marks the state with the skull', () => {
    const { container } = renderView(<ErrorView title="Reporting failed" />);

    expect(container.querySelector('svg')).toHaveClass('tabler-icon-skull');
  });

  it('shows the references to quote at support', () => {
    renderView(<ErrorView title="Reporting failed" errorId={errorId} errorCode="ERR_800" />);

    expect(screen.getByText(`ID: ${errorId}`)).toBeInTheDocument();
    expect(screen.getByText('ErrorCode: ERR_800')).toBeInTheDocument();
  });

  it('dims both references, since they are for the report and not the reader', () => {
    renderView(<ErrorView title="Reporting failed" errorId={errorId} errorCode="ERR_800" />);

    expect(screen.getByText(`ID: ${errorId}`)).toHaveStyle({ color: 'var(--mantine-color-dimmed)' });
    expect(screen.getByText('ErrorCode: ERR_800')).toHaveStyle({ color: 'var(--mantine-color-dimmed)' });
  });

  it('keeps the references together, under the copy they follow', () => {
    const { container } = renderView(
      <ErrorView
        title="Reporting failed"
        description="Nothing has been reported."
        errorId={errorId}
        errorCode="ERR_800"
      />,
    );

    const section = container.querySelector('section');

    expect(section).toContainElement(screen.getByText(`ID: ${errorId}`));
    expect(section).toContainElement(screen.getByText('ErrorCode: ERR_800'));
    // Mantine keeps the copy and anything added to it in the one body block, so
    // the references follow the description rather than the block that holds it.
    expect(container.querySelector('.mantine-EmptyState-description')?.nextElementSibling).toBe(section);
  });

  it('sets them closer than the blocks around them', () => {
    const { container } = renderView(<ErrorView title="Reporting failed" errorId={errorId} errorCode="ERR_800" />);

    // Mantine spaces a Stack through this variable, so the gap shows up there.
    expect(container.querySelector('section')?.style.getPropertyValue('--stack-gap')).toBe(
      'var(--mantine-spacing-4xs)',
    );
  });

  it('shows whichever reference it has, and not the other', () => {
    renderView(<ErrorView title="Reporting failed" errorId={errorId} />);

    expect(screen.getByText(`ID: ${errorId}`)).toBeInTheDocument();
    expect(screen.queryByText(/ErrorCode/)).toBeNull();
  });

  it('draws no reference block where it has neither', () => {
    const { container } = renderView(<ErrorView title="Reporting failed" />);

    expect(container.querySelector('section')).toBeNull();
  });

  it('draws the button when it has both a label and something to do', () => {
    renderView(<ErrorView title="Reporting failed" buttonLabel="Try again" buttonAction={() => {}} />);

    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('runs the action when the button is pressed', () => {
    const buttonAction = vi.fn();

    renderView(<ErrorView title="Reporting failed" buttonLabel="Try again" buttonAction={buttonAction} />);

    screen.getByRole('button', { name: 'Try again' }).click();

    expect(buttonAction).toHaveBeenCalledOnce();
  });

  it('draws no button from a label with nothing behind it', () => {
    const { container } = renderView(<ErrorView title="Reporting failed" buttonLabel="Try again" />);

    expect(screen.queryByRole('button')).toBeNull();
    expect(container.querySelector('.mantine-EmptyState-actions')).toBeNull();
  });

  it('draws no button from an action with nothing on it', () => {
    renderView(<ErrorView title="Reporting failed" buttonAction={() => {}} />);

    expect(screen.queryByRole('button')).toBeNull();
  });

  it('puts the button last, under the references', () => {
    const { container } = renderView(
      <ErrorView
        title="Reporting failed"
        errorId={errorId}
        errorCode="ERR_800"
        buttonLabel="Try again"
        buttonAction={() => {}}
      />,
    );

    const actions = container.querySelector('.mantine-EmptyState-actions');

    expect(actions).toContainElement(screen.getByRole('button', { name: 'Try again' }));
    expect(container.querySelector('section')?.nextElementSibling).toBe(actions);
  });

  it('passes the rest of the block props through', () => {
    renderView(<ErrorView title="Reporting failed" data-testid="view" align="left" className="view" />);

    expect(screen.getByTestId('view')).toHaveAttribute('data-align', 'left');
    expect(screen.getByTestId('view')).toHaveClass('view');
  });
});
