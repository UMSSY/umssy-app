import { renderHook, act } from '@testing-library/react';
import type { Socket } from 'socket.io-client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { getActiveConversationId } from '@/modules/chat';
import { getAccessToken } from '@/shared/services/storage/access-token-storage';
import { useNotificationToasts } from '../hooks/use-notification-toasts';
import { getNotificationsSocket } from '../services/notifications-socket';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock('@/modules/chat', () => ({
  getActiveConversationId: vi.fn(() => null),
}));

vi.mock('sonner', () => ({
  toast: vi.fn(),
}));

vi.mock('@/shared/services/storage/access-token-storage', () => ({
  getAccessToken: vi.fn(),
  subscribeAccessToken: vi.fn(() => () => undefined),
}));

vi.mock('../services/notifications-socket', () => ({
  getNotificationsSocket: vi.fn(),
  resetNotificationsSocket: vi.fn(),
}));

function createSocket() {
  const listeners: Record<string, ((...args: unknown[]) => void)[]> = {};
  return {
    on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(handler);
    }),
    off: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter((h) => h !== handler);
      }
    }),
    emitEvent: (event: string, data: unknown) => {
      listeners[event]?.forEach((handler) => handler(data));
    },
  };
}

describe('useNotificationToasts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('no suscribe al socket si no hay sesión activa', () => {
    vi.mocked(getAccessToken).mockReturnValue(null);

    renderHook(() => useNotificationToasts());

    expect(getNotificationsSocket).not.toHaveBeenCalled();
  });

  it("se suscribe a 'notification:new' y dispara un toast al recibir una notificación", () => {
    const socket = createSocket();
    vi.mocked(getAccessToken).mockReturnValue('fake-token');
    vi.mocked(getNotificationsSocket).mockReturnValue(
      socket as unknown as Socket,
    );

    renderHook(() => useNotificationToasts());

    expect(socket.on).toHaveBeenCalledWith(
      'notification:new',
      expect.any(Function),
    );

    act(() => {
      socket.emitEvent('notification:new', {
        typeCode: 'CHAT_MESSAGE',
        title: 'Mensaje nuevo de: Juan Pérez',
        body: 'Hola, ¿cómo estás?',
        actionUrl: '/chat?conversationId=conv-123',
      });
    });

    expect(toast).toHaveBeenCalledTimes(1);
    expect(toast).toHaveBeenCalledWith('Mensaje nuevo de: Juan Pérez', {
      description: 'Hola, ¿cómo estás?',
      duration: 7000,
      action: {
        label: 'Ir al chat',
        onClick: expect.any(Function),
      },
    });

    // Probar el onClick de la acción
    const callArgs = vi.mocked(toast).mock.calls[0][1] as {
      action?: { onClick: () => void };
    };
    callArgs.action?.onClick();
    expect(mockPush).toHaveBeenCalledWith('/chat?conversationId=conv-123');
  });

  it('usa la etiqueta del catálogo según el tipo, no según el título', () => {
    const socket = createSocket();
    vi.mocked(getAccessToken).mockReturnValue('fake-token');
    vi.mocked(getNotificationsSocket).mockReturnValue(
      socket as unknown as Socket,
    );

    renderHook(() => useNotificationToasts());

    act(() => {
      socket.emitEvent('notification:new', {
        typeCode: 'CONNECTION_REQUEST_ACCEPTED',
        title: 'Tienes un mensaje',
        body: 'Ya pueden conversar',
        actionUrl: '/chat?conversationId=1',
      });
    });

    const options = vi.mocked(toast).mock.calls[0][1] as {
      action?: { label: string };
    };
    expect(options.action?.label).toBe('Ir a la sala de chat');
  });

  it('usa la etiqueta por defecto si el evento no trae un tipo conocido', () => {
    const socket = createSocket();
    vi.mocked(getAccessToken).mockReturnValue('fake-token');
    vi.mocked(getNotificationsSocket).mockReturnValue(
      socket as unknown as Socket,
    );

    renderHook(() => useNotificationToasts());

    act(() => {
      socket.emitEvent('notification:new', {
        title: 'Aviso general',
        body: 'Detalle',
        actionUrl: '/dashboard',
      });
    });

    const options = vi.mocked(toast).mock.calls[0][1] as {
      action?: { label: string };
    };
    expect(options.action?.label).toBe('Ver detalle');
  });

  it('desuscribe el evento al desmontar el hook', () => {
    const socket = createSocket();
    vi.mocked(getAccessToken).mockReturnValue('fake-token');
    vi.mocked(getNotificationsSocket).mockReturnValue(
      socket as unknown as Socket,
    );

    const { unmount } = renderHook(() => useNotificationToasts());

    unmount();

    expect(socket.off).toHaveBeenCalledWith(
      'notification:new',
      expect.any(Function),
    );
  });
  it('no muestra el toast de la conversación que el usuario tiene abierta', () => {
    const socket = createSocket();
    vi.mocked(getAccessToken).mockReturnValue('fake-token');
    vi.mocked(getNotificationsSocket).mockReturnValue(
      socket as unknown as Socket,
    );
    vi.mocked(getActiveConversationId).mockReturnValue('conv-123');
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });

    renderHook(() => useNotificationToasts());

    act(() => {
      socket.emitEvent('notification:new', {
        typeCode: 'CHAT_MESSAGE',
        title: 'Mensaje nuevo de: Juan Pérez',
        body: 'Hola',
        actionUrl: '/chat?conversationId=conv-123',
      });
    });

    expect(toast).not.toHaveBeenCalled();
  });
});