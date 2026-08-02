import { Button, type ButtonProps } from '@mantine/core';
import { type Icon, IconBolt } from '@tabler/icons-react';
import type { MouseEventHandler } from 'react';

export interface ActionButtonProps extends Omit<ButtonProps, 'leftSection' | 'children'> {
  label: string;
  /** Any Tabler icon component; defaults to `IconBolt`. */
  icon?: Icon;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}

/** A Mantine button with a leading Tabler icon — the house style for primary actions. */
export function ActionButton({ label, icon: IconComponent = IconBolt, ...props }: ActionButtonProps) {
  return (
    <Button leftSection={<IconComponent size={18} stroke={1.5} />} {...props}>
      {label}
    </Button>
  );
}
