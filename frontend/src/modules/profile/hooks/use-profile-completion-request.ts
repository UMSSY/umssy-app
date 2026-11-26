'use client';

import { useEffect, useEffectEvent, useRef } from 'react';
import {
  PROFILE_COMPLETENESS_HASH_PREFIX,
  PROFILE_COMPLETENESS_ROUTES,
} from '../constants/profile-completeness-navigation.constants';
import type { ProfileCompletenessSectionId } from '../types/profile-completeness-section-id.types';

export function useProfileCompletionRequest(
  section: ProfileCompletenessSectionId,
  isReady: boolean,
  onRequest: () => void,
) {
  const hasHandledRequest = useRef(false);
  const handleRequest = useEffectEvent(onRequest);

  useEffect(() => {
    if (!isReady) return;

    function requestCompletion() {
      if (
        hasHandledRequest.current ||
        window.location.pathname !== PROFILE_COMPLETENESS_ROUTES[section] ||
        window.location.hash !== `${PROFILE_COMPLETENESS_HASH_PREFIX}${section}`
      )
        return;

      hasHandledRequest.current = true;
      handleRequest();
    }

    function handleHashChange() {
      hasHandledRequest.current = false;
      requestCompletion();
    }

    requestCompletion();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [section, isReady]);
}
