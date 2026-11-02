
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  acceptConnectionRequest,
  rejectConnectionRequest,
} from "../services/connection-request-api";

type ConnectionRequestAction = "accept" | "reject";

interface RespondConnectionRequestParams {
  requestId: string;
  action: ConnectionRequestAction;
}

export function useRespondConnectionRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      action,
    }: RespondConnectionRequestParams) => {
      if (action === "accept") {
        return acceptConnectionRequest(requestId);
      }

      return rejectConnectionRequest(requestId);
    },

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["chat", "connection-requests"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["chat", "conversations"],
        }),
      ]);
    },
  });
}
