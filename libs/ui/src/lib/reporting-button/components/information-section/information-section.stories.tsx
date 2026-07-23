import type { Meta, StoryObj } from '@storybook/react-vite';
import { InformationItem } from '../information-item/information-item';
import { InformationSection } from './information-section';

const meta = {
  title: 'Reporting Button/Components/InformationSection',
  component: InformationSection,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof InformationSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'User',
    children: (
      <>
        <InformationItem label="Name" value="Jamie Keller" />
        <InformationItem label="Email" value="jamie.keller@contoso.com" />
        <InformationItem label="Internal ID" value="3f9a1c2e-7b4d-4e8a-9c1f-0a2b6d5e8c31" />
      </>
    ),
  },
  render: (args) => <InformationSection {...args} className="w-96" />,
};
