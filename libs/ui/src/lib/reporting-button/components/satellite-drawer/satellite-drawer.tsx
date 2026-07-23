import { IconSatellite } from '@tabler/icons-react';
import type { ComponentProps, ReactElement, ReactNode } from 'react';
import { Button } from '../../../base/components/button/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerTrigger,
} from '../../../base/components/drawer/drawer';
import { cn } from '../../../utils/cn';

export interface SatelliteDrawerProps extends Omit<ComponentProps<typeof Drawer>, 'swipeDirection' | 'children'> {
  /** Accessible label for the default icon-only trigger, and for the drawer dialog itself. Required even when `trigger` overrides the default button. */
  triggerLabel: string;
  /** Optional custom trigger element, overriding the default satellite icon button. */
  trigger?: ReactElement;
  /** Label for the footer's primary button, which only closes the drawer. */
  primaryButtonText: string;
  /** Arbitrary body content, supplied by the caller. */
  children: ReactNode;
  className?: string;
}

/** Full-height right-side drawer with a satellite icon trigger and a single primary button that closes it. */
export function SatelliteDrawer({
  triggerLabel,
  trigger,
  primaryButtonText,
  children,
  className,
  ...props
}: SatelliteDrawerProps) {
  const defaultTrigger = (
    <Button variant="ghost" size="icon" aria-label={triggerLabel} className="h-8 w-8">
      <IconSatellite className="size-6" />
    </Button>
  );

  return (
    <Drawer swipeDirection="right" {...props}>
      <DrawerTrigger render={trigger ?? defaultTrigger} />
      <DrawerContent data-slot="satellite-drawer" aria-label={triggerLabel} className={cn('gap-4', className)}>
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">{children}</div>
        <DrawerFooter>
          <DrawerClose render={<Button className="w-full">{primaryButtonText}</Button>} />
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
