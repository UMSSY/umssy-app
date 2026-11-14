"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAccessToken } from "@/shared/services/storage/access-token-storage";
import { isApiError } from "@/shared/services/api-client";
import {
  getRegistrationErrorMessage,
  REGISTRATION_QUERY_KEYS,
  useRegistrationSession,
} from "@/modules/registrations";
import { registrationsService } from "../services/registrations.service";
import { reconcileOfflinePasses } from "../services/offline-passes.service";
import { OFFLINE_PASSES_SNAPSHOT_QUERY_KEY } from "../constants/offline-passes.constants";

export function useMyPasses() {
  const accessToken = useRegistrationSession();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: [...REGISTRATION_QUERY_KEYS.passes, accessToken],
    enabled: Boolean(accessToken),
    refetchOnReconnect: 'always',
    queryFn: async ({ signal }) => {
      const registrations = await registrationsService.getMine(signal, accessToken);
      const removedSavedPasses = accessToken
        ? await reconcileOfflinePasses(registrations, accessToken, signal).catch(() => false)
        : false;
      if (accessToken && getAccessToken() === accessToken && !signal.aborted) {
        void queryClient.invalidateQueries({ queryKey: [OFFLINE_PASSES_SNAPSHOT_QUERY_KEY, accessToken] });
      }
      return { registrations, removedSavedPasses };
    },
  });
  const cause = query.error;
  return {
    registrations: query.data?.registrations ?? [],
    removedSavedPasses: query.data?.removedSavedPasses ?? false,
    isLoading: query.isFetching,
    error: query.isError && !query.isFetching
      ? cause instanceof Error && !isApiError(cause)
        ? cause.message
        : getRegistrationErrorMessage(cause)
      : null,
    isConnectionError: query.isError && !query.isFetching && isApiError(cause) && !cause.response,
    retry: () => { void query.refetch(); },
  };
}
