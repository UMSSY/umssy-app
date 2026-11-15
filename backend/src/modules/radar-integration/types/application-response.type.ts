import type { ApplicationConsentsResponse } from './application-consents-response.type.js';

export interface ApplicationResponse extends ApplicationConsentsResponse {
  jobOfferId: string;
}
