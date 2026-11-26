import { describe, expect, it, vi } from 'vitest';

import { ChatService } from '../services/chat.service.js';
import type { ChatRepository } from '../repositories/chat.repository.js';
import type { ConversationRepository } from '../repositories/conversation.repository.js';

describe('ChatService', () => {
  it('includes event room conversations in the active ids used by conversation:join', async () => {
    const findUserConversations = vi
      .fn()
      .mockResolvedValue([
        { id: 'direct-conversation' },
        { id: 'event-conversation' },
      ]);

    const service = new ChatService(
      {} as ChatRepository,
      { findUserConversations } as unknown as ConversationRepository,
    );

    await expect(service.getActiveConversationIds('user-1')).resolves.toEqual([
      'direct-conversation',
      'event-conversation',
    ]);
    expect(findUserConversations).toHaveBeenCalledWith('user-1');
  });
});
