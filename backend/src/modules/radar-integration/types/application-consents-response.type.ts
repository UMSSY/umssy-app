import type { RadarApplicationState } from './radar-application-state.type.js';

export interface ApplicationConsentsResponse {
  id: string;
  state: RadarApplicationState;
  consent: boolean;
  consentCv: boolean;
  consentContact: boolean;
}
