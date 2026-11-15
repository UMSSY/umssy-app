"use client";

import { useEffect, useMemo } from "react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
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
    isConnectionError: query.isError && !query.isFetching && isApiError(cause) && !cause.response,
    retry: () => { void query.refetch(); },
  };
}

export function useMyPassesHistory(isEnabled: boolean) {
  const accessToken = useRegistrationSession();
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => ["events", "finished-registrations", accessToken], [accessToken]);
  const query = useInfiniteQuery({
    queryKey,
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => registrationsService.getFinished(pageParam, 10, signal, accessToken),
    getNextPageParam: (lastPage, pages) => pages.length < lastPage.totalPages ? pages.length + 1 : undefined,
    enabled: isEnabled && Boolean(accessToken),
    staleTime: Infinity,
    retry: false,
  });

  useEffect(() => {
    if (!isEnabled) void queryClient.cancelQueries({ queryKey, exact: true });
  }, [isEnabled, queryClient, queryKey]);

  return {
    registrations: query.data?.pages.flatMap((page) => page.items) ?? [],
    total: query.data?.pages[0]?.total ?? 0,
    error: query.isError && !query.isFetching ? getRegistrationErrorMessage(query.error) : null,
    hasMore: Boolean(query.hasNextPage),
    isLoading: isEnabled && query.isPending && query.isFetching,
    isLoadingMore: query.isFetchingNextPage,
    loadMore: () => { if (query.hasNextPage && !query.isFetching) void query.fetchNextPage(); },
    retry: () => { void query.refetch(); },
  };
}
