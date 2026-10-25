"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getAccessToken } from "@/shared/services/storage/access-token-storage";
import { useRegistrationSession } from "./use-registration-session";
import { registrationsService } from "../services/registrations.service";
import { REGISTRATION_QUERY_KEYS } from "../constants/registration-query-keys.constants";
import { getRegistrationErrorMessage } from "../utils/registration-error";
import type { RegistrationResponse } from "../types/registration-response.types";
import type { CancelRegistrationMutation, RegistrationMutation } from "../types/registration-mutation.types";

export function useRegistrationActions(eventId: string) {
  const queryClient = useQueryClient();
  const accessToken = useRegistrationSession();

  async function updateQueries(registration: RegistrationResponse, variables: RegistrationMutation) {
    if (getAccessToken() !== variables.accessToken) return;
    const queryKey = REGISTRATION_QUERY_KEYS.own(variables.eventId, variables.accessToken);
    await queryClient.cancelQueries({ queryKey, exact: true });
    if (getAccessToken() !== variables.accessToken) return;
    queryClient.setQueryData(queryKey, registration);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: REGISTRATION_QUERY_KEYS.passes }),
      queryClient.invalidateQueries({ queryKey: REGISTRATION_QUERY_KEYS.list }),
      queryClient.invalidateQueries({ queryKey: REGISTRATION_QUERY_KEYS.detail(variables.eventId) }),
    ]);
  }

  const creation = useMutation({
    mutationKey: ["events", "register", eventId, accessToken],
    mutationFn: (variables: RegistrationMutation) => registrationsService.create(variables.eventId, variables.accessToken),
    onSuccess: updateQueries,
    retry: false,
  });

  const cancellation = useMutation({
    mutationKey: ["events", "cancel-registration", eventId, accessToken],
    mutationFn: (variables: CancelRegistrationMutation) => registrationsService.cancel(variables.registrationId, variables.accessToken),
    onSuccess: updateQueries,
    retry: false,
  });

  const error = creation.error ?? cancellation.error;

  return {
    register: () => {
      cancellation.reset();
      creation.mutate({ eventId, accessToken: getAccessToken() });
    },
    cancel: (registrationId: string) => {
      creation.reset();
      cancellation.mutate({ registrationId, eventId, accessToken: getAccessToken() });
    },
    isPending: creation.isPending || cancellation.isPending,
    error: error ? getRegistrationErrorMessage(error) : null,
  };
}
