interface FeatureGuardProps {
  children: React.ReactElement;
  feature: boolean;
}

export function FeatureGuard(props: FeatureGuardProps): React.JSX.Element | null {
  return props.feature === false ? null : props.children;
}
