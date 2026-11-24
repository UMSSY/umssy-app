import type { ResolveContextualConversationParams } from "./resolve-contextual-conversation-params.types";

export interface OpenContextualChatParams extends ResolveContextualConversationParams {
  launcherId?: string | null;
}
