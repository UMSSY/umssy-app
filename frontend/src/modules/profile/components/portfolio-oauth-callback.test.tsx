import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { completePortfolioOAuth } from '../utils/complete-portfolio-oauth';
import {
  PortfolioOAuthCallback,
  resetPendingOAuthExchanges,
} from './portfolio-oauth-callback';

vi.mock('../utils/complete-portfolio-oauth', () => ({
  completePortfolioOAuth: vi.fn(() => new Promise<string>(() => {})),
}));

afterEach(() => {
  cleanup();
  resetPendingOAuthExchanges();
});

describe('PortfolioOAuthCallback', () => {
  it('displays the provider connection label and calls completePortfolioOAuth for GitHub', () => {
    window.history.replaceState(
      {},
      '',
      '/oauth/github/callback?code=gh-code&state=gh-state',
    );
    render(<PortfolioOAuthCallback provider="github" />);
    expect(
      screen.getByText('Finalizando la conexión con GitHub...'),
    ).toBeInTheDocument();
    expect(completePortfolioOAuth).toHaveBeenCalledWith(
      'github',
      expect.any(URLSearchParams),
    );
  });

  it('displays the provider connection label and calls completePortfolioOAuth for GitLab', () => {
    window.history.replaceState(
      {},
      '',
      '/oauth/gitlab/callback?code=gl-code&state=gl-state',
    );
    render(<PortfolioOAuthCallback provider="gitlab" />);
    expect(
      screen.getByText('Finalizando la conexión con GitLab...'),
    ).toBeInTheDocument();
    expect(completePortfolioOAuth).toHaveBeenCalledWith(
      'gitlab',
      expect.any(URLSearchParams),
    );
  });
});
