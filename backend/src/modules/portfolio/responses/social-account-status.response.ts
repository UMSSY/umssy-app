import type { PortfolioProvider } from '../types/portfolio-provider.type.js';

export interface SocialAccountStatusResponse {
  provider: PortfolioProvider;
  connected: boolean;
  username: string | null;
  profileUrl: string | null;
}

