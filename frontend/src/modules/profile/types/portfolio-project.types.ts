import type { PortfolioProviderName } from "./portfolio-account.types";

export interface PortfolioProjectItem {
  id: string;
  provider: PortfolioProviderName;
  repoName: string;
  repoUrl: string;
  description: string | null;
  language: string | null;
  starsCount: number;
  isOwner: boolean;
  displayOrder: number;
  updatedAt?: string;
}

export interface UpdatePortfolioProjectItemPayload {
  provider: PortfolioProviderName;
  repoName: string;
  repoUrl: string;
  description?: string | null;
  language?: string | null;
  starsCount: number;
  isOwner: boolean;
}

export interface UpdatePortfolioProjectsPayload {
  projects: UpdatePortfolioProjectItemPayload[];
}

export interface PortfolioProjectCardProps {
  project: PortfolioProjectItem;
  className?: string;
}

export interface PortfolioProfileSectionProps {
  className?: string;
  onAddProjectClick?: () => void;
}

