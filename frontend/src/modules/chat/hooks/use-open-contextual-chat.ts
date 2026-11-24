"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CONVERSATIONS_QUERY_KEY } from "../constants/conversations-query-key";
import { useMessagingUi } from "../contexts/messaging-ui-context";
import { getOrCreateConversation } from "../services/chat-api";
import type { Conversation } from "../types/conversation.types";
import type { OpenContextualChatParams } from "../types/open-contextual-chat-params.types";
import type { UseOpenContextualChatResult } from "../types/use-open-contextual-chat-result.types";
import { findConversationByContext } from "../utils/find-conversation-by-context";
import { upsertConversation } from "../utils/upsert-conversation";

function withContactHeadline(conversation: Conversation, headline?: string | null): Conversation {
  if (!headline || !conversation.contact || conversation.contact.headline) return conversation;
  return { ...conversation, contact: { ...conversation.contact, headline } };
}

export function useOpenContextualChat(): UseOpenContextualChatResult {
  const queryClient = useQueryClient();
  const ui = useMessagingUi();

  const mutation = useMutation({
    mutationFn: async ({ contactId, context, contactHeadline }: OpenContextualChatParams) => {
      const current = queryClient.getQueryData<Conversation[]>(CONVERSATIONS_QUERY_KEY) ?? [];
      const found =
        findConversationByContext(current, context.contextId) ??
        (await getOrCreateConversation(contactId, context));
      return withContactHeadline(found, contactHeadline);
    },
    onSuccess: (conversation, { launcherId }) => {
      queryClient.setQueryData<Conversation[]>(CONVERSATIONS_QUERY_KEY, (list) =>
        upsertConversation(list ?? [], conversation),
      );
      ui?.setLauncherId(launcherId ?? null);
      ui?.setSelectedId(conversation.id);
      ui?.setIsPanelOpen(true);
    },
  });

  return { openContextualChat: mutation.mutateAsync, isOpening: mutation.isPending };
}
