export interface UserProfile {
  /** User name */
  name: string;
  /** user email address */
  email: string;
}

export interface AuthorizationResult {
  /** Authorization is successful */
  isAuthorized: boolean;
  /** User profile */
  userProfile: UserProfile;
  /** Unique session uuid v4 */
  sessionId: string;
}
