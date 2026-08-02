import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { MinervaThemeProvider } from '../../../theme/minerva-provider.component';
import { ConfirmationView } from './confirmation-view.component';

const title = 'Thanks for reporting';
const statusMessage = 'It has been moved out of your inbox.';
const details = ['The security team looks at the mail.', 'You hear back only if they need something.'];

function renderView(ui: ReactElement) {
  return render(<MinervaThemeProvider>{ui}</MinervaThemeProvider>);
}

describe('ConfirmationView', () => {
  it('says what has just happened', () => {
    renderView(<ConfirmationView title={title} />);

    expect(screen.getByText(title)).toBeInTheDocument();
  });

  it('makes the title the heading the page is read by', () => {
    renderView(<ConfirmationView title={title} />);

    expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument();
  });

  it('explains it in the line under the title', () => {
    renderView(<ConfirmationView title={title} description="The mail is on its way." />);

    expect(screen.getByText('The mail is on its way.')).toBeInTheDocument();
  });

  it('takes an element as the description, not only a string', () => {
    renderView(
      <ConfirmationView
        title={title}
        description={
          <span>
            Anything you are unsure of goes to <a href="mailto:support@example.net">support</a>.
          </span>
        }
      />,
    );

    expect(screen.getByRole('link', { name: 'support' })).toBeInTheDocument();
  });

  it('marks the state with the mailbox', () => {
    const { container } = renderView(<ConfirmationView title={title} />);

    expect(container.querySelector('svg')).toHaveClass('tabler-icon-mailbox');
  });

  it('says where the mail itself ended up, set off by a rule', () => {
    const { container } = renderView(<ConfirmationView title={title} statusMessage={statusMessage} />);

    const section = container.querySelector('section');

    expect(section).toContainElement(screen.getByText(statusMessage));
    expect(section?.querySelector('.mantine-Divider-root')).toBeInTheDocument();
  });

  it('draws no status section where it has nothing to report', () => {
    const { container } = renderView(<ConfirmationView title={title} description="The mail is on its way." />);

    expect(container.querySelector('section')).toBeNull();
  });

  it('lists what follows from here, a line each', () => {
    renderView(<ConfirmationView title={title} details={details} />);

    const items = screen.getAllByRole('listitem');

    expect(items).toHaveLength(details.length);
    expect(items.map((item) => item.textContent)).toEqual(details);
  });

  it('heads the list with an h2, under the title of the page', () => {
    renderView(<ConfirmationView title={title} detailsTitle="What happens next" details={details} />);

    expect(screen.getByRole('heading', { level: 2, name: 'What happens next' })).toBeInTheDocument();
  });

  it('keeps the heading with the list it heads', () => {
    const { container } = renderView(
      <ConfirmationView title={title} detailsTitle="What happens next" details={details} />,
    );

    const section = container.querySelector('section');

    expect(section).toContainElement(screen.getByRole('heading', { level: 2 }));
    expect(section).toContainElement(screen.getByRole('list'));
  });

  it('shows the list without a heading where it is given none', () => {
    renderView(<ConfirmationView title={title} details={details} />);

    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 2 })).toBeNull();
  });

  it('draws no list section from a heading with nothing under it', () => {
    const { container } = renderView(<ConfirmationView title={title} detailsTitle="What happens next" />);

    expect(screen.queryByRole('list')).toBeNull();
    expect(screen.queryByText('What happens next')).toBeNull();
    expect(container.querySelector('section')).toBeNull();
  });

  it('draws no list section from an empty list', () => {
    const { container } = renderView(<ConfirmationView title={title} details={[]} />);

    expect(container.querySelector('section')).toBeNull();
  });

  it('keeps the two sections apart, and in the order they are read in', () => {
    const { container } = renderView(
      <ConfirmationView
        title={title}
        statusMessage={statusMessage}
        detailsTitle="What happens next"
        details={details}
      />,
    );

    const sections = container.querySelectorAll('section');

    expect(sections).toHaveLength(2);
    expect(sections[0]).toContainElement(screen.getByText(statusMessage));
    expect(sections[1]).toContainElement(screen.getByRole('list'));
  });

  it('puts the sections under the copy they follow', () => {
    const { container } = renderView(
      <ConfirmationView title={title} description="The mail is on its way." statusMessage={statusMessage} />,
    );

    expect(screen.getByText('The mail is on its way.').nextElementSibling).toBe(container.querySelector('section'));
  });

  it('runs the sections the full width of the block, so the rule reads across the pane', () => {
    const { container } = renderView(<ConfirmationView title={title} statusMessage={statusMessage} />);

    expect(container.querySelector('section')).toHaveStyle({ width: '100%' });
  });

  it('draws the one rule only, since the list is set off by its heading rather than by another', () => {
    const { container } = renderView(
      <ConfirmationView
        title={title}
        statusMessage={statusMessage}
        detailsTitle="What happens next"
        details={details}
      />,
    );

    expect(container.querySelectorAll('.mantine-Divider-root')).toHaveLength(1);
  });

  it('reads both sections down the left, whatever the copy above them does', () => {
    const { container } = renderView(
      <ConfirmationView
        title={title}
        statusMessage={statusMessage}
        detailsTitle="What happens next"
        details={details}
      />,
    );

    for (const section of container.querySelectorAll('section')) {
      expect(section).toHaveStyle({ textAlign: 'start' });
    }
  });

  it('sets the rule off from the copy it closes', () => {
    const { container } = renderView(<ConfirmationView title={title} statusMessage={statusMessage} />);

    expect(container.querySelector('.mantine-Divider-root')).toHaveStyle({ marginTop: '1.5rem' });
  });

  it('starts at the top of the pane rather than in the middle of it', () => {
    renderView(<ConfirmationView title={title} data-testid="view" />);

    // Mantine lays a Stack out through these variables, so the column it draws
    // shows up there rather than in a style this component writes.
    expect(screen.getByTestId('view').style.getPropertyValue('--stack-justify')).toBe('flex-start');
    expect(screen.getByTestId('view').style.getPropertyValue('--stack-align')).toBe('center');
  });

  it('sets the blocks of the page a theme step apart', () => {
    renderView(<ConfirmationView title={title} data-testid="view" />);

    expect(screen.getByTestId('view').style.getPropertyValue('--stack-gap')).toBe('var(--mantine-spacing-xs)');
  });

  it('lets a caller open the page up with a gap of their own', () => {
    renderView(<ConfirmationView title={title} data-testid="view" gap="md" />);

    expect(screen.getByTestId('view').style.getPropertyValue('--stack-gap')).toBe('var(--mantine-spacing-md)');
  });

  it('draws the mark large, since it is the whole of what the page says at a glance', () => {
    const { container } = renderView(<ConfirmationView title={title} />);

    expect(container.querySelector('svg')).toHaveAttribute('width', '86');
  });

  it('fills what it is put in, so it takes the page rather than sitting in it', () => {
    renderView(<ConfirmationView title={title} data-testid="view" />);

    expect(screen.getByTestId('view')).toHaveStyle({ width: '100%', height: '100%' });
  });

  it('passes the Mantine style props through to its root', () => {
    renderView(<ConfirmationView title={title} data-testid="view" className="view" mt="lg" />);

    expect(screen.getByTestId('view')).toHaveClass('view');
    expect(screen.getByTestId('view')).toHaveStyle({ marginTop: 'var(--mantine-spacing-lg)' });
  });
});
