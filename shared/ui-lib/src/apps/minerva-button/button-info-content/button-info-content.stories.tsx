import { Anchor, Text } from '@mantine/core';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ButtonInfoContent, type ButtonInfoSection } from './button-info-content.component';

const senderSection: ButtonInfoSection = {
  title: 'Sender',
  entries: [
    { label: 'Display name', value: 'IT Support' },
    { label: 'Address', value: 'it-support@example.net' },
    { label: 'First seen', value: 'Today, 09:14' },
  ],
};

const messageSection: ButtonInfoSection = {
  title: 'Message',
  entries: [
    { label: 'Subject', value: 'Your mailbox is full' },
    { label: 'Received', value: '28 July 2026, 09:14' },
  ],
};

/**
 * Blocks of label and value pairs, built from data: a heading, the pairs with each
 * dimmed label over its value, and a rule closing the block off from the one under
 * it. The gaps step up from the pair to the pairs to the blocks, so the grouping is
 * read off the spacing before anything is read off the type.
 */
const meta = {
  title: 'MinervaButton/ButtonInfoContent',
  component: ButtonInfoContent,
  tags: ['autodocs'],
  args: {
    sections: [senderSection, messageSection],
  },
} satisfies Meta<typeof ButtonInfoContent>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Two blocks, one under the other, with a rule between them and none at the foot. */
export const Default: Story = {};

/** On its own a block has nothing to be set off from, so it goes without a rule. */
export const SingleSection: Story = {
  args: { sections: [senderSection] },
};

/** A block of one pair — nothing about the layout changes. */
export const SingleEntry: Story = {
  args: {
    sections: [{ title: 'Verdict', entries: [{ label: 'Rating', value: 'Suspicious' }] }],
  },
};

/** Stacked blocks keep their rhythm however many there are. */
export const ManySections: Story = {
  args: {
    sections: [
      ...meta.args.sections,
      {
        title: 'Links',
        entries: [
          { label: 'Domains', value: 'example-support.net, cdn.example-support.net' },
          { label: 'Registered', value: 'Four days ago' },
        ],
      },
      {
        title: 'Attachments',
        entries: [{ label: 'Invoice.docm', value: 'Word document with macros' }],
      },
    ],
  },
};

/** Values take nodes, for the ones that need a link or a word picked out. */
export const WithNodeValues: Story = {
  args: {
    sections: [
      {
        title: 'Sender',
        entries: [
          {
            label: 'Address',
            value: <Anchor href="mailto:it-support@example.net">it-support@example.net</Anchor>,
          },
          {
            label: 'Domain age',
            value: (
              <Text size="sm" span fw={600}>
                4 days
              </Text>
            ),
          },
        ],
      },
    ],
  },
};

/** A pair with nothing to show reads `n/a`, rather than leaving its label bare. */
export const MissingValue: Story = {
  args: {
    sections: [
      {
        title: 'Sender',
        entries: [
          { label: 'Display name', value: 'IT Support' },
          { label: 'First seen', value: null },
        ],
      },
    ],
  },
};

/** A long value wraps under its label rather than pushing the block wider. */
export const LongValue: Story = {
  args: {
    sections: [
      {
        title: 'Why this was flagged',
        entries: [
          {
            label: 'Reason',
            value:
              'The sender address does not match the display name, two links in the body point at a domain registered in the last week, and the attachment is a document with macros.',
          },
        ],
      },
    ],
  },
};

/** As narrow as the taskpane ever gets, which is where the wrapping shows. */
export const NarrowPane: Story = {
  args: { w: 220 },
};

/** Nothing to show draws nothing — no stray rule left behind. */
export const NoSections: Story = {
  args: { sections: [] },
};
