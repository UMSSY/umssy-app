export const PORTFOLIO_PROVIDERS = ['github', 'gitlab'] as const;

export const MAX_PORTFOLIO_PROJECTS = 6;

export type PortfolioProvider = (typeof PORTFOLIO_PROVIDERS)[number];

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

export interface PortfolioProjectDto {
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

export interface PortfolioProjectInput {
  provider: PortfolioProvider;
  repoName: string;
  repoUrl: string;
  description?: string | null;
  language?: string | null;
  starsCount: number;
  isOwner: boolean;
}

export interface NormalizedPortfolioProject {
  provider: PortfolioProvider;
  repoName: string;
  repoUrl: string;
  description: string | null;
  language: string | null;
  starsCount: number;
  isOwner: boolean;
  displayOrder: number;
}
