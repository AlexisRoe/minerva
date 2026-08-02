import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { MinervaThemeProvider } from '../../../theme/minerva-provider.component';
import { type ReportingReason, UserFeedback } from './user-feedback.component';

function renderFeedback(ui: ReactElement) {
  return render(<MinervaThemeProvider>{ui}</MinervaThemeProvider>);
}

const reasons: ReportingReason[] = [
  { value: 'sender', label: 'The sender is not who they claim to be' },
  { value: 'links', label: 'It asks me to follow a link' },
  { value: 'attachment', label: 'It came with an attachment I did not expect' },
];

/** The value of the last call, which is the one the parent is acting on. */
function lastValue(onChange: ReturnType<typeof vi.fn>) {
  return onChange.mock.lastCall?.[0];
}

describe('UserFeedback', () => {
  it('lists a box per reason, each saying what it stands for', () => {
    renderFeedback(<UserFeedback reasons={reasons} reasonsLabel="What is wrong with it?" />);

    expect(screen.getAllByRole('checkbox')).toHaveLength(3);
    expect(screen.getByRole('checkbox', { name: 'It asks me to follow a link' })).toBeInTheDocument();
  });

  it('draws no list where there is nothing to put in one', () => {
    renderFeedback(<UserFeedback reasons={[]} reasonsLabel="What is wrong with it?" hasUserInput />);

    expect(screen.queryByRole('checkbox')).toBeNull();
    expect(screen.queryByText('What is wrong with it?')).toBeNull();
  });

  it('asks for a note only where one is asked for', () => {
    const { rerender } = renderFeedback(<UserFeedback reasons={reasons} inputLabel="What made you report this?" />);

    expect(screen.queryByRole('textbox')).toBeNull();

    rerender(
      <MinervaThemeProvider>
        <UserFeedback reasons={reasons} hasUserInput inputLabel="What made you report this?" />
      </MinervaThemeProvider>,
    );

    expect(screen.getByRole('textbox', { name: 'What made you report this?' })).toBeInTheDocument();
  });

  it('puts the reasons above the note, which is what is left to say after them', () => {
    renderFeedback(<UserFeedback reasons={reasons} hasUserInput inputLabel="Anything else we should know?" />);

    const firstBox = screen.getByRole('checkbox', { name: 'The sender is not who they claim to be' });

    expect(firstBox.compareDocumentPosition(screen.getByRole('textbox'))).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('shows the title over the block when it is given one', () => {
    renderFeedback(<UserFeedback title="Tell us what is wrong" reasons={reasons} />);

    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Tell us what is wrong');
  });

  it('hands the parent what it holds before anybody has touched it', () => {
    const onChange = vi.fn();

    renderFeedback(<UserFeedback reasons={reasons} onChange={onChange} />);

    expect(onChange).toHaveBeenCalledOnce();
    expect(lastValue(onChange)).toEqual({ reasons: [], comment: '', isValid: true });
  });

  it('hands back the reasons in the order they were given, not the order they were ticked', () => {
    const onChange = vi.fn();

    renderFeedback(<UserFeedback reasons={reasons} onChange={onChange} />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'It asks me to follow a link' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'The sender is not who they claim to be' }));

    expect(lastValue(onChange).reasons).toEqual(['sender', 'links']);
  });

  it('drops a reason again when its box is unticked', () => {
    const onChange = vi.fn();

    renderFeedback(<UserFeedback reasons={reasons} onChange={onChange} />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'It asks me to follow a link' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'It asks me to follow a link' }));

    expect(lastValue(onChange).reasons).toEqual([]);
  });

  it('hands back the note as it is typed', () => {
    const onChange = vi.fn();

    renderFeedback(<UserFeedback hasUserInput inputLabel="Note" onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'It asked for my password.' } });

    expect(lastValue(onChange).comment).toBe('It asked for my password.');
  });

  it('holds a mandatory list invalid until something is ticked', () => {
    const onChange = vi.fn();

    renderFeedback(<UserFeedback isMandatory reasons={reasons} onChange={onChange} />);

    expect(lastValue(onChange).isValid).toBe(false);

    fireEvent.click(screen.getByRole('checkbox', { name: 'It asks me to follow a link' }));

    expect(lastValue(onChange).isValid).toBe(true);
  });

  it('turns invalid again when the last box is unticked', () => {
    const onChange = vi.fn();

    renderFeedback(<UserFeedback isMandatory reasons={reasons} onChange={onChange} />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'It asks me to follow a link' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'It asks me to follow a link' }));

    expect(lastValue(onChange).isValid).toBe(false);
  });

  it('is valid with nothing ticked where the list is not mandatory', () => {
    const onChange = vi.fn();

    renderFeedback(<UserFeedback reasons={reasons} onChange={onChange} />);

    expect(lastValue(onChange).isValid).toBe(true);
  });

  it('does not hold a report up over a list of reasons that never arrived', () => {
    const onChange = vi.fn();

    renderFeedback(<UserFeedback isMandatory reasons={[]} hasUserInput onChange={onChange} />);

    expect(lastValue(onChange).isValid).toBe(true);
  });

  it('marks a mandatory list as required', () => {
    const { container } = renderFeedback(
      <UserFeedback isMandatory reasons={reasons} reasonsLabel="What is wrong with it?" />,
    );

    expect(container.querySelector('.mantine-CheckboxGroup-required')).toBeInTheDocument();
  });

  it('says nothing about an empty list nobody has been in yet', () => {
    renderFeedback(<UserFeedback isMandatory reasons={reasons} mandatoryError="Pick at least one reason." />);

    expect(screen.queryByText('Pick at least one reason.')).toBeNull();
  });

  it('says so once a mandatory list has been touched and left empty', () => {
    renderFeedback(<UserFeedback isMandatory reasons={reasons} mandatoryError="Pick at least one reason." />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'It asks me to follow a link' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'It asks me to follow a link' }));

    expect(screen.getByText('Pick at least one reason.')).toBeInTheDocument();
  });

  it('takes the message back down as soon as something is ticked', () => {
    renderFeedback(<UserFeedback isMandatory reasons={reasons} mandatoryError="Pick at least one reason." />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'It asks me to follow a link' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'It asks me to follow a link' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'The sender is not who they claim to be' }));

    expect(screen.queryByText('Pick at least one reason.')).toBeNull();
  });

  it('tells the parent only when the value has actually moved', () => {
    const onChange = vi.fn();
    const { rerender } = renderFeedback(<UserFeedback reasons={reasons} onChange={onChange} />);

    // A parent that rebuilds its props — an inline array, an inline handler — has
    // changed nothing about the answers, and is not told that it has.
    rerender(
      <MinervaThemeProvider>
        <UserFeedback reasons={[...reasons]} onChange={onChange} />
      </MinervaThemeProvider>,
    );

    expect(onChange).toHaveBeenCalledOnce();
  });

  it('passes the Mantine style props through to its root', () => {
    const { container } = renderFeedback(<UserFeedback reasons={reasons} className="feedback" mt="lg" />);

    const root = container.querySelector<HTMLElement>('.feedback');

    expect(root).toContainElement(screen.getByRole('checkbox', { name: 'It asks me to follow a link' }));
    expect(root).toHaveStyle({ marginTop: 'var(--mantine-spacing-lg)' });
  });
});
