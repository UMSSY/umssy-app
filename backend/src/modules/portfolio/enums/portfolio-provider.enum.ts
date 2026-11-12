export enum PortfolioProviderEnum {
  GITHUB = 'github',
  GITLAB = 'gitlab',
}

export const PORTFOLIO_PROVIDERS = [
  PortfolioProviderEnum.GITHUB,
  PortfolioProviderEnum.GITLAB,
] as const;

export type PortfolioProvider = (typeof PORTFOLIO_PROVIDERS)[number];
