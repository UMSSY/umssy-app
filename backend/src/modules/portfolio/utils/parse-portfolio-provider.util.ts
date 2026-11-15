import { UnsupportedPortfolioProviderException } from '../exceptions/unsupported-portfolio-provider.exception.js';
import type { PortfolioProvider } from '../types/portfolio-provider.type.js';
import { isPortfolioProvider } from './is-portfolio-provider.util.js';

export function parsePortfolioProvider(value: string): PortfolioProvider {
  if (isPortfolioProvider(value)) {
    return value;
  }
  throw new UnsupportedPortfolioProviderException(value);
}
