import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FeatureGuard } from './feature-guard.component';

describe('FeatureGuard', () => {
  it('draws its child where the feature is on', () => {
    render(
      <FeatureGuard feature>
        <p>spam button</p>
      </FeatureGuard>,
    );

    expect(screen.getByText('spam button')).toBeInTheDocument();
  });

  it('draws nothing where the feature is off', () => {
    render(
      <FeatureGuard feature={false}>
        <p>spam button</p>
      </FeatureGuard>,
    );

    expect(screen.queryByText('spam button')).not.toBeInTheDocument();
  });

  it('adds no element of its own', () => {
    const { container } = render(
      <FeatureGuard feature>
        <p>spam button</p>
      </FeatureGuard>,
    );

    // Several of the things it guards sit inside components that inspect their
    // own children, so a wrapper here would change a layout it is meant to be
    // invisible to.
    expect(container.innerHTML).toBe('<p>spam button</p>');
  });

  it('leaves nothing behind when the feature is off', () => {
    const { container } = render(
      <FeatureGuard feature={false}>
        <p>spam button</p>
      </FeatureGuard>,
    );

    expect(container.innerHTML).toBe('');
  });

  it('keeps the child mounted as itself, not remounted through a wrapper', () => {
    const { container, rerender } = render(
      <FeatureGuard feature>
        <input defaultValue="" />
      </FeatureGuard>,
    );

    const input = container.querySelector('input') as HTMLInputElement;
    input.value = 'typed';

    rerender(
      <FeatureGuard feature>
        <input defaultValue="" />
      </FeatureGuard>,
    );

    // A guard that wrapped conditionally would tear the subtree down and back up,
    // losing what the user had typed into the report drawer.
    expect(container.querySelector('input')?.value).toBe('typed');
  });

  it('fails open rather than hiding a feature on a malformed flag', () => {
    // `feature` is typed boolean, so anything else is a bug at the call site.
    // Showing the control makes that visible; hiding it would look like a tenant
    // setting and be chased in the wrong place.
    render(
      <FeatureGuard feature={undefined as unknown as boolean}>
        <p>spam button</p>
      </FeatureGuard>,
    );

    expect(screen.getByText('spam button')).toBeInTheDocument();
  });
});
