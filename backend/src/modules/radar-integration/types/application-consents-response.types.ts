import type { RadarApplicationState } from './radar-application-state.types.js';

export interface ApplicationConsentsResponse {
  id: string;
  state: RadarApplicationState;
  consent: boolean;
  consentCv: boolean;
  consentContact: boolean;
}
