import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { LoadingReel } from '../loading-reel/loading-reel';
import { Page } from './page';

/**
 * Storybook-only wrapper that frames `Page` the way it actually appears in
 * production: a fixed-size widget (380x640) with a white background,
 * centered on a light grey page. `Page` itself renders `fixed inset-0`, so
 * `contain: layout` on the frame is required to make it the containing
 * block for `Page`'s fixed positioning instead of the browser viewport.
 */
function WidgetFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-200">
      <div className="relative h-[640px] w-[380px] overflow-hidden bg-white [contain:layout]">{children}</div>
    </div>
  );
}

const meta = {
  title: 'Reporting Button/Components/Page',
  component: Page,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    fullscreen: { control: 'boolean' },
  },
  decorators: [
    (Story) => (
      <WidgetFrame>
        <Story />
      </WidgetFrame>
    ),
  ],
} satisfies Meta<typeof Page>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * `Page` is a composite component: compose it from `Page.Header` (optional,
 * sticky, left / middle / right slots) and `Page.Content` (fills the
 * remaining space, optionally `centered` on both axes). Toggle `fullscreen`
 * on the root `Page` to see `Page.Header` disappear entirely.
 */
export const Explained: Story = {
  args: {
    fullscreen: false,
  },
  render: (args) => (
    <Page {...args}>
      <Page.Header
        left={<strong>Logo</strong>}
        middle={<span>Page title</span>}
        right={<button type="button">Action</button>}
      />
      <Page.Content>
        <div>
          <p>This is Page.Content. It fills the remaining space below Page.Header.</p>
          <p>Toggle `fullscreen` on Page to hide Page.Header entirely.</p>
        </div>
      </Page.Content>
    </Page>
  ),
};

/** Page rendered fullscreen, with Page.Content centered around a LoadingReel — a typical loading screen. */
export const LoadingView: Story = {
  render: () => (
    <Page fullscreen>
      <Page.Content centered>
        <LoadingReel />
      </Page.Content>
    </Page>
  ),
};
