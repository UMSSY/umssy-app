import type { Dispatch, SetStateAction } from "react";

export interface MessagingUiContextValue {
  selectedId: string | null;
  setSelectedId: Dispatch<SetStateAction<string | null>>;
  drafts: Record<string, string>;
  setDraft: (conversationId: string, content: string) => void;
  clearSubmittedDraft: (conversationId: string, submittedContent: string) => void;
  isSending: boolean;
  setIsSending: Dispatch<SetStateAction<boolean>>;
  isPanelOpen: boolean;
  setIsPanelOpen: Dispatch<SetStateAction<boolean>>;
}
