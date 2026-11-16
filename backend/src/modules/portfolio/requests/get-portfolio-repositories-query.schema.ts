import { z } from 'zod';
import { PORTFOLIO_PROVIDERS } from '../constants/portfolio-provider.constants.js';

export const getPortfolioRepositoriesQuerySchema = z.object({
  provider: z.enum(PORTFOLIO_PROVIDERS).optional(),
  search: z.string().trim().optional(),
});

export type GetPortfolioRepositoriesQueryRequest = z.infer<
  typeof getPortfolioRepositoriesQuerySchema
>;

