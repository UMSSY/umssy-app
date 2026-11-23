'use client';

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { PROFILE_COMPLETENESS_QUERY_KEY } from '../constants/profile-completeness.constants';

export function useInvalidateProfileCompleteness() {
  const queryClient = useQueryClient();

  return useCallback(async () => {
    // Cancelar consultas anteriores antes de actualizar los datos.
    await Promise.all([
      queryClient.cancelQueries({
        queryKey: ['mentors', 'profile-suggestions'],
      }),
      queryClient.cancelQueries({
        queryKey: PROFILE_COMPLETENESS_QUERY_KEY,
      }),
    ]);

    // Iniciar todas las invalidaciones sin bloquear unas con otras.
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ['mentors', 'profile-suggestions'],
      }),
      queryClient.invalidateQueries({
        queryKey: ['mentors', 'participation'],
      }),
      queryClient.invalidateQueries({
        queryKey: PROFILE_COMPLETENESS_QUERY_KEY,
      }),
    ]);
  }, [queryClient]);
}
