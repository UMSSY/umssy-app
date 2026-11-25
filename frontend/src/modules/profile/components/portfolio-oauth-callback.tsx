'use client';

import { useEffect, useRef } from 'react';
import { completePortfolioOAuth } from '../utils/complete-portfolio-oauth';
import type { PortfolioOAuthCallbackProps } from '../types/portfolio-oauth-callback-props.types';
import type { PortfolioProviderName } from '../types/portfolio-provider-name.types';

const pendingExchanges = new Map<PortfolioProviderName, Promise<string>>();

const PROVIDER_NAMES: Record<PortfolioProviderName, string> = {
  github: 'GitHub',
  gitlab: 'GitLab',
};

export function resetPendingOAuthExchanges(): void {
  pendingExchanges.clear();
}

export function PortfolioOAuthCallback({
  provider,
}: PortfolioOAuthCallbackProps) {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    let pending = pendingExchanges.get(provider);
    if (!pending) {
      const params = new URLSearchParams(window.location.search);
      pending = completePortfolioOAuth(provider, params);
      pendingExchanges.set(provider, pending);
      window.history.replaceState({}, '', window.location.pathname);
    }
    void pending.then((result) => {
      pendingExchanges.delete(provider);
      window.location.replace(
        `/profile/settings?${provider}_connection=${result}#personal-info`,
      );
    });
  }, [provider]);

  return (
    <main className="p-6 text-sm text-ink">
      Finalizando la conexión con {PROVIDER_NAMES[provider]}...
    </main>
  );
}
