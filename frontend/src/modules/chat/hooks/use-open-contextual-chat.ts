"use client";

import { useMutation } from "@tanstack/react-query";
import { useMessagingUi } from "../contexts/messaging-ui-context";
import type { UseOpenContextualChatResult } from "../types/use-open-contextual-chat-result.types";
import { useResolveContextualConversation } from "./use-resolve-contextual-conversation";
import type { OpenContextualChatParams } from "../types/open-contextual-chat-params.types";

export function useOpenContextualChat(): UseOpenContextualChatResult {
  const ui = useMessagingUi();
  const resolveContextualConversation = useResolveContextualConversation();

  const mutation = useMutation({
    mutationFn: (params: OpenContextualChatParams) => resolveContextualConversation(params),
    onSuccess: (conversation, { launcherId }) => {
      ui?.setLauncherId(launcherId ?? null);
      ui?.setSelectedId(conversation.id);
      ui?.setIsPanelOpen(true);
    },
  });

  return { openContextualChat: mutation.mutateAsync, isOpening: mutation.isPending };
}
