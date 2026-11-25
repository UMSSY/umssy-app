export interface ResolveContextualConversationParams {
  contactId: string;
  context: { contextType: string; contextId: string };
  contactHeadline?: string | null;
}
