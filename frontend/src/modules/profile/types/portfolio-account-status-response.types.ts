import type { PortfolioProviderName } from "./portfolio-provider-name.types";

export interface PortfolioAccountStatusResponse {
  provider: PortfolioProviderName;
  connected: boolean;
  username: string | null;
  profileUrl: string | null;
}
