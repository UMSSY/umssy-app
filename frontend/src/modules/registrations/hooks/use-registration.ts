"use client";

import { useQuery } from "@tanstack/react-query";
import { registrationsService } from "../services/registrations.service";
import { REGISTRATION_QUERY_KEYS } from "../constants/registration-query-keys.constants";
import { getRegistrationErrorMessage } from "../utils/registration-error";
import { useRegistrationSession } from "./use-registration-session";

export function useRegistration(eventId: string | null) {
  const accessToken = useRegistrationSession();
  const query = useQuery({
    queryKey: REGISTRATION_QUERY_KEYS.own(eventId, accessToken),
    queryFn: ({ signal }) => eventId && accessToken
      ? registrationsService.getOwn(eventId, signal, accessToken)
      : Promise.resolve(null),
    enabled: Boolean(eventId && accessToken),
    retry: false,
  });
  return {
    registration: query.data ?? null,
    isLoading: query.isFetching,
    error: query.isError ? getRegistrationErrorMessage(query.error) : null,
    retry: query.refetch,
  };
}
