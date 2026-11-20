import type { CreateJobOfferPayload } from "./create-job-offer-payload.types";

export interface PublishVariables {
  companyId: string;
  payload: CreateJobOfferPayload;
}
