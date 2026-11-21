import type { Prisma } from '../../../prisma/client.js';

export const PORTFOLIO_PROJECT_SELECT = {
  id: true,
  userId: true,
  repoName: true,
  repoUrl: true,
  description: true,
  language: true,
  starsCount: true,
  isOwner: true,
  displayOrder: true,
  provider: {
    select: {
      name: true,
    },
  },
} as const satisfies Prisma.UserPortfolioProjectSelect;
