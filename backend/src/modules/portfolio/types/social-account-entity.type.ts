import type { PortfolioProvider } from './portfolio-provider.type.js';

export interface SocialAccountEntity {
  id: string;
  userId: string;
  provider: PortfolioProvider;
  externalId: string;
  username: string;
  profileUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

