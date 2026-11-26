import type { PortfolioProvider } from '../types/portfolio-provider.type.js';

export interface PortfolioProjectResponse {
  id: string;
  provider: PortfolioProvider;
  repoName: string;
  repoUrl: string;
  description: string | null;
  language: string | null;
  starsCount: number;
  isOwner: boolean;
  displayOrder: number;
}
