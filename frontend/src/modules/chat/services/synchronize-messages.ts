import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import { getPaginatedMessages } from "./chat-api";
import { messagesQueryKey } from "../constants/messages-query-key";
import type { MessagesPage } from "../types/messages-page.types";
import type { Message } from "../types/conversation.types";

import { mergeMessages } from "../utils/merge-messages";

/** Walk backward to the known history, including gaps larger than one page. */
export async function synchronizeMessages(
  client: QueryClient,
  conversationId: string,
  signal: AbortSignal,
) {
  const key = messagesQueryKey(conversationId);
  await client.cancelQueries({ queryKey: key });
  const cached = client.getQueryData<InfiniteData<MessagesPage>>(key);
  const known = new Set(
    cached?.pages.flatMap((page) => page.messages.map((message) => message.id)),
  );
  const recovered: Message[] = [];
  let cursor: string | null = null;
  const visited = new Set<string>();
  let firstPage: MessagesPage | undefined;
  do {
    signal.throwIfAborted();
    const page = await getPaginatedMessages({
      conversationId,
      cursor,
      limit: 50,
      signal,
      requireServer: true,
    });
    firstPage ??= {
      messages: page.data,
      hasMore: page.hasMore,
      nextCursor: page.nextCursor,
    };
    const chronological = mergeMessages(conversationId, page.data);
    const knownIndex = chronological.findLastIndex((message) => known.has(message.id));
    // The boundary page may contain older, unloaded history. Only append the gap.
    recovered.push(...chronological.slice(knownIndex + 1));
    if (!cached || knownIndex >= 0 || !page.hasMore) break;
    if (!page.nextCursor || visited.has(page.nextCursor))
      throw new Error("Cursor de sincronización inválido");
    visited.add(page.nextCursor);
    cursor = page.nextCursor;
  } while (cursor);
  signal.throwIfAborted();
  // Cancel concurrent pagination/refetch before committing, retaining its cached pages.
  await client.cancelQueries({ queryKey: key });
  signal.throwIfAborted();
  client.setQueryData<InfiniteData<MessagesPage>>(key, (current) => {
    if (!current?.pages.length) {
      return {
        pages: [
          { ...firstPage!, messages: mergeMessages(conversationId, recovered) },
        ],
        pageParams: [null],
      };
    }
    const olderIds = new Set(
      current.pages
        .slice(1)
        .flatMap((page) => page.messages.map((message) => message.id)),
    );
    return {
      ...current,
      pages: [
        {
          ...current.pages[0],
          messages: mergeMessages(conversationId, [
            ...current.pages[0].messages,
            ...recovered,
          ]).filter((message) => !olderIds.has(message.id)),
        },
        ...current.pages.slice(1),
      ],
    };
  });
}
