import type { Languages } from '../languages/available-languages';

/** That might be better as path or query parameter in a GET endpoint */
export interface MinervaSettingsRequest {
  /** What is the user language for reporting reasons? */
  userLanguage: Languages;
}
