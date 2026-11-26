import type { PortfolioProvider } from './portfolio-provider.type.js';

export interface PortfolioProjectEntity {
  id: string;
  userId: string;
  provider: PortfolioProvider;
  repoName: string;
  repoUrl: string;
  description: string | null;
  language: string | null;
  starsCount: number;
  isOwner: boolean;
  displayOrder: number;
}
