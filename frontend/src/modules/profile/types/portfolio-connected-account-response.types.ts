import type { PortfolioProviderName } from "./portfolio-provider-name.types";

export interface PortfolioConnectedAccountResponse {
  id: string;
  provider: PortfolioProviderName;
  username: string;
  profileUrl: string | null;
  connected: boolean;
}
