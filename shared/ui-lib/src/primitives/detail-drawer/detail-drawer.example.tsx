import { Drawer, type DrawerProps, Group } from '@mantine/core';
import { type Icon, IconLayoutSidebar } from '@tabler/icons-react';

export interface DetailDrawerProps extends Omit<DrawerProps, 'title' | 'styles' | 'portalProps' | 'lockScroll'> {
  label: string;
  /** Any Tabler icon component; defaults to `IconLayoutSidebar`. */
  icon?: Icon;
  /**
   * Element the drawer is rendered into instead of `document.body`. It then
   * covers that element rather than the page, so it needs to be a positioned
   * ancestor — give it `position: relative` and a height.
   */
  container?: HTMLElement | null;
}

/** A Mantine drawer with an icon in its header — the house style for detail panels. */
export function DetailDrawer({
  label,
  icon: IconComponent = IconLayoutSidebar,
  container,
  children,
  ...props
}: DetailDrawerProps) {
  return (
    <Drawer
      title={
        <Group gap="xs">
          <IconComponent size={18} stroke={1.5} />
          {label}
        </Group>
      }
      portalProps={container ? { target: container } : undefined}
      styles={container ? { inner: { position: 'absolute' }, overlay: { position: 'absolute' } } : undefined}
      lockScroll={!container}
      {...props}
    >
      {children}
    </Drawer>
  );
}
