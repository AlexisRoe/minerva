import { type RenderResult, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { MinervaThemeProvider } from '../../../theme/minerva-provider.component';
import { ButtonInfoContent, type ButtonInfoSection } from './button-info-content.component';

const sections: ButtonInfoSection[] = [
  {
    title: 'Sender',
    entries: [
      { label: 'Display name', value: 'IT Support' },
      { label: 'Address', value: 'it-support@example.net' },
    ],
  },
  {
    title: 'Message',
    entries: [{ label: 'Subject', value: 'Your mailbox is full' }],
  },
];

function renderContent(ui: ReactElement): RenderResult {
  return render(<MinervaThemeProvider>{ui}</MinervaThemeProvider>);
}

/** The rules between the blocks, in the order they are drawn. */
function dividers(container: HTMLElement): Element[] {
  return Array.from(container.querySelectorAll('.mantine-Divider-root'));
}

describe('ButtonInfoContent', () => {
  it('renders every section title as an h3', () => {
    renderContent(<ButtonInfoContent sections={sections} />);

    expect(screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)).toEqual([
      'Sender',
      'Message',
    ]);
  });

  it('renders every label as an h4 under its section', () => {
    renderContent(<ButtonInfoContent sections={sections} />);

    expect(screen.getAllByRole('heading', { level: 4 }).map((heading) => heading.textContent)).toEqual([
      'Display Name',
      'Address',
      'Subject',
    ]);
  });

  it('cases the headings and the labels however they were typed, and leaves the values alone', () => {
    renderContent(
      <ButtonInfoContent
        sections={[{ title: 'SENDER details', entries: [{ label: 'display NAME', value: 'IT Support' }] }]}
      />,
    );

    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Sender Details');
    expect(screen.getByRole('heading', { level: 4 })).toHaveTextContent('Display Name');
    // A value is the answer, not a heading, so it is shown as it came.
    expect(screen.getByText('IT Support')).toBeInTheDocument();
  });

  it('puts each label over its value', () => {
    renderContent(<ButtonInfoContent sections={sections} />);

    const [label, value] = Array.from(screen.getByText('Address').parentElement?.children ?? []);

    expect(label).toHaveTextContent('Address');
    expect(value).toHaveTextContent('it-support@example.net');
  });

  it('dims the labels and leaves the values and the headings in the body colour', () => {
    renderContent(<ButtonInfoContent sections={sections} />);

    expect(screen.getByText('Address')).toHaveStyle({ color: 'var(--mantine-color-dimmed)' });
    expect(screen.getByText('Sender').style.color).toBe('');
    expect(screen.getByText('it-support@example.net').style.color).toBe('');
  });

  it('reads n/a where a pair has no value to show', () => {
    renderContent(<ButtonInfoContent sections={[{ title: 'Sender', entries: [{ label: 'Address', value: null }] }]} />);

    expect(screen.getByText('n/a')).toBeInTheDocument();
  });

  it('closes every section but the last with a divider', () => {
    const { container } = renderContent(<ButtonInfoContent sections={sections} />);

    expect(dividers(container)).toHaveLength(sections.length - 1);
  });

  it('draws no divider at all for a single section', () => {
    const { container } = renderContent(<ButtonInfoContent sections={[sections[0] as ButtonInfoSection]} />);

    expect(dividers(container)).toHaveLength(0);
  });

  it('keeps each divider under the section it closes', () => {
    const { container } = renderContent(<ButtonInfoContent data-testid="info" sections={sections} />);

    const [first, second] = Array.from(screen.getByTestId('info').children);

    expect(first).toHaveTextContent('Sender');
    expect(first?.lastElementChild).toBe(dividers(container)[0]);
    expect(second).toHaveTextContent('Message');
    // Nothing after the last section's pairs — the block it would set off is not there.
    expect(second?.lastElementChild?.tagName).toBe('SECTION');
  });

  it('leaves the divider colour to the house rule, which draws it in the border token', () => {
    const { container } = renderContent(<ButtonInfoContent sections={sections} />);

    // The theme hands every divider the same colour the drawer header is ruled off
    // with, so the component names none of its own.
    expect((dividers(container)[0] as HTMLElement).style.getPropertyValue('--divider-color')).toBe(
      'var(--mantine-color-default-border)',
    );
  });

  it('draws nothing for an empty list of sections', () => {
    renderContent(<ButtonInfoContent data-testid="info" sections={[]} />);

    expect(screen.getByTestId('info').children).toHaveLength(0);
  });

  it('takes nodes as values', () => {
    renderContent(
      <ButtonInfoContent sections={[{ title: 'Sender', entries: [{ label: 'Address', value: <em>Unknown</em> }] }]} />,
    );

    expect(screen.getByText('Unknown').tagName).toBe('EM');
  });

  it('steps the gaps up from the pair to the pairs to the blocks', () => {
    renderContent(<ButtonInfoContent data-testid="info" sections={sections} />);

    // Mantine spaces a Stack through this variable, so each gap shows up there.
    const gapOf = (element: Element | null | undefined): string | undefined =>
      (element as HTMLElement | null)?.style.getPropertyValue('--stack-gap');

    const pair = screen.getByText('Address').parentElement;

    expect(gapOf(screen.getByTestId('info'))).toBe('var(--mantine-spacing-md)');
    expect(gapOf(pair?.closest('section'))).toBe('var(--mantine-spacing-sm)');
    expect(gapOf(pair)).toBe('var(--mantine-spacing-4xs)');
  });

  it('lets a caller open the pane up with a gap of their own', () => {
    renderContent(<ButtonInfoContent data-testid="info" sections={sections} gap="lg" />);

    expect(screen.getByTestId('info').style.getPropertyValue('--stack-gap')).toBe('var(--mantine-spacing-lg)');
  });

  it('lets a caller style override the layout it sets', () => {
    renderContent(<ButtonInfoContent data-testid="info" sections={sections} style={{ display: 'grid' }} />);

    expect(screen.getByTestId('info')).toHaveStyle({ display: 'grid' });
  });

  it('forwards Box props and DOM attributes to the root', () => {
    renderContent(<ButtonInfoContent className="info" data-testid="info" sections={sections} />);

    expect(screen.getByTestId('info')).toHaveClass('info');
  });
});
