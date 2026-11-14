import type { PortfolioProvider } from '../types/portfolio-provider.type.js';

export interface SocialAccountResponse {
  id: string;
  provider: PortfolioProvider;
  username: string;
  profileUrl: string | null;
  connected: boolean;
}

