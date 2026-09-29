import { Conversation } from '../types/conversation.types';
import { MOCK_CONVERSATIONS } from '../mocks/mock-conversations';

export async function getConversations(): Promise<Conversation[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));

  return [...MOCK_CONVERSATIONS].sort((a, b) => {
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}