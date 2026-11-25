import type { Conversation } from "./conversation.types";
import type { OpenContextualChatParams } from "./open-contextual-chat-params.types";

export interface UseOpenContextualChatResult {
  openContextualChat: (params: OpenContextualChatParams) => Promise<Conversation>;
  isOpening: boolean;
}
