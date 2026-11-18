'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getAccessToken } from '@/shared/services/storage/access-token-storage';
import { parseApiError } from '@/shared/utils/parse-api-error';
import { getRegistrationErrorMessage } from '../utils/registration-error';
import { REGISTRATION_QUERY_KEYS } from '../constants/registration-query-keys.constants';
import { useRegistrationSession } from './use-registration-session';
import { registrationsService } from '../services/registrations.service';
import { OFFLINE_PASSES_SNAPSHOT_QUERY_KEY } from '@/shared/constants/offline-passes.constants';
import type { Registration } from '../types/registration.types';

interface PassesQueryCache {
  registrations: Registration[];
  removedSavedPasses: boolean;
}

interface CancelPassVariables {
  registrationId: string;
  accessToken: string | null;
}

export function useCancelRegistration() {
  const queryClient = useQueryClient();
  const accessToken = useRegistrationSession();

  const mutation = useMutation({
    mutationKey: ['events', 'cancel-my-pass', accessToken],
    mutationFn: ({ registrationId, accessToken: token }: CancelPassVariables) =>
      registrationsService.cancel(registrationId, token),
    onSuccess: async (cancelledRegistration, variables) => {
      if (getAccessToken() !== variables.accessToken) return;

      queryClient.setQueryData(
        REGISTRATION_QUERY_KEYS.own(cancelledRegistration.eventId, variables.accessToken),
        cancelledRegistration,
      );

      const passesKey = [...REGISTRATION_QUERY_KEYS.passes, variables.accessToken];
      queryClient.setQueryData<PassesQueryCache>(passesKey, (current) =>
        current
          ? {
              ...current,
              registrations: current.registrations.filter(
                (item) => item.id !== variables.registrationId,
              ),
            }
          : current,
      );

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: REGISTRATION_QUERY_KEYS.passes }),
        queryClient.invalidateQueries({ queryKey: REGISTRATION_QUERY_KEYS.list }),
        queryClient.invalidateQueries({
          queryKey: REGISTRATION_QUERY_KEYS.detail(cancelledRegistration.eventId),
        }),
        queryClient.invalidateQueries({
          queryKey: REGISTRATION_QUERY_KEYS.own(
            cancelledRegistration.eventId,
            variables.accessToken,
          ),
          exact: true,
        }),
        ...(variables.accessToken
          ? [
              queryClient.invalidateQueries({
                queryKey: [OFFLINE_PASSES_SNAPSHOT_QUERY_KEY, variables.accessToken],
              }),
            ]
          : []),
      ]);
    },
    onError: async (error) => {
      const code = parseApiError(error)?.code;
      if (
        code &&
        [
          'REGISTRATION_ALREADY_CANCELLED',
          'REGISTRATION_NOT_FOUND',
          'EVENT_FINISHED',
        ].includes(code)
      ) {
        await queryClient.invalidateQueries({
          queryKey: REGISTRATION_QUERY_KEYS.passes,
        });
      }
    },
    retry: false,
  });

  return {
    cancelRegistration: async (registrationId: string) => {
      return mutation.mutateAsync({
        registrationId,
        accessToken: getAccessToken(),
      });
    },
    isCancelling: mutation.isPending,
    cancelError: mutation.error,
    resetCancellation: mutation.reset,
    getErrorMessage: getRegistrationErrorMessage,
  };
}
