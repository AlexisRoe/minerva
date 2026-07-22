import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { ButtonPage } from '../components/button-page/button-page';
import { LoadingReel } from '../components/loading-reel/loading-reel';

/**
 * Storybook-only wrapper that frames `ButtonPage` the way it actually appears
 * in production: a fixed-size widget (380x820) with a white background,
 * centered on a light grey page. `ButtonPage` itself renders `fixed inset-0`,
 * so `contain: layout` on the frame is required to make it the containing
 * block for `ButtonPage`'s fixed positioning instead of the browser viewport.
 */
function WidgetFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-200">
      <div className="relative h-[820px] w-[380px] overflow-hidden bg-white [contain:layout]">{children}</div>
    </div>
  );
}

const meta = {
  title: 'Reporting Button/Views/LoadingView',
  component: ButtonPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <WidgetFrame>
        <Story />
      </WidgetFrame>
    ),
  ],
} satisfies Meta<typeof ButtonPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** ButtonPage rendered fullscreen, with ButtonPage.Content centered around a LoadingReel — a typical loading screen. */
export const LoadingView: Story = {
  render: () => (
    <ButtonPage fullscreen>
      <ButtonPage.Header />
      <ButtonPage.Content>
        <LoadingReel />
      </ButtonPage.Content>
    </ButtonPage>
  ),
};
