
"use client";

import { useQuery } from "@tanstack/react-query";

import { getReceivedConnectionRequests } from "../services/connection-request-api";

export const receivedConnectionRequestsQueryKey = [
  "chat",
  "connection-requests",
  "received",
] as const;

export function useReceivedConnectionRequests() {
  return useQuery({
    queryKey: receivedConnectionRequestsQueryKey,
    queryFn: getReceivedConnectionRequests,
    select: (requests) =>
      requests.filter(
        (request) => request.status?.title === "PENDING",
      ),
    staleTime: 30_000,
  });
}
