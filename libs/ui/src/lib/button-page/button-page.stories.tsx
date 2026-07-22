import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { LoadingReel } from '../loading-reel/loading-reel';
import { NotOutlookEnvironment } from '../not-outlook-environment/not-outlook-environment';
import { ButtonPage } from './button-page';

/**
 * Storybook-only wrapper that frames `ButtonPage` the way it actually appears
 * in production: a fixed-size widget (380x640) with a white background,
 * centered on a light grey page. `ButtonPage` itself renders `fixed inset-0`,
 * so `contain: layout` on the frame is required to make it the containing
 * block for `ButtonPage`'s fixed positioning instead of the browser viewport.
 */
function WidgetFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-200">
      <div className="relative h-[640px] w-[380px] overflow-hidden bg-white [contain:layout]">{children}</div>
    </div>
  );
}

const meta = {
  title: 'Reporting Button/Components/ButtonPage',
  component: ButtonPage,
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
} satisfies Meta<typeof ButtonPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * `ButtonPage` is a composite component: compose it from `ButtonPage.Header`
 * (always visible, sticky, with a built-in logo + title plus a right slot)
 * and `ButtonPage.Content` (fills the remaining space with a grey background,
 * behind a white, rounded-corner content card, optionally `centered` on both
 * axes). Toggle `fullscreen` on the root `ButtonPage` to see
 * `ButtonPage.Content` always center itself and shift 45px towards the top.
 */
export const Explained: Story = {
  args: {
    fullscreen: false,
  },
  render: (args) => (
    <ButtonPage {...args}>
      <ButtonPage.Header right={<button type="button">Action</button>} />
      <ButtonPage.Content>
        <div>
          <p>This is ButtonPage.Content. It fills the remaining space below ButtonPage.Header.</p>
          <p>Toggle `fullscreen` on ButtonPage to see it center and shift up by 45px.</p>
        </div>
      </ButtonPage.Content>
    </ButtonPage>
  ),
};

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

/** A custom app title, overriding the default "Minerva" shown next to the logo. */
export const CustomTitle: Story = {
  render: () => (
    <ButtonPage>
      <ButtonPage.Header title="Custom App" />
      <ButtonPage.Content>
        <p>The header title is passed via the `title` prop on ButtonPage.Header.</p>
      </ButtonPage.Content>
    </ButtonPage>
  ),
};
