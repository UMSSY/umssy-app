'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/shared/contexts/auth-context';
import {
  PROFILE_COMPLETENESS_MESSAGES,
  PROFILE_COMPLETENESS_QUERY_KEY,
} from '../constants/profile-completeness.constants';
import { profileCompletenessService } from '../services/profile-completeness.service';
import { getProfileErrorMessage } from '../utils/get-profile-error-message';

export function useProfileCompleteness() {
  const { currentUserId, isLoading: isSessionLoading } = useAuth();
  const enabled = Boolean(currentUserId) && !isSessionLoading;
  const query = useQuery({
    queryKey: [...PROFILE_COMPLETENESS_QUERY_KEY, currentUserId],
    queryFn: ({ signal }) => profileCompletenessService.getCompleteness(signal),
    enabled,
  });

  async function reload() {
    if (enabled) await query.refetch();
  }

  return {
    completeness: enabled && !query.isError ? (query.data ?? null) : null,
    isLoading:
      !enabled || query.isPending || (query.isError && query.isFetching),
    error:
      enabled && query.error
        ? getProfileErrorMessage(
            query.error,
            PROFILE_COMPLETENESS_MESSAGES.error,
          )
        : null,
    reload,
  };
}
