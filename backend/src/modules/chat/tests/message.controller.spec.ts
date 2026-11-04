import { describe, expect, it, vi } from 'vitest';

import { MessageController } from '../controllers/message.controller.js';
import type { MessageService } from '../services/message.service.js';
import type { ChatGateway } from '../gateways/chat.gateway.js';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user.types.js';

const user = { id: 'user-1' } as AuthenticatedUser;

describe('MessageController', () => {
  it('broadcasts the saved HTTP message to the conversation room', async () => {
    const message = {
      id: 'message-1',
      conversationId: 'conversation-1',
      senderId: 'user-1',
      content: 'Hola grupo',
      timestamp: '2026-11-04T12:00:00.000Z',
      createdAt: '2026-11-04T12:00:00.000Z',
      status: 'sent' as const,
      isAttachment: false,
      attachmentType: null,
    };
    const send = vi.fn().mockResolvedValue(message);
    const broadcastMessage = vi.fn();
    const controller = new MessageController(
      { send } as unknown as MessageService,
      { broadcastMessage } as unknown as ChatGateway,
    );

    await expect(
      controller.send(
        { conversationId: 'conversation-1', content: 'Hola grupo' },
        user,
      ),
    ).resolves.toEqual(message);
    expect(send).toHaveBeenCalledWith({
      conversationId: 'conversation-1',
      senderId: 'user-1',
      content: 'Hola grupo',
    });
    expect(broadcastMessage).toHaveBeenCalledWith(message);
  });

  it('does not broadcast when the message could not be saved', async () => {
    const send = vi.fn().mockRejectedValue(new Error('No se pudo enviar'));
    const broadcastMessage = vi.fn();
    const controller = new MessageController(
      { send } as unknown as MessageService,
      { broadcastMessage } as unknown as ChatGateway,
    );

    await expect(
      controller.send(
        { conversationId: 'conversation-1', content: 'Hola grupo' },
        user,
      ),
    ).rejects.toThrow('No se pudo enviar');
    expect(broadcastMessage).not.toHaveBeenCalled();
  });
});
