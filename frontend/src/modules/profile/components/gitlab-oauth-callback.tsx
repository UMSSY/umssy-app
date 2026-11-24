'use client';

import { useEffect, useRef } from 'react';
import { completePortfolioOAuth } from '../utils/complete-portfolio-oauth';

let pendingExchange: Promise<string> | null = null;

export function GitlabOAuthCallback() {
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!pendingExchange) {
      const params = new URLSearchParams(window.location.search);
      pendingExchange = completePortfolioOAuth('gitlab', params);
      window.history.replaceState({}, '', window.location.pathname);
    }
    void pendingExchange.then((result) => {
      pendingExchange = null;
      window.location.replace(
        `/profile/settings?gitlab_connection=${result}#personal-info`,
      );
    });
  }, []);
  return (
    <main className="p-6 text-sm text-ink">
      Finalizando la conexión con GitLab...
    </main>
  );
}
