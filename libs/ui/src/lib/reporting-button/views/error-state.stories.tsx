import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { ButtonPage } from '../components/button-page/button-page';
import { ErrorView } from '../components/error-view/error-view';

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
  title: 'Reporting Button/Views/ErrorState',
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

/** ButtonPage rendered fullscreen, with ButtonPage.Content centered around an ErrorView — shown when an unrecoverable error occurs. */
export const ErrorState: Story = {
  render: () => (
    <ButtonPage fullscreen>
      <ButtonPage.Header />
      <ButtonPage.Content>
        <ErrorView
          title="Something went wrong"
          description="We couldn't submit your report. Please try again."
          id="a1b2c3d4-e5f6-7890-abcd-ef1234567890"
          errorCode="ERR_500"
          buttonText="Try again"
          onButtonClick={() => console.log('Try again clicked')}
        />
      </ButtonPage.Content>
    </ButtonPage>
  ),
};
