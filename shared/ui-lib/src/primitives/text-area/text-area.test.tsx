import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { MinervaThemeProvider } from '../../theme/minerva-provider.component';
import { TextArea } from './text-area.component';

function renderField(ui: ReactElement) {
  return render(<MinervaThemeProvider>{ui}</MinervaThemeProvider>);
}

describe('TextArea', () => {
  it('opens at its floor of three rows', () => {
    renderField(<TextArea label="Note" />);

    // The growing itself is measured off laid-out text, which jsdom does not do —
    // the floor is what reaches the DOM, and the stories cover the rest.
    expect(screen.getByRole('textbox')).toHaveAttribute('rows', '3');
  });

  it('opens at the floor a caller moves it to', () => {
    renderField(<TextArea label="Note" minRows={6} />);

    expect(screen.getByRole('textbox')).toHaveAttribute('rows', '6');
  });

  it('ties the label to the field', () => {
    renderField(<TextArea label="Why are you reporting this mail?" />);

    expect(screen.getByRole('textbox', { name: 'Why are you reporting this mail?' })).toBeInTheDocument();
  });

  it('shows the placeholder it is given', () => {
    renderField(<TextArea label="Note" placeholder="Anything that would help someone reading this later" />);

    expect(screen.getByPlaceholderText('Anything that would help someone reading this later')).toBeInTheDocument();
  });

  it('shows the description under the label', () => {
    renderField(<TextArea label="Note" description="Goes to the security team with the report." />);

    expect(screen.getByText('Goes to the security team with the report.')).toBeInTheDocument();
  });

  it('reports the error it is given', () => {
    renderField(<TextArea label="Note" error="Say a little more than that." />);

    expect(screen.getByText('Say a little more than that.')).toBeInTheDocument();
  });

  it('hands what is typed back to the caller', () => {
    const onChange = vi.fn();

    renderField(<TextArea label="Note" onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'It asked for my password.' } });

    expect(onChange).toHaveBeenCalledOnce();
  });

  it('shows the value it is given', () => {
    renderField(<TextArea label="Note" value="It asked for my password." readOnly />);

    expect(screen.getByRole('textbox')).toHaveValue('It asked for my password.');
  });

  it('passes the rest of the Mantine props through', () => {
    const { container } = renderField(<TextArea label="Note" className="note" maxLength={280} required disabled />);

    expect(container.querySelector('.mantine-Textarea-root')).toHaveClass('note');
    expect(screen.getByRole('textbox')).toHaveAttribute('maxlength', '280');
    expect(screen.getByRole('textbox')).toBeDisabled();
  });
});
