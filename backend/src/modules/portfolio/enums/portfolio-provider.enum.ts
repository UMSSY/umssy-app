export enum PortfolioProviderEnum {
  GITHUB = 'github',
  GITLAB = 'gitlab',
}

export const PORTFOLIO_PROVIDERS = [
  PortfolioProviderEnum.GITHUB,
  PortfolioProviderEnum.GITLAB,
] as const;

export type PortfolioProvider = (typeof PORTFOLIO_PROVIDERS)[number];

export function isPortfolioProvider(value: string): value is PortfolioProvider {
  return (PORTFOLIO_PROVIDERS as readonly string[]).includes(value);
}

export function parsePortfolioProvider(value: string): PortfolioProvider {
  if (isPortfolioProvider(value)) {
    return value;
  }
  throw new Error(`Unsupported portfolio provider: ${value}`);
}
