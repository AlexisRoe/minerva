import type { Preview } from '@storybook/react-vite';
import { MinervaThemeProvider } from '../src/minerva-provider/minerva-provider.component';

// The @font-face rules the apps use, so stories render in the same typefaces.
// The files they point at are mounted under /assets/fonts by `staticDirs`.
// biome-ignore lint/suspicious/noTsIgnore: a storybook quirk ;-)
// @ts-ignore
import '../../assets/fonts.css';

const preview: Preview = {
  // Every story renders inside the same provider the apps use, so what you see
  // in Storybook is what the apps render: the custom theme and the Mantine
  // overrides in style.css both come along with the provider.
  decorators: [
    (Story) => (
      <MinervaThemeProvider>
        <Story />
      </MinervaThemeProvider>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      // 'error' fails CI on violations; 'todo' only surfaces them in the UI.
      test: 'todo',
    },
  },
};

export default preview;
