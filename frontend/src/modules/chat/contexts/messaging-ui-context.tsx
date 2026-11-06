"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { MessagingUiContextValue } from "../types/messaging-ui-context-value.types";

import type { MessagingUiProviderProps } from "../types/messaging-ui-provider-props.types";

const MessagingUiContext = createContext<MessagingUiContextValue | null>(null);

export function MessagingUiProvider({ children }: MessagingUiProviderProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const setDraft = useCallback((conversationId: string, content: string) => {
    setDrafts((current) => ({ ...current, [conversationId]: content }));
  }, []);
  const clearSubmittedDraft = useCallback((conversationId: string, submittedContent: string) => {
    setDrafts((current) => current[conversationId] === submittedContent ? { ...current, [conversationId]: "" } : current);
  }, []);
  const value = useMemo(() => ({ selectedId, setSelectedId, drafts, setDraft, clearSubmittedDraft, isSending, setIsSending, isPanelOpen, setIsPanelOpen }), [selectedId, drafts, setDraft, clearSubmittedDraft, isSending, isPanelOpen]);
  return <MessagingUiContext value={value}>{children}</MessagingUiContext>;
}

export function useMessagingUi() {
  return useContext(MessagingUiContext);
}
