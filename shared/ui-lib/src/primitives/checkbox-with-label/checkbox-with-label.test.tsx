import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { MinervaThemeProvider } from '../../theme/minerva-provider.component';
import { CheckboxWithLabel } from './checkbox-with-label.component';

function renderCheckbox(ui: ReactElement) {
  return render(<MinervaThemeProvider>{ui}</MinervaThemeProvider>);
}

describe('CheckboxWithLabel', () => {
  it('says beside the box what ticking it does', () => {
    renderCheckbox(<CheckboxWithLabel label="Block this sender" />);

    expect(screen.getByRole('checkbox', { name: 'Block this sender' })).toBeInTheDocument();
  });

  it('takes an element as the label, for a line that is not all one weight', () => {
    renderCheckbox(
      <CheckboxWithLabel
        label={
          <span>
            Block <strong>news@example.com</strong>
          </span>
        }
      />,
    );

    expect(screen.getByRole('checkbox', { name: 'Block news@example.com' })).toBeInTheDocument();
  });

  it('shows the description under the label when there is one', () => {
    renderCheckbox(<CheckboxWithLabel label="Block this sender" description="Their mail goes straight to junk." />);

    expect(screen.getByText('Their mail goes straight to junk.')).toBeInTheDocument();
  });

  it('holds the box at its own size, so a wrapping label cannot squeeze it', () => {
    const { container } = renderCheckbox(<CheckboxWithLabel label="Block this sender" />);

    expect(container.querySelector('.mantine-Checkbox-inner')).toHaveStyle({ flexShrink: '0' });
  });

  it('ties the label to the box, so pressing the words ticks it', () => {
    const onChange = vi.fn();

    renderCheckbox(<CheckboxWithLabel label="Block this sender" onChange={onChange} />);
    fireEvent.click(screen.getByText('Block this sender'));

    expect(onChange).toHaveBeenCalledOnce();
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('follows the checked state it is given', () => {
    renderCheckbox(<CheckboxWithLabel label="Block this sender" checked readOnly />);

    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('reports the error it is given', () => {
    renderCheckbox(<CheckboxWithLabel label="Block this sender" error="Pick one of the two." />);

    expect(screen.getByText('Pick one of the two.')).toBeInTheDocument();
  });

  it('passes the rest of the Mantine props through', () => {
    const { container } = renderCheckbox(
      <CheckboxWithLabel label="Block this sender" labelPosition="left" className="opt-in" disabled />,
    );

    expect(container.querySelector('.mantine-Checkbox-root')).toHaveAttribute('data-label-position', 'left');
    expect(container.querySelector('.mantine-Checkbox-root')).toHaveClass('opt-in');
    expect(screen.getByRole('checkbox')).toBeDisabled();
  });
});
