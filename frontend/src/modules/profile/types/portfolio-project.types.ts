import type { PortfolioProviderName } from "./portfolio-provider-name.types";

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

export interface ExternalRepositoryItem {
  provider: PortfolioProviderName;
  repoName: string;
  repoUrl: string;
  description: string | null;
  language: string | null;
  starsCount: number;
  isOwner: boolean;
  updatedAt?: string;
}

export type PortfolioProviderFilter = "all" | PortfolioProviderName;

export interface PortfolioSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentProjects?: PortfolioProjectItem[];
}

