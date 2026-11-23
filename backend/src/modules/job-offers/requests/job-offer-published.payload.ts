import { z } from 'zod';

export const JobOfferPublishedPayloadSchema = z.object({
  jobTitle: z.string().min(1),
  companyName: z.string().min(1),
});

export type JobOfferPublishedPayload = z.infer<
  typeof JobOfferPublishedPayloadSchema
>;

export function buildJobOfferActionUrl(jobOfferId: string): string {
  return `/vacancies/${jobOfferId}`;
}