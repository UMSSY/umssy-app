import type { PortfolioProvider } from '../types/portfolio-provider.type.js';

export interface SocialAccountDisconnectResponse {
  provider: PortfolioProvider;
  connected: false;
}
