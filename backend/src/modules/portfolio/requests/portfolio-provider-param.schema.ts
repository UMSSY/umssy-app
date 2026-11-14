import { z } from 'zod';
import { PORTFOLIO_PROVIDERS } from '../constants/portfolio-provider.constants.js';

export const portfolioProviderParamSchema = z.enum(PORTFOLIO_PROVIDERS);

