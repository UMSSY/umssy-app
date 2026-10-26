"use client";

import type { SupportMutation } from '../types/support-mutation.types';

import { useRef } from "react";
import { useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { REGISTRATION_QUERY_KEYS, useRegistrationSession } from "@/modules/registrations";
import { getAccessToken } from "@/shared/services/storage/access-token-storage";
import { parseApiError } from "@/shared/utils/parse-api-error";
import { registrationsService } from "../services/registrations.service";
import { getProposalSupportErrorMessage } from "../utils/proposal-support-error";
import type { EventItem } from "../types/event-item.types";
import type { EventDetail } from "../types/event-detail.types";
import type { EventsListResponse } from "../types/events-list-response.types";
import type { ProposalSupportResponse } from "../types/proposal-support-response.types";


function applySupport<T extends EventItem>(event: T, response: ProposalSupportResponse): T {
  if (event.id !== response.eventId) return event;
  return {
    ...event,
    status: response.status,
    supportCount: response.supportCount,
    supportThreshold: response.supportThreshold,
    supportsRemaining: response.supportsRemaining,
    progressPercent: response.progressPercent,
    hasSupported: true,
    registrationCount: response.supportCount,
    availableSpots: event.capacity === null
      ? null
      : Math.max(0, event.capacity - response.supportCount),
  };
}

export function useProposalSupport(eventId: string | null) {
  const queryClient = useQueryClient();
  const accessToken = useRegistrationSession();
  const isSubmittingRef = useRef(false);

  const mutation = useMutation({
    mutationKey: ["events", "support-proposal", eventId, accessToken],
    mutationFn: ({ eventId, accessToken }: SupportMutation) =>
      registrationsService.supportProposal(eventId, accessToken),
    onSuccess: async (response, variables) => {
      if (getAccessToken() !== variables.accessToken) return;

      const listKey = [...REGISTRATION_QUERY_KEYS.list, variables.accessToken];
      const detailKey = [...REGISTRATION_QUERY_KEYS.detail(variables.eventId), variables.accessToken];
      await Promise.all([
        queryClient.cancelQueries({ queryKey: listKey }),
        queryClient.cancelQueries({ queryKey: detailKey, exact: true }),
      ]);
      if (getAccessToken() !== variables.accessToken) return;

      queryClient.setQueriesData<InfiniteData<EventsListResponse>>(
        { queryKey: listKey },
        (current) => current && {
          ...current,
          pages: current.pages.map((page) => ({
            ...page,
            data: page.data.map((event) => applySupport(event, response)),
          })),
        },
      );
      queryClient.setQueryData<EventDetail>(
        detailKey,
        (current) => current && applySupport(current, response),
      );

      void queryClient.invalidateQueries({ queryKey: listKey });
      void queryClient.invalidateQueries({ queryKey: detailKey, exact: true });
      if (response.status === "Publicado") {
        void queryClient.invalidateQueries({
          queryKey: [...REGISTRATION_QUERY_KEYS.passes, variables.accessToken],
          exact: true,
        });
        void queryClient.invalidateQueries({
          queryKey: REGISTRATION_QUERY_KEYS.own(variables.eventId, variables.accessToken),
          exact: true,
        });
      }
    },
    onError: (error, variables) => {
      if (getAccessToken() !== variables.accessToken) return;
      const code = parseApiError(error)?.code;
      if (!["ALREADY_SUPPORTED", "PROPOSAL_EXPIRED", "EVENT_NOT_SUPPORTABLE", "EVENT_NOT_FOUND"].includes(code ?? "")) return;
      void queryClient.invalidateQueries({
        queryKey: [...REGISTRATION_QUERY_KEYS.list, variables.accessToken],
      });
      void queryClient.invalidateQueries({
        queryKey: [...REGISTRATION_QUERY_KEYS.detail(variables.eventId), variables.accessToken],
        exact: true,
      });
      if (code === "ALREADY_SUPPORTED") {
        void queryClient.invalidateQueries({
          queryKey: REGISTRATION_QUERY_KEYS.own(variables.eventId, variables.accessToken),
          exact: true,
        });
      }
    },
    retry: false,
  });

  const isCurrentMutation = mutation.variables?.eventId === eventId
    && mutation.variables?.accessToken === accessToken;

  return {
    support: async () => {
      const token = getAccessToken();
      if (!eventId || !token || isSubmittingRef.current) return null;
      isSubmittingRef.current = true;
      mutation.reset();
      try {
        const data = await mutation.mutateAsync({ eventId, accessToken: token });
        return getAccessToken() === token ? { data, error: null } : null;
      } catch (error) {
        return getAccessToken() === token ? { data: null, error } : null;
      } finally {
        isSubmittingRef.current = false;
      }
    },
    isPending: mutation.isPending && mutation.variables?.accessToken === accessToken,
    isSuccess: mutation.isSuccess && isCurrentMutation,
    data: isCurrentMutation ? mutation.data ?? null : null,
    errorCode: isCurrentMutation ? parseApiError(mutation.error)?.code ?? null : null,
    error: isCurrentMutation && mutation.error
      ? getProposalSupportErrorMessage(mutation.error)
      : null,
    reset: () => mutation.reset(),
  };
}
