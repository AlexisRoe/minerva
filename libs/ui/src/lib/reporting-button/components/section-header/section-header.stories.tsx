import type { Meta, StoryObj } from '@storybook/react-vite';
import { SectionHeader } from './section-header';

const meta = {
  title: 'Reporting Button/Components/SectionHeader',
  component: SectionHeader,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    rtl: { control: 'boolean' },
  },
} satisfies Meta<typeof SectionHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Report this email',
    description:
      "Help keep your organization safe. Choose the option that best matches this message — we'll take it from there.",
  },
  render: (args) => <SectionHeader {...args} className="w-96" />,
};

/** Title and description rendered right-to-left, for RTL locales such as Arabic or Hebrew. */
export const Rtl: Story = {
  args: {
    title: 'الإبلاغ عن هذا البريد الإلكتروني',
    description: 'ساعد في الحفاظ على أمان مؤسستك. اختر الخيار الذي يطابق هذه الرسالة بشكل أفضل.',
    rtl: true,
  },
  render: (args) => <SectionHeader {...args} className="w-96" />,
};
