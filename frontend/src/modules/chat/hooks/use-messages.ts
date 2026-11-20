'use client';

import { mergeMessages } from '../utils/merge-messages';
import { useInfiniteQuery } from '@tanstack/react-query';

import { getPaginatedMessages } from '../services/chat-api';
import type { MessagesPage } from '../types/messages-page.types';
import { messagesQueryKey } from '../constants/messages-query-key';
export type { MessagesPage } from '../types/messages-page.types';
export { messagesQueryKey } from '../constants/messages-query-key';

const PAGE_SIZE = 10;

export function useMessages(conversationId: string | null) {
  const query = useInfiniteQuery({
    queryKey: messagesQueryKey(conversationId),

    queryFn: async ({ pageParam, signal }): Promise<MessagesPage> => {
      if (!conversationId) {
        return {
          messages: [],
          hasMore: false,
          nextCursor: null,
        };
      }

      const response = await getPaginatedMessages({
        conversationId,
        cursor: pageParam,
        limit: PAGE_SIZE,
        signal,
      });

      return {
        messages: response.data,
        hasMore: response.hasMore,
        nextCursor: response.nextCursor,
      };
    },

    initialPageParam: null as string | null,

    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,

    enabled: Boolean(conversationId),
    refetchOnReconnect: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const messages = query.data
    ? [...query.data.pages]
        .reverse()
        .flatMap((page) => page.messages)
    : [];

  return {
    ...query,
    data: mergeMessages(conversationId ?? '', messages),

    hasMoreMessages: Boolean(
      query.data?.pages[query.data.pages.length - 1]?.hasMore,
    ),

    loadMoreMessages: query.fetchNextPage,

    isLoadingMoreMessages: query.isFetchingNextPage,
  };
}