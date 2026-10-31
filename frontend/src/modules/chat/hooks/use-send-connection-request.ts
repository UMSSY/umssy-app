
"use client";

import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  sendConnectionRequest,
} from "../services/connection-request-api";

export function useSendConnectionRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (receiverId: string) =>
      sendConnectionRequest({ receiverId }),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["chat", "connection-requests"],
      });
    },
  });
}
