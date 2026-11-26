import { z } from 'zod';
import { MAX_PORTFOLIO_PROJECTS } from '../constants/portfolio.constants.js';
import { PORTFOLIO_PROVIDERS } from '../constants/portfolio-provider.constants.js';

export const portfolioProjectItemSchema = z.object({
  provider: z.enum(PORTFOLIO_PROVIDERS),
  repoName: z.string().trim().min(1).max(150),
  repoUrl: z
    .string()
    .trim()
    .max(500)
    .url()
    .refine(
      (value) => value.startsWith('http://') || value.startsWith('https://'),
      { message: 'repoUrl must use http or https protocol' },
    ),
  description: z.string().trim().nullable().optional(),
  language: z.string().trim().max(60).nullable().optional(),
  starsCount: z.number().int().min(0),
  isOwner: z.boolean(),
});

export const updatePortfolioProjectsSchema = z.object({
  projects: z.array(portfolioProjectItemSchema).min(0).max(MAX_PORTFOLIO_PROJECTS),
});

export type PortfolioProjectItemRequest = z.infer<
  typeof portfolioProjectItemSchema
>;

export type UpdatePortfolioProjectsRequest = z.infer<
  typeof updatePortfolioProjectsSchema
>;
