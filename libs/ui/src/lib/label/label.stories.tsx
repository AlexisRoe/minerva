import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox } from '../checkbox/checkbox';
import { Label } from './label';

const meta = {
  title: 'General/Components/Label',
  component: Label,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Pairing a `Label` with a `Checkbox` via `htmlFor`/`id` lets clicking the label text toggle the control. */
export const Default: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="marketing-emails" />
      <Label htmlFor="marketing-emails">Send me marketing emails</Label>
    </div>
  ),
};
