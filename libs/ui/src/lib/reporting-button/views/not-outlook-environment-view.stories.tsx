import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { ButtonPage } from '../components/button-page/button-page';
import { NotOutlookEnvironment } from '../components/not-outlook-environment/not-outlook-environment';

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
  title: 'Reporting Button/Views/NotOutlookEnvironmentView',
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

/** ButtonPage rendered fullscreen, with ButtonPage.Content centered around a NotOutlookEnvironment message — shown when the add-in is opened outside of Outlook. */
export const NotOutlookEnvironmentView: Story = {
  render: () => (
    <ButtonPage fullscreen>
      <ButtonPage.Header />
      <ButtonPage.Content>
        <NotOutlookEnvironment
          title="Not running in Outlook"
          description="Open this add-in from within Outlook to submit a report."
        />
      </ButtonPage.Content>
    </ButtonPage>
  ),
};
