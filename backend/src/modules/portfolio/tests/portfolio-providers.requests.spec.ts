import { describe, expect, it } from 'vitest';
import { getPortfolioRepositoriesQuerySchema } from '../requests/get-portfolio-repositories-query.schema.js';
import { oauthCallbackSchema } from '../requests/oauth-callback.schema.js';
import { oauthUrlQuerySchema } from '../requests/oauth-url-query.schema.js';
import { portfolioProviderParamSchema } from '../requests/portfolio-provider-param.schema.js';

describe('Portfolio providers request schemas', () => {
  describe('portfolioProviderParamSchema', () => {
    it('accepts valid providers', () => {
      expect(portfolioProviderParamSchema.parse('github')).toBe('github');
      expect(portfolioProviderParamSchema.parse('gitlab')).toBe('gitlab');
    });

    it('rejects invalid providers', () => {
      expect(() => portfolioProviderParamSchema.parse('bitbucket')).toThrow();
      expect(() => portfolioProviderParamSchema.parse('')).toThrow();
    });
  });

  describe('oauthCallbackSchema', () => {
    it('accepts non-empty code', () => {
      const parsed = oauthCallbackSchema.parse({ code: '  auth-code-123  ' });
      expect(parsed.code).toBe('auth-code-123');
    });

    it('rejects empty code', () => {
      expect(() => oauthCallbackSchema.parse({ code: '' })).toThrow();
      expect(() => oauthCallbackSchema.parse({ code: '   ' })).toThrow();
      expect(() => oauthCallbackSchema.parse({})).toThrow();
    });
  });

  describe('oauthUrlQuerySchema', () => {
    it('accepts optional state', () => {
      expect(oauthUrlQuerySchema.parse({ state: 'state123' })).toEqual({
        state: 'state123',
      });
      expect(oauthUrlQuerySchema.parse({})).toEqual({});
    });
  });

  describe('getPortfolioRepositoriesQuerySchema', () => {
    it('accepts valid query parameters', () => {
      expect(
        getPortfolioRepositoriesQuerySchema.parse({
          provider: 'github',
          search: '  umssy  ',
        }),
      ).toEqual({
        provider: 'github',
        search: 'umssy',
      });

      expect(getPortfolioRepositoriesQuerySchema.parse({})).toEqual({});
    });

    it('rejects invalid provider query', () => {
      expect(() =>
        getPortfolioRepositoriesQuerySchema.parse({ provider: 'invalid' }),
      ).toThrow();
    });
  });
});

