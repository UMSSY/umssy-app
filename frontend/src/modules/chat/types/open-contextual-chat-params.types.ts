export interface OpenContextualChatParams {
  contactId: string;
  context: { contextType: string; contextId: string };
  contactHeadline?: string | null;
  launcherId?: string | null;
}
