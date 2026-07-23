import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from '../../../base/components/button/button';
import { SatelliteDrawer } from './satellite-drawer';

const meta = {
  title: 'Reporting Button/Components/SatelliteDrawer',
  component: SatelliteDrawer,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    triggerLabel: 'Open satellite panel',
    primaryButtonText: 'Close',
  },
} satisfies Meta<typeof SatelliteDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <>
        <p>Example body copy passed in as children.</p>
        <p>A second paragraph to demonstrate arbitrary content and scrolling behavior.</p>
      </>
    ),
  },
};

/** Open state controlled by the parent, driven through an external trigger. */
export const ControlledOpen: Story = {
  args: {
    children: <p>Opened via external control.</p>,
  },
  render: (args) => {
    function ControlledOpenExample() {
      const [open, setOpen] = useState(false);

      return (
        <div className="flex flex-col items-center gap-4">
          <Button onClick={() => setOpen(true)}>Open from outside</Button>
          <SatelliteDrawer {...args} open={open} onOpenChange={setOpen} />
        </div>
      );
    }

    return <ControlledOpenExample />;
  },
};
