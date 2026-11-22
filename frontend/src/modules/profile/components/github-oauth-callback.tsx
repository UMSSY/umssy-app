'use client';

import { useEffect, useRef } from 'react';
import { completeGithubOAuth } from '../utils/complete-github-oauth';

// Session restoration can remount this page while the same exchange is running.
let pendingExchange: Promise<string> | null = null;

export function GithubOAuthCallback() {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!pendingExchange) {
      const params = new URLSearchParams(window.location.search);
      pendingExchange = completeGithubOAuth(params);
      window.history.replaceState({}, '', window.location.pathname);
    }
    void pendingExchange.then((result) => {
      pendingExchange = null;
      window.location.replace(
        `/profile/settings?github_connection=${result}#personal-info`,
      );
    });
  }, []);

  return (
    <main className="p-6 text-sm text-ink">
      Finalizando la conexión con GitHub...
    </main>
  );
}
