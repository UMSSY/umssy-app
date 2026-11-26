"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CONVERSATIONS_QUERY_KEY } from "../constants/conversations-query-key";
import { getOrCreateConversation } from "../services/chat-api";
import type { Conversation } from "../types/conversation.types";
import type { ResolveContextualConversationParams } from "../types/resolve-contextual-conversation-params.types";
import { findConversationByContext } from "../utils/find-conversation-by-context";
import { upsertConversation } from "../utils/upsert-conversation";
import { withContactHeadline } from "../utils/with-contact-headline";

export function useResolveContextualConversation() {
  const queryClient = useQueryClient();

  return useCallback(
    async ({ contactId, context, contactHeadline }: ResolveContextualConversationParams): Promise<Conversation> => {
      const current = queryClient.getQueryData<Conversation[]>(CONVERSATIONS_QUERY_KEY) ?? [];
      const found =
        findConversationByContext(current, context.contextId) ??
        (await getOrCreateConversation(contactId, context));
      const conversation = withContactHeadline(found, contactHeadline);
      queryClient.setQueryData<Conversation[]>(CONVERSATIONS_QUERY_KEY, (list) =>
        upsertConversation(list ?? [], conversation),
      );
      return conversation;
    },
    [queryClient],
  );
}
