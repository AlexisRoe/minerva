import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  // TLS is not configured here: Storybook runs Vite in middleware mode behind
  // its own Node server, so `server.https` from a Vite config never reaches the
  // listening socket. The certificates are passed as CLI flags instead, by
  // scripts/storybook-dev.sh (the `storybook` script in package.json).
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: '@storybook/react-vite',
  // The library ships no fonts. The files live once in shared/assets/fonts and
  // every project copies them into its own output under /assets/fonts -- the
  // apps through `sharedFonts()` in vite.fonts.ts, Storybook through this
  // entry -- so the @font-face rules in shared/assets/fonts.css resolve the
  // same way everywhere.
  staticDirs: [
    {
      from: '../../assets/fonts',
      to: '/assets/fonts',
    },
  ],
};

export default config;
