import type { PortfolioProvider } from './portfolio-provider.type.js';

export interface UpsertSocialAccountInput {
  userId: string;
  provider: PortfolioProvider;
  externalId: string;
  username: string;
  profileUrl?: string | null;
}

