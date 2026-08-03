import { MantineProvider } from '@mantine/core';
import type { ReactElement } from 'react';
import { shadcnCssVariableResolver } from './css-variable-resolver.override';
import { shadcnTheme } from './custom-shadcn.theme';

import '@mantine/core/styles.css';
import '../style.css';

/**
 * @description Custom Mantine theme provider with a shadcn styling.
 * This theme is inspired by shadcn (Base, Luma). The original theme you find here comes from MantineHub and than is even further modified.
 *
 * @see https://ui.shadcn.com/
 * @see https://ui.shadcn.com/create?preset=bK0OOeDdQ
 * @see https://mantinehub.com/
 *
 * @example
 * ´´´tsx
 * ...
 *  <MinervaThemeProvider>
 *      <App />
 *  </MinerveraThemProvider>
 * ...
 * ´´´
 */
export function MinervaThemeProvider(props: { children: ReactElement }): ReactElement {
  return (
    <MantineProvider theme={shadcnTheme} cssVariablesResolver={shadcnCssVariableResolver}>
      {props.children}
    </MantineProvider>
  );
}
