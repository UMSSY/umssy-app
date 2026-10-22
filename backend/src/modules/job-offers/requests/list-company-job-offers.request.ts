import { z } from 'zod';
import {
  JOB_OFFER_SORT_FIELDS,
  JOB_OFFER_SORT_ORDERS,
  JOB_OFFER_TITLE_MAX_LENGTH,
  JOB_OFFER_VALIDATION_MESSAGES as MESSAGES,
} from '../constants/job-offer.constants.js';
import { JobOfferContractType, JobOfferModality } from '../types/job-offer.enum.js';

const emptyToUndefined = (value: unknown): unknown =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

const dateSchema = z.preprocess(emptyToUndefined, z.iso.date(MESSAGES.INVALID_DATE).optional());

export const listCompanyJobOffersSchema = z
  .object({
    modality: z.preprocess(
      emptyToUndefined,
      z.enum(JobOfferModality, { message: MESSAGES.INVALID_MODALITY }).optional(),
    ),
    contractType: z.preprocess(
      emptyToUndefined,
      z.enum(JobOfferContractType, { message: MESSAGES.INVALID_CONTRACT_TYPE }).optional(),
    ),
    dateFrom: dateSchema,
    dateTo: dateSchema,
    search: z.preprocess(
      emptyToUndefined,
      z.string().trim().max(JOB_OFFER_TITLE_MAX_LENGTH, MESSAGES.SEARCH_TOO_LONG).optional(),
    ),
    sortBy: z.preprocess(
      emptyToUndefined,
      z.enum(JOB_OFFER_SORT_FIELDS, { message: MESSAGES.INVALID_SORT_BY }).default('createdAt'),
    ),
    order: z.preprocess(
      emptyToUndefined,
      z.enum(JOB_OFFER_SORT_ORDERS, { message: MESSAGES.INVALID_SORT_ORDER }).default('desc'),
    ),
  })
  .refine(
    (data) => !data.dateFrom || !data.dateTo || data.dateFrom <= data.dateTo,
    { path: ['dateFrom'], message: MESSAGES.DATE_RANGE_INVALID },
  );

export type ListCompanyJobOffersRequest = z.infer<typeof listCompanyJobOffersSchema>;

export const DEFAULT_COMPANY_JOB_OFFERS_FILTERS: ListCompanyJobOffersRequest = {
  sortBy: 'createdAt',
  order: 'desc',
};