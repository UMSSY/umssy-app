import type { CreateJobOfferData } from './create-job-offer-data.type.js';

type OptionalRequirementFields = 'requiredCareers' | 'minExperienceYears' | 'otherRequirements';

export type UpdateJobOfferData = Omit<
  CreateJobOfferData,
  'companyId' | 'statusId' | OptionalRequirementFields
> &
  Partial<Pick<CreateJobOfferData, OptionalRequirementFields>>;
