import { describe, expect, it, vi } from 'vitest';
import { ChatGateway } from '../gateways/chat.gateway.js';
import { ChatVisibilityService } from '../services/chat-visibility.service.js';

const USER_ID = 'user-a';
const CONVERSATION_ID = 'conv-1';

function buildGateway(visibility: ChatVisibilityService) {
  let releaseLookup: () => void = () => undefined;
  const lookup = new Promise<void>((resolve) => {
    releaseLookup = resolve;
  });
  const chatService = {
    getActiveConversationIds: vi.fn(async () => {
      await lookup;
      return [CONVERSATION_ID];
    }),
  };
  const gateway = new ChatGateway(
    {} as never,
    {} as never,
    chatService as never,
    {} as never,
    {} as never,
    {} as never,
    visibility,
  );
  const client = {
    id: 'socket-1',
    data: { user: { id: USER_ID } },
    join: vi.fn().mockResolvedValue(undefined),
  };

  return { gateway, client, releaseLookup };
}

describe('ChatGateway: conversation:join y visibilidad (ROSEMARY-494)', () => {
  it('no marca la conversación como abierta al unirse con la app minimizada', async () => {
    const visibility = new ChatVisibilityService();
    const { gateway, client, releaseLookup } = buildGateway(visibility);

    const joining = gateway.joinConversation(client as never, {
      conversationId: CONVERSATION_ID,
    } as never);
    gateway.handleVisibilityChanged(client as never, {
      conversationId: CONVERSATION_ID,
      isFocused: false,
    });
    releaseLookup();

    await expect(joining).resolves.toEqual({ ok: true });
    expect(visibility.isConversationOpen(USER_ID, CONVERSATION_ID)).toBe(false);
  });

  it('respeta la visibilidad informada cuando la app está en primer plano', async () => {
    const visibility = new ChatVisibilityService();
    const { gateway, client, releaseLookup } = buildGateway(visibility);

    gateway.handleVisibilityChanged(client as never, {
      conversationId: CONVERSATION_ID,
      isFocused: true,
    });
    const joining = gateway.joinConversation(client as never, {
      conversationId: CONVERSATION_ID,
    } as never);
    releaseLookup();

    await expect(joining).resolves.toEqual({ ok: true });
    expect(visibility.isConversationOpen(USER_ID, CONVERSATION_ID)).toBe(true);
  });
});