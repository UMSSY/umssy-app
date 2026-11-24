"use client";

import { useMutation } from "@tanstack/react-query";
import { useMessagingUi } from "../contexts/messaging-ui-context";
import type { UseOpenContextualChatResult } from "../types/use-open-contextual-chat-result.types";
import { useResolveContextualConversation } from "./use-resolve-contextual-conversation";

export function useOpenContextualChat(): UseOpenContextualChatResult {
  const ui = useMessagingUi();
  const resolveContextualConversation = useResolveContextualConversation();

  const mutation = useMutation({
    mutationFn: resolveContextualConversation,
    onSuccess: (conversation, { launcherId }) => {
      ui?.setLauncherId(launcherId ?? null);
      ui?.setSelectedId(conversation.id);
      ui?.setIsPanelOpen(true);
    },
  });

  return { openContextualChat: mutation.mutateAsync, isOpening: mutation.isPending };
}
