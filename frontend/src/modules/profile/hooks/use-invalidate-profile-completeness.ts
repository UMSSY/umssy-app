'use client';

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { PROFILE_COMPLETENESS_QUERY_KEY } from '../constants/profile-completeness.constants';

export function useInvalidateProfileCompleteness() {
  const queryClient = useQueryClient();

  return useCallback(async () => {
    // Discard reads started before the write so they cannot restore an old percentage.
    await queryClient.cancelQueries({
      queryKey: PROFILE_COMPLETENESS_QUERY_KEY,
    });
    await queryClient.invalidateQueries({
      queryKey: PROFILE_COMPLETENESS_QUERY_KEY,
    });
  }, [queryClient]);
}
