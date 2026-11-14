import { describe, expect, it } from 'vitest';
import { UnsupportedPortfolioProviderException } from '../exceptions/unsupported-portfolio-provider.exception.js';
import { isPortfolioProvider } from '../utils/is-portfolio-provider.util.js';
import { parsePortfolioProvider } from '../utils/parse-portfolio-provider.util.js';

describe('portfolio-provider utilities', () => {
  it('identifies valid portfolio providers', () => {
    expect(isPortfolioProvider('github')).toBe(true);
    expect(isPortfolioProvider('gitlab')).toBe(true);
    expect(isPortfolioProvider('bitbucket')).toBe(false);
    expect(isPortfolioProvider('')).toBe(false);
  });

  it('parses valid portfolio providers', () => {
    expect(parsePortfolioProvider('github')).toBe('github');
    expect(parsePortfolioProvider('gitlab')).toBe('gitlab');
  });

  it('throws UnsupportedPortfolioProviderException for invalid providers', () => {
    expect(() => parsePortfolioProvider('bitbucket')).toThrow(
      UnsupportedPortfolioProviderException,
    );
  });
});
