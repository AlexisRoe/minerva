import { Divider, type MantineTheme } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { shadcnCssVariableResolver } from './css-variable-resolver.override';
import { MinervaThemeProvider } from './minerva-provider.component';

describe('theme: bands', () => {
  it('gives every band the same surface and border tokens', () => {
    // Both are named once, off any one component, which is what lets the drawer's
    // header and the report page's bands be drawn from the same two values. The
    // resolver reads nothing off the theme for them, so none is handed to it.
    const { variables } = shadcnCssVariableResolver({} as MantineTheme);

    expect(variables['--minerva-band-bg']).toBe('var(--mantine-color-default)');
    expect(variables['--minerva-band-border']).toBe('1px solid var(--mantine-color-default-border)');
  });
});

describe('theme: Divider', () => {
  it('draws the rule in the same border token the drawer header is set off by', () => {
    render(
      <MinervaThemeProvider>
        <Divider />
      </MinervaThemeProvider>,
    );

    // Mantine draws the rule through this variable, and the drawer band names the
    // same token, so the two hairlines are certain to match.
    expect(screen.getByRole('separator').style.getPropertyValue('--divider-color')).toBe(
      'var(--mantine-color-default-border)',
    );
  });

  it('still lets a caller name a colour of their own', () => {
    render(
      <MinervaThemeProvider>
        <Divider color="red" />
      </MinervaThemeProvider>,
    );

    expect(screen.getByRole('separator').style.getPropertyValue('--divider-color')).toBe(
      'var(--mantine-color-red-filled)',
    );
  });
});
