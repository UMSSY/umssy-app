'use client';

import { getAccessToken } from "@/shared/services/storage/access-token-storage";
import { hasCookieSession } from "@/shared/services/storage/cookie-session-state";
import { useCookieSession } from "@/shared/hooks/use-cookie-session";
import { useEffect, useMemo, useRef } from "react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { isApiError } from "@/shared/services/api-client";
import {
  getRegistrationErrorMessage,
  REGISTRATION_QUERY_KEYS,
  useRegistrationSession,
} from '@/modules/event-registrations';
import { registrationsService } from '../services/registrations.service';
import { reconcileOfflinePasses } from '../services/offline-passes.service';
import { OFFLINE_PASSES_SNAPSHOT_QUERY_KEY } from '../constants/offline-passes.constants';
import { useOnlineStatus } from './use-online-status';

export function useMyPasses(isActive = true) {
  const accessToken = useRegistrationSession();
  const cookieSession = useCookieSession();
  const hasSession = Boolean(accessToken) || cookieSession;
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();
  const query = useQuery({
    queryKey: [...REGISTRATION_QUERY_KEYS.passes, accessToken],
    enabled: hasSession && isOnline && isActive,
    refetchOnReconnect: 'always',
    queryFn: async ({ signal }) => {
      const registrations = await registrationsService.getMine(
        signal,
        accessToken,
      );
      const removedSavedPasses = accessToken
        ? await reconcileOfflinePasses(
            registrations,
            accessToken,
            signal,
          ).catch(() => false)
        : false;
      if (getAccessToken() === accessToken && (Boolean(accessToken) || hasCookieSession()) && !signal.aborted) {
        void queryClient.invalidateQueries({
          queryKey: [OFFLINE_PASSES_SNAPSHOT_QUERY_KEY, accessToken],
        });
      }
      return { registrations, removedSavedPasses };
    },
  });
  const cause = query.error;
  useEffect(() => {
    if (!isActive || !isOnline) {
      void queryClient.cancelQueries({ queryKey: [...REGISTRATION_QUERY_KEYS.passes, accessToken], exact: true });
    }
  }, [isActive, isOnline, accessToken, queryClient]);
  return {
    registrations: query.data?.registrations ?? [],
    removedSavedPasses: query.data?.removedSavedPasses ?? false,
    isLoading: query.isFetching,
    error:
      query.isError && !query.isFetching
        ? cause instanceof Error && !isApiError(cause)
          ? cause.message
          : getRegistrationErrorMessage(cause)
        : null,
    isConnectionError:
      query.isError &&
      !query.isFetching &&
      isApiError(cause) &&
      !cause.response,
    retry: () => {
      if (isOnline && isActive && accessToken) void query.refetch();
    },
  };
}

export function useMyPassesHistory(isEnabled: boolean) {
  const accessToken = useRegistrationSession();
  const queryClient = useQueryClient();
  const requestVersion = useRef(0);
  const queryKey = useMemo(() => ["events", "finished-registrations", accessToken], [accessToken]);
  const query = useInfiniteQuery({
    queryKey,
    initialPageParam: 1,
    queryFn: async ({ pageParam, signal }) => {
      const version = requestVersion.current;
      const page = await registrationsService.getFinished(pageParam, 10, signal, accessToken);
      if (version !== requestVersion.current) throw new DOMException("Request cancelled", "AbortError");
      return page;
    },
    getNextPageParam: (lastPage, pages) => pages.length < lastPage.totalPages ? pages.length + 1 : undefined,
    enabled: isEnabled && Boolean(accessToken),
    staleTime: Infinity,
    retry: false,
  });

  useEffect(() => {
    if (!isEnabled) {
      requestVersion.current += 1;
      void queryClient.cancelQueries({ queryKey, exact: true });
      queryClient.removeQueries({ queryKey, exact: true });
    }
  }, [isEnabled, queryClient, queryKey]);

  return {
    registrations: query.data?.pages.flatMap((page) => page.items) ?? [],
    total: query.data?.pages[0]?.total ?? 0,
    error: query.isError && !query.isFetching ? query.error : null,
    hasMore: Boolean(query.hasNextPage),
    isLoading: isEnabled && query.isFetching && !query.isFetchingNextPage,
    isLoadingMore: query.isFetchingNextPage,
    loadMore: () => { if (query.hasNextPage && !query.isFetching) void query.fetchNextPage(); },
    retry: () => { if (isEnabled && accessToken) void query.refetch(); },
  };
}
