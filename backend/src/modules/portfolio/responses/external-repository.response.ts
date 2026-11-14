import type { PortfolioProvider } from '../types/portfolio-provider.type.js';

export interface ExternalRepositoryResponse {
  provider: PortfolioProvider;
  repoName: string;
  repoUrl: string;
  description: string | null;
  language: string | null;
  starsCount: number;
  isOwner: boolean;
  updatedAt: string;
}

