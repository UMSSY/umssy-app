'use client';

import type { ProfileCompletenessSectionId } from '../types/profile-completeness-section-id.types';
import { useProfileCompletionRequest } from './use-profile-completion-request';

export function useProfileCompletionFocus(
  section: ProfileCompletenessSectionId,
  fields: Record<string, string>,
  isReady = true,
) {
  useProfileCompletionRequest(section, isReady, () => {
    const entries = Object.entries(fields);
    const fieldId = (entries.find(([, value]) => !value.trim()) ??
      entries[0])?.[0];
    const target = fieldId ? document.getElementById(fieldId) : null;
    if (!target || target.matches(':disabled, [aria-disabled="true"]')) return;

    target.focus({ preventScroll: true });
    target.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth',
      block: 'center',
    });
    // Consume the request without adding a history entry or losing Next's router state.
    window.history.replaceState(
      window.history.state,
      '',
      `${window.location.pathname}${window.location.search}`,
    );
  });
}
