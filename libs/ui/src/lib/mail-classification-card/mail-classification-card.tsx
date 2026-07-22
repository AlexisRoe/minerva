import { IconMailExclamation, IconMailFast } from '@tabler/icons-react';
import type { ComponentProps, ReactNode } from 'react';
import { Card, CardDescription, CardTitle } from '../card/card';
import { cn } from '../utils/cn';

export const variantIcons = {
  suspicious: IconMailExclamation,
  spam: IconMailFast,
} as const;

export interface MailClassificationCardProps extends ComponentProps<typeof Card> {
  /** Which classification icon to show. */
  variant: keyof typeof variantIcons;
  /** Heading text, e.g. "Suspicious". */
  title: string;
  /** Supporting copy shown below the title. */
  description: string;
  /** Optional element rendered on the right edge of the card, e.g. an icon button. */
  action?: ReactNode;
}

/** Card presenting a single mail-classification option ("Suspicious" or "Spam") with a large icon, title, description, and an optional right-side action slot. */
export function MailClassificationCard({
  variant,
  title,
  description,
  action,
  className,
  ...props
}: MailClassificationCardProps) {
  const Icon = variantIcons[variant];

  return (
    <Card data-slot="mail-classification-card" className={cn('flex-row items-center gap-4 p-4', className)} {...props}>
      <Icon className="size-24 shrink-0" stroke={1.5} />
      <div className="flex flex-1 flex-col gap-1">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </div>
      {action}
    </Card>
  );
}
