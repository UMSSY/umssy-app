import { PORTFOLIO_PROVIDERS } from '../constants/portfolio-provider.constants.js';
import type { PortfolioProvider } from '../types/portfolio-provider.type.js';

export function isPortfolioProvider(value: string): value is PortfolioProvider {
  return (PORTFOLIO_PROVIDERS as readonly string[]).includes(value);
}
