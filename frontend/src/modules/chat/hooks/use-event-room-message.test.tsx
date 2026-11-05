
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSendEventRoomMessage } from './use-event-room-message';
import { messagesQueryKey } from '../constants/messages-query-key';

vi.mock('../services/chat-api', () => ({
  sendMessage: vi.fn(),
}));

import { sendMessage } from '../services/chat-api';
import type { Message } from '../types/conversation.types';

const mockedSendMessage = vi.mocked(sendMessage);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { invalidateQueries, wrapper };
}

describe('useSendEventRoomMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should start idle with no error', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useSendEventRoomMessage('conv-1'),
      { wrapper },
    );

    expect(result.current.isSending).toBe(false);
    expect(result.current.sendError).toBeNull();
  });

  it('should send a message, refresh messages and return it on success', async () => {
    const sentMessage = {
      id: 'msg-1',
      conversationId: 'conv-1',
      senderId: 'current-user',
      content: 'Hola',
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      status: 'sent' as const,
    };
    mockedSendMessage.mockResolvedValue({
      data: sentMessage,
      ok: true,
      statusCode: 200,
      detail: 'Mensaje enviado',
    });
    const { invalidateQueries, wrapper } = createWrapper();

    const { result } = renderHook(
      () => useSendEventRoomMessage('conv-1'),
      { wrapper },
    );

    let returned: Message | null = null;
    await act(async () => {
      returned = await result.current.send('Hola');
    });

    expect(mockedSendMessage).toHaveBeenCalledWith({
      conversationId: 'conv-1',
      content: 'Hola',
    });

    await waitFor(() => {
      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: messagesQueryKey('conv-1'),
      });
    });

    expect(returned).toEqual(sentMessage);
    expect(result.current.isSending).toBe(false);
    expect(result.current.sendError).toBeNull();
  });

  it('should return null and set error when sending fails', async () => {
    mockedSendMessage.mockRejectedValue(new Error('Error de red'));
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useSendEventRoomMessage('conv-1'),
      { wrapper },
    );

    let returned: Message | null = null;
    await act(async () => {
      returned = await result.current.send('Hola');
    });

    expect(returned).toBeNull();

    await waitFor(() => {
      expect(result.current.sendError).toBe('Error de red');
    });

    expect(result.current.isSending).toBe(false);
  });

  it('should do nothing when there is no conversation id', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useSendEventRoomMessage(null),
      { wrapper },
    );

    const returned = await result.current.send('Hola');

    expect(returned).toBeNull();
    expect(mockedSendMessage).not.toHaveBeenCalled();
  });

  it('should clear the error when clearError is called', async () => {
    mockedSendMessage.mockRejectedValue(new Error('Error de red'));
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useSendEventRoomMessage('conv-1'),
      { wrapper },
    );

    await act(async () => {
      await result.current.send('Hola');
    });

    await waitFor(() => {
      expect(result.current.sendError).toBe('Error de red');
    });

    act(() => {
      result.current.clearError();
    });

    await waitFor(() => {
      expect(result.current.sendError).toBeNull();
    });
  });
});