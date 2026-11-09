"use client";

import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useRegistrationSession } from "@/modules/registrations";
import { eventsService } from "../services/events.service";
import { NO_EVENT_FILTERS } from "../constants/events.constants";
import type { EventFiltersPayload } from "../types/event-filters.types";

export function useEvents(filters: EventFiltersPayload = NO_EVENT_FILTERS) {
  const queryClient = useQueryClient();
  const accessToken = useRegistrationSession();
  const search = filters.search.trim();
  const categoryId = filters.categoryId;
  const queryKey = ["events", "list", accessToken, search, categoryId];
  const query = useInfiniteQuery({
    queryKey,
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => eventsService.getEvents({
      page: pageParam, limit: 50,
      includeProposals: true,
      ...(search && { search }), ...(categoryId && { categoryId }),
    }, signal, accessToken),
    getNextPageParam: (lastPage, pages) => lastPage.data.length === 50 ? pages.length + 1 : undefined,
  });
  return {
    events: [...new Map((query.data?.pages.flatMap((page) => page.data) ?? []).map(event => [event.id, event])).values()],
    error: query.isError && !query.isFetching ? "No se pudieron cargar los talleres. Revisa la conexión e inténtalo de nuevo." : null,
    hasMore: Boolean(query.hasNextPage),
    isLoading: query.isPending,
    isLoadingMore: query.isFetchingNextPage,
    loadMore: () => { if (query.hasNextPage && !query.isFetching) void query.fetchNextPage(); },
    retry: () => { void queryClient.resetQueries({ queryKey, exact: true }); },
  };
}
