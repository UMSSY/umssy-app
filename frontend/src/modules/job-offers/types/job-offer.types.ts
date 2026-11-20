import type { JobOfferDetailsResponse } from "./job-offer-details-response.types";

export interface JobOffer extends JobOfferDetailsResponse {
  applicantsCount: number;
}
