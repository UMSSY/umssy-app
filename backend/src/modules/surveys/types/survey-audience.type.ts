import type { UserContact } from '../../users/types/user-contact.types.js';

export interface SurveyAudience {
  eligible: UserContact[];
  pending: UserContact[];
}
