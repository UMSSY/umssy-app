import type { ApplicationConsentsResponse } from './application-consents-response.types.js';

export interface ApplicationResponse extends ApplicationConsentsResponse {
  jobOfferId: string;
}
