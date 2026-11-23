import type { PortfolioProviderName } from "./portfolio-provider-name.types";

export interface PortfolioAccountDisconnectResponse {
  provider: PortfolioProviderName;
  connected: false;
}
