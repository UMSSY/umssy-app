"use client";

import { useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getAccessToken } from "@/shared/services/storage/access-token-storage";
import { parseApiError } from "@/shared/utils/parse-api-error";
import { useRegistrationSession } from "./use-registration-session";
import { registrationsService } from "../services/registrations.service";
import { REGISTRATION_QUERY_KEYS } from "../constants/registration-query-keys.constants";
import { getRegistrationErrorMessage } from "../utils/registration-error";
import type { RegistrationResponse } from "../types/registration-response.types";
import type { CancelRegistrationMutation, RegistrationMutation } from "../types/registration-mutation.types";

export function useRegistrationActions(eventId: string) {
  const queryClient = useQueryClient();
  const accessToken = useRegistrationSession();
  const isSubmittingRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  async function refreshQueries(variables: RegistrationMutation, includeOwn: boolean) {
    if (!isMountedRef.current || getAccessToken() !== variables.accessToken) return;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: REGISTRATION_QUERY_KEYS.passes }),
      queryClient.invalidateQueries({ queryKey: REGISTRATION_QUERY_KEYS.list }),
      queryClient.invalidateQueries({ queryKey: REGISTRATION_QUERY_KEYS.detail(variables.eventId) }),
      ...(includeOwn ? [queryClient.invalidateQueries({ queryKey: REGISTRATION_QUERY_KEYS.own(variables.eventId, variables.accessToken), exact: true })] : []),
    ]);
  }

  async function updateQueries(registration: RegistrationResponse, variables: RegistrationMutation) {
    if (!isMountedRef.current || getAccessToken() !== variables.accessToken) return;
    const queryKey = REGISTRATION_QUERY_KEYS.own(variables.eventId, variables.accessToken);
    await queryClient.cancelQueries({ queryKey, exact: true });
    if (getAccessToken() !== variables.accessToken) return;
    queryClient.setQueryData(queryKey, registration);
    await refreshQueries(variables, false);
  }

  const creation = useMutation({
    mutationKey: ["events", "register", eventId, accessToken],
    mutationFn: (variables: RegistrationMutation) => registrationsService.create(variables.eventId, variables.accessToken),
    onSuccess: updateQueries,
    onError: async (error, variables) => {
      const code = parseApiError(error)?.code;
      if (["EVENT_FINISHED", "EVENT_FULL", "ALREADY_REGISTERED", "REGISTRATION_CLOSED", "EVENT_CANCELLED", "EVENT_NOT_OPEN", "EVENT_NOT_FOUND"].includes(code ?? "")) {
        await refreshQueries(variables, code === "ALREADY_REGISTERED");
      }
    },
    onSettled: () => { isSubmittingRef.current = false; },
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
    register: async () => {
      if (isSubmittingRef.current) return null;
      isSubmittingRef.current = true;
      cancellation.reset();
      try {
        const data = await creation.mutateAsync({ eventId, accessToken: getAccessToken() });
        return { data, error: null };
      } catch (error) {
        return { data: null, error };
      }
    },
    cancel: (registrationId: string) => {
      creation.reset();
      cancellation.mutate({ registrationId, eventId, accessToken: getAccessToken() });
    },
    isPending: creation.isPending || cancellation.isPending,
    isSuccess: creation.isSuccess,
    errorCode: parseApiError(creation.error)?.code ?? null,
    error: error ? getRegistrationErrorMessage(error) : null,
    reset: () => { creation.reset(); },
  };
}
