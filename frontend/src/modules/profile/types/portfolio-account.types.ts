export type PortfolioProviderName = "github" | "gitlab";

export interface PortfolioAccountStatusResponse {
  provider: PortfolioProviderName;
  connected: boolean;
  username: string | null;
  profileUrl: string | null;
}

export interface PortfolioOAuthUrlResponse {
  url: string;
}

export interface PortfolioOAuthCallbackPayload {
  code: string;
}

export interface PortfolioConnectedAccountResponse {
  id: string;
  provider: PortfolioProviderName;
  username: string;
  profileUrl: string | null;
  connected: boolean;
}

export interface SocialAccountConnectButtonsProps {
  className?: string;
}

