export interface PortfolioOAuthCallbackPayload {
  code: string;
  state?: string;
  verifier?: string;
}
