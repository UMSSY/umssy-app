import type { PORTFOLIO_PROVIDERS } from '../constants/portfolio-provider.constants.js';

export type PortfolioProvider = (typeof PORTFOLIO_PROVIDERS)[number];
