import type { Prisma } from '../../../prisma/client.js';
import type { PORTFOLIO_PROJECT_SELECT } from '../constants/portfolio-project-select.constants.js';

export type PortfolioProjectRecord = Prisma.UserPortfolioProjectGetPayload<{
  select: typeof PORTFOLIO_PROJECT_SELECT;
}>;
