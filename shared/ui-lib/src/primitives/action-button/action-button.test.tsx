import { IconRefresh } from '@tabler/icons-react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MinervaThemeProvider } from '../../theme/minerva-provider.component';
import { ActionButton } from './action-button.example';

describe('ActionButton', () => {
  it('renders its label inside the Mantine theme', () => {
    render(
      <MinervaThemeProvider>
        <ActionButton label="Process inbox" />
      </MinervaThemeProvider>,
    );

    expect(screen.getByRole('button', { name: /process inbox/i })).toBeInTheDocument();
  });

  it('renders the icon it is given', () => {
    const { container } = render(
      <MinervaThemeProvider>
        <ActionButton label="Refresh" icon={IconRefresh} />
      </MinervaThemeProvider>,
    );

    expect(container.querySelector('svg.tabler-icon-refresh')).not.toBeNull();
  });

  it('keeps the theme hover swap to the outline buttons it was written for', () => {
    render(
      <MinervaThemeProvider>
        <ActionButton label="Process inbox" />
      </MinervaThemeProvider>,
    );

    // A filled button is already ink on fill; there is nothing to turn over, so it
    // keeps Mantine's own hover rather than the outline swap.
    expect(screen.getByRole('button').style.getPropertyValue('--button-hover')).not.toBe('var(--button-color)');
  });
});
