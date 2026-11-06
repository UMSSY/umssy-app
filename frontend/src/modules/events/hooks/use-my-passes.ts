"use client";

import { useQuery } from "@tanstack/react-query";
import { isApiError } from "@/shared/services/api-client";
import {
  getRegistrationErrorMessage,
  REGISTRATION_QUERY_KEYS,
  useRegistrationSession,
} from "@/modules/registrations";
import { registrationsService } from "../services/registrations.service";

export function useMyPasses() {
  const accessToken = useRegistrationSession();
  const query = useQuery({
    queryKey: [...REGISTRATION_QUERY_KEYS.passes, accessToken],
    queryFn: ({ signal }) => registrationsService.getMine(signal, accessToken),
  });
  const cause = query.error;
  return {
    registrations: query.data ?? [],
    isLoading: query.isFetching,
    error: query.isError && !query.isFetching
      ? cause instanceof Error && !isApiError(cause)
        ? cause.message
        : getRegistrationErrorMessage(cause)
      : null,
    retry: () => { void query.refetch(); },
  };
}
